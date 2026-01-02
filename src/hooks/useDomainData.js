import { useState } from 'react';

/**
 * Custom hook for managing domain data and CSV file processing
 */
export const useDomainData = () => {
    const [rawDomains, setRawDomains] = useState([]);
    const [domains, setDomains] = useState([]);
    const [originalCount, setOriginalCount] = useState(0);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [auctionEndResults, setAuctionEndResults] = useState({});
    const [hasAuctionData, setHasAuctionData] = useState(false);
    const [availableAuctionDates, setAvailableAuctionDates] = useState([]);
    const [auctionDateCounts, setAuctionDateCounts] = useState({});

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split(/[\r\n]+/).filter(line => line.trim());

            if (lines.length === 0) return;

            // Find true header row (ignoring metadata lines like "****Auction lists...")
            let headerRowIndex = 0;
            let headers = [];

            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                const row = lines[i].toLowerCase();
                if (row.includes('domain') || row.includes('auction end')) {
                    headerRowIndex = i;
                    headers = lines[i].split(',').map(h => h.trim().toLowerCase());
                    break;
                }
            }

            // Fallback: if no clear header found, try line 0
            if (headers.length === 0 && lines.length > 0) {
                headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            }

            // Robust header detection
            const auctionColIndex = headers.findIndex(h =>
                h === 'auction end' ||
                h === 'auction end date' ||
                h.includes('auction end')
            );

            let domainColIndex = headers.indexOf('domain');
            if (domainColIndex === -1) domainColIndex = 0;

            const extractedDomains = [];
            const extractedAuctionDates = {};
            let foundAuctionData = false;

            const startIdx = headerRowIndex + 1;

            for (let i = startIdx; i < lines.length; i++) {
                const columns = lines[i].split(',').map(c => c.trim());
                if (columns[domainColIndex]) {
                    const domain = columns[domainColIndex].trim();
                    extractedDomains.push(domain);

                    // Extract Auction End Date if available
                    if (auctionColIndex !== -1 && columns[auctionColIndex]) {
                        const dateStr = columns[auctionColIndex].trim();
                        // robustly parse date
                        const dateObj = new Date(dateStr);
                        if (!isNaN(dateObj.getTime())) {
                            extractedAuctionDates[domain] = dateObj.getTime();
                            foundAuctionData = true;
                        }
                    }
                }
            }

            if (extractedDomains.length > 0) {
                setRawDomains(extractedDomains);
                setAuctionEndResults(extractedAuctionDates);
                setHasAuctionData(foundAuctionData);

                // Extract unique dates and counts for the dropdown
                if (foundAuctionData) {
                    const uniqueDates = new Set();
                    const dateCounts = {};

                    Object.values(extractedAuctionDates).forEach(ts => {
                        const dateStr = new Date(ts).toLocaleDateString();
                        uniqueDates.add(dateStr);
                        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                    });

                    // Sort dates chronologically
                    const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(a) - new Date(b));
                    setAvailableAuctionDates(sortedDates);
                    setAuctionDateCounts(dateCounts);
                } else {
                    setAvailableAuctionDates([]);
                    setAuctionDateCounts({});
                }

                setOriginalCount(extractedDomains.length);
                setHasAnalyzed(true);
            }
        };
        reader.readAsText(file);
    };

    const resetDomains = () => {
        setDomains([]);
        setRawDomains([]);
        setHasAnalyzed(false);
        setOriginalCount(0);
        setAuctionEndResults({});
        setHasAuctionData(false);
        setAvailableAuctionDates([]);
        setAuctionDateCounts({});
    };

    return {
        rawDomains,
        setRawDomains,
        domains,
        setDomains,
        originalCount,
        hasAnalyzed,
        processFile,
        resetDomains,
        auctionEndResults,
        hasAuctionData,
        availableAuctionDates,
        auctionDateCounts
    };
};
