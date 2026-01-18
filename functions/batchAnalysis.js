const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Filter domains - remove those with numbers or hyphens
 */
function filterDomains(domains) {
    return domains.filter(domain => {
        if (!domain || typeof domain !== 'string') return false;
        const domainName = domain.split('.')[0];
        if (/\d/.test(domainName) || domainName.includes('-')) return false;
        return true;
    });
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Replicate API for batch of domains
 */
async function callReplicateAPI(domains, apiKey) {
    const domainsString = domains.map(d => d.toLowerCase()).join(',');

    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${apiKey}`
        },
        body: JSON.stringify({
            version: "a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
            input: { domains: domainsString }
        })
    });

    if (!startResponse.ok) throw new Error(`API error: ${startResponse.status}`);

    const prediction = await startResponse.json();
    const predictionId = prediction.id;

    let result = prediction;
    let attempts = 0;

    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 120) {
        await sleep(1500);
        attempts++;

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { 'Authorization': `Token ${apiKey}` }
        });

        if (!pollResponse.ok) throw new Error(`Poll failed: ${pollResponse.status}`);
        result = await pollResponse.json();
    }

    if (result.status === "succeeded" && result.output?.valuations) {
        return result.output.valuations;
    }

    throw new Error('Prediction failed or timed out');
}

/**
 * Background processing with original CSV data preservation
 */
async function processInBackground(jobId, domains, minValue, apiKey, userId, originalData, columnMappings, csvHeaders) {
    const db = admin.firestore();

    try {
        const BATCH_SIZE = 2500;
        const batches = [];

        for (let i = 0; i < domains.length; i += BATCH_SIZE) {
            batches.push(domains.slice(i, i + BATCH_SIZE));
        }

        const allResults = [];

        for (let i = 0; i < batches.length; i++) {
            try {
                logger.info(`Processing batch ${i + 1}/${batches.length}`);

                const valuations = await callReplicateAPI(batches[i], apiKey);
                const qualifying = valuations.filter(v => (v.marketplace || 0) >= minValue);
                allResults.push(...qualifying);

                await db.collection('batchJobs').doc(jobId).update({
                    currentBatch: i + 1,
                    processedDomains: (i + 1) * BATCH_SIZE,
                    qualifyingDomains: allResults.length,
                    progress: Math.round(((i + 1) / batches.length) * 100)
                });

                if (i < batches.length - 1) await sleep(10000);
                if ((i + 1) % 6 === 0 && i < batches.length - 1) await sleep(60000);

            } catch (error) {
                logger.error(`Batch ${i + 1} failed:`, error);
            }
        }

        // Create valuation lookup map
        const valuationMap = {};
        allResults.forEach(r => {
            valuationMap[r.domain.toLowerCase()] = r;
        });

        // Generate CSV with original columns + HumbleWorth columns
        const headers = [...csvHeaders, 'Marketplace_Value', 'Brokerage_Value', 'Auction_Value'];

        const csvRows = [];

        // Process original data and add HumbleWorth values
        originalData.forEach(row => {
            const domain = typeof row === 'object' && !Array.isArray(row)
                ? row[columnMappings.domainColumn]
                : row[0];

            if (!domain) return;

            const valuation = valuationMap[domain.toLowerCase()];
            if (!valuation) return; // Skip non-qualifying domains

            // Build row with original data
            const rowData = [];
            csvHeaders.forEach(header => {
                const value = typeof row === 'object' && !Array.isArray(row)
                    ? row[header]
                    : row[csvHeaders.indexOf(header)];
                rowData.push(`"${value || ''}"`);
            });

            // Add HumbleWorth values
            rowData.push(`"${valuation.marketplace || 0}"`);
            rowData.push(`"${valuation.brokerage || 0}"`);
            rowData.push(`"${valuation.auction || 0}"`);

            csvRows.push(rowData.join(','));
        });

        const csvContent = headers.join(',') + '\n' + csvRows.join('\n');

        // Upload to Storage
        const bucket = admin.storage().bucket();
        const fileName = `batch-results/${userId}/${Date.now()}.csv`;
        const file = bucket.file(fileName);
        const uuid = require('crypto').randomUUID();

        await file.save(csvContent, {
            metadata: {
                contentType: 'text/csv',
                metadata: { firebaseStorageDownloadTokens: uuid }
            }
        });

        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${uuid}`;

        await db.collection('batchJobs').doc(jobId).update({
            status: 'completed',
            downloadUrl: url,
            progress: 100
        });

        logger.info(`Job ${jobId} completed: ${allResults.length} domains`);

    } catch (error) {
        logger.error(`Job ${jobId} failed:`, error);
        await db.collection('batchJobs').doc(jobId).update({
            status: 'failed',
            errors: [{ message: error.message, timestamp: Date.now() }]
        });
    }
}

/**
 * Main function - returns immediately
 */
exports.processBatchAnalysis = onCall({ timeoutSeconds: 60, memory: "512MiB" }, async (request) => {
    const { data, auth } = request;

    if (!auth) throw new Error('Authentication required');

    const { csvData, csvHeaders, columnMappings, minMarketplaceValue = 0, apiKey } = data;
    if (!csvData || !columnMappings || !apiKey) throw new Error('Missing parameters');

    // Extract headers - use provided headers or get from first row
    const headers = csvHeaders || (csvData.length > 0 && typeof csvData[0] === 'object' && !Array.isArray(csvData[0])
        ? Object.keys(csvData[0])
        : Object.values(columnMappings));

    const db = admin.firestore();
    const jobId = `job_${Date.now()}_${auth.uid}`;

    // Extract and filter domains
    const domainValues = csvData.map(row =>
        typeof row === 'object' && !Array.isArray(row) ? row[columnMappings.domainColumn] : row[0]
    ).filter(Boolean);

    const filteredDomains = filterDomains(domainValues);

    // Create job
    await db.collection('batchJobs').doc(jobId).set({
        userId: auth.uid,
        status: 'processing',
        minMarketplaceValue,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        totalDomains: csvData.length,
        filteredDomains: filteredDomains.length,
        processedDomains: 0,
        qualifyingDomains: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(filteredDomains.length / 2500),
        progress: 0
    });

    // Start background processing with original CSV data and headers
    processInBackground(jobId, filteredDomains, minMarketplaceValue, apiKey, auth.uid, csvData, columnMappings, headers)
        .catch(err => logger.error(`Background error:`, err));

    // Return immediately
    return {
        success: true,
        jobId,
        totalDomains: filteredDomains.length
    };
});
