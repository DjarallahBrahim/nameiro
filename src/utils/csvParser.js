/**
 * CSV Parser Utility
 * Detects column types and suggests mappings
 */

/**
 * Detect the type of a column based on its values
 */
export const detectColumnType = (values) => {
    const nonEmptyValues = values.filter(v => v && v.trim() !== '');
    if (nonEmptyValues.length === 0) return 'text';

    // Check if values are numbers FIRST (before dates)
    const numberCount = nonEmptyValues.filter(v => {
        const cleaned = v.replace(/[$,]/g, '').trim();
        // Must be a valid number and not empty
        return !isNaN(cleaned) && cleaned !== '' && /^-?\d+\.?\d*$/.test(cleaned);
    }).length;

    if (numberCount / nonEmptyValues.length > 0.7) return 'number';

    // Check if values are dates (more strict patterns)
    const datePatterns = [
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,     // MM/DD/YYYY or DD/MM/YYYY
        /^\d{4}-\d{2}-\d{2}/,               // YYYY-MM-DD
        /^\d{1,2}-\d{1,2}-\d{2,4}$/,       // MM-DD-YYYY or DD-MM-YYYY
        /^\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}/, // Date with time
    ];

    const dateCount = nonEmptyValues.filter(v => {
        const trimmed = v.trim();
        // Must match a date pattern (don't use Date.parse as it's too permissive)
        return datePatterns.some(pattern => pattern.test(trimmed));
    }).length;

    if (dateCount / nonEmptyValues.length > 0.7) return 'date';

    return 'text';
};

/**
 * Analyze CSV columns and suggest mappings
 */
export const analyzeColumns = (headers, rows) => {
    const columns = headers.map((header, index) => {
        // Get sample values for this column
        const values = rows.slice(0, 10).map(row => row[index] || '');
        const type = detectColumnType(values);

        return {
            name: header,
            type,
            sample: values.slice(0, 3).filter(v => v && v.trim() !== '')
        };
    });

    return columns;
};

/**
 * Suggest column mappings based on column names and types
 */
export const suggestMappings = (columns) => {
    const suggestions = {
        domainColumn: null,
        dateColumn: null,
        priceColumn: null
    };

    // Domain column - look for text columns with domain-like names
    const domainKeywords = ['domain', 'name', 'url', 'website', 'site'];
    const domainColumn = columns.find(col =>
        col.type === 'text' &&
        domainKeywords.some(keyword => col.name.toLowerCase().includes(keyword))
    );
    suggestions.domainColumn = domainColumn?.name || columns.find(c => c.type === 'text')?.name || null;

    // Date column - look for date columns with auction/end keywords
    const dateKeywords = ['date', 'end', 'auction', 'expir', 'close'];
    const dateColumn = columns.find(col =>
        col.type === 'date' &&
        dateKeywords.some(keyword => col.name.toLowerCase().includes(keyword))
    );
    suggestions.dateColumn = dateColumn?.name || columns.find(c => c.type === 'date')?.name || null;

    // Price column - look for number columns with price/bid keywords
    const priceKeywords = ['price', 'bid', 'amount', 'value', 'cost', 'usd', 'eur'];
    const priceColumn = columns.find(col =>
        col.type === 'number' &&
        priceKeywords.some(keyword => col.name.toLowerCase().includes(keyword))
    );
    suggestions.priceColumn = priceColumn?.name || columns.find(c => c.type === 'number')?.name || null;

    return suggestions;
};

/**
 * Parse CSV file and extract headers and rows
 * Intelligently skips metadata lines and finds true header row
 */
export const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());

                if (lines.length === 0) {
                    reject(new Error('CSV file is empty'));
                    return;
                }

                // Find the true header row
                let headerRowIndex = 0;
                let headers = [];
                let bestScore = 0;

                // Look for header row in first 10 lines
                for (let i = 0; i < Math.min(lines.length, 10); i++) {
                    const line = lines[i];
                    const lowerLine = line.toLowerCase();
                    const columns = line.split(',').map(c => c.trim());

                    // Skip lines that are clearly not headers
                    if (columns.length < 2) continue; // Headers should have at least 2 columns
                    if (line.startsWith('****') || line.startsWith('###') ||
                        line.startsWith('//') || line.startsWith('#')) continue;

                    // Score this line as a potential header
                    let score = 0;

                    // Check for header keywords
                    const headerKeywords = ['domain', 'name', 'url', 'date', 'end', 'auction',
                        'price', 'bid', 'value', 'tld', 'extension', 'current'];

                    columns.forEach(col => {
                        const colLower = col.toLowerCase();
                        // Each column with a header keyword adds to score
                        if (headerKeywords.some(keyword => colLower.includes(keyword))) {
                            score += 10;
                        }
                        // Columns with typical header characteristics
                        if (col.length > 0 && col.length < 50) score += 1; // Reasonable length
                        if (/^[a-zA-Z\s]+$/.test(col)) score += 2; // Only letters and spaces
                    });

                    // Penalize lines that look like data
                    if (columns.some(col => /^\d+$/.test(col))) score -= 5; // Contains pure numbers
                    if (columns.some(col => /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(col))) score -= 5; // Contains dates
                    if (columns.some(col => col.includes('.com') || col.includes('.net'))) score -= 5; // Contains domains

                    // This line scores better than previous best
                    if (score > bestScore) {
                        bestScore = score;
                        headerRowIndex = i;
                        headers = columns.map(h => h.trim().replace(/^"|"$/g, ''));
                    }
                }

                // Fallback: if no good header found, use first line with multiple columns
                if (headers.length === 0 || bestScore < 5) {
                    for (let i = 0; i < Math.min(lines.length, 10); i++) {
                        const line = lines[i];
                        const columns = line.split(',').map(c => c.trim());
                        if (columns.length >= 2 &&
                            !line.startsWith('****') &&
                            !line.startsWith('###')) {
                            headerRowIndex = i;
                            headers = columns.map(h => h.trim().replace(/^"|"$/g, ''));
                            break;
                        }
                    }
                }

                if (headers.length === 0) {
                    reject(new Error('Could not find valid headers in CSV file'));
                    return;
                }

                // Parse rows starting after header
                const rows = lines.slice(headerRowIndex + 1).map(line => {
                    return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
                });

                // Filter out empty rows
                const validRows = rows.filter(row =>
                    row.some(cell => cell && cell.trim() !== '')
                );

                resolve({ headers, rows: validRows });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};
