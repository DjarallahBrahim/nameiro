import { useState } from 'react';
import { parseCSVFile, analyzeColumns, suggestMappings } from '../utils/csvParser';

/**
 * Custom hook for managing domain data and CSV file processing
 * Now supports dynamic column mapping
 */
export const useDomainData = () => {
    const [rawDomains, setRawDomains] = useState([]);
    const [domains, setDomains] = useState([]);
    const [originalCount, setOriginalCount] = useState(0);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [auctionEndResults, setAuctionEndResults] = useState({});
    const [priceResults, setPriceResults] = useState({});
    const [hasAuctionData, setHasAuctionData] = useState(false);
    const [availableAuctionDates, setAvailableAuctionDates] = useState([]);
    const [auctionDateCounts, setAuctionDateCounts] = useState({});

    // Column mapping states
    const [showColumnMapping, setShowColumnMapping] = useState(false);
    const [pendingCSVData, setPendingCSVData] = useState(null);
    const [detectedColumns, setDetectedColumns] = useState([]);
    const [suggestedColumnMappings, setSuggestedColumnMappings] = useState(null);

    /**
     * Initial file upload - analyze columns and show mapping modal
     */
    const handleFileUpload = async (file) => {
        try {
            const { headers, rows } = await parseCSVFile(file);

            // Analyze columns
            const columns = analyzeColumns(headers, rows);
            const suggestions = suggestMappings(columns);

            // Store data and show mapping modal
            setPendingCSVData({ headers, rows });
            setDetectedColumns(columns);
            setSuggestedColumnMappings(suggestions);
            setShowColumnMapping(true);
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Failed to parse CSV file. Please check the file format.');
        }
    };

    /**
     * Process CSV with user-selected column mappings
     */
    const processWithMappings = (mappings) => {
        if (!pendingCSVData || !mappings.domainColumn) {
            alert('Domain column is required');
            return;
        }

        const { headers, rows } = pendingCSVData;

        // Find column indices
        const domainColIndex = headers.indexOf(mappings.domainColumn);
        const dateColIndex = mappings.dateColumn ? headers.indexOf(mappings.dateColumn) : -1;
        const priceColIndex = mappings.priceColumn ? headers.indexOf(mappings.priceColumn) : -1;

        const extractedDomains = [];
        const extractedAuctionDates = {};
        const extractedPrices = {};
        let foundAuctionData = false;
        let foundPriceData = false;

        // Process each row
        rows.forEach(row => {
            const domain = row[domainColIndex]?.trim();
            if (!domain) return;

            extractedDomains.push(domain);

            // Extract date if mapped
            if (dateColIndex !== -1 && row[dateColIndex]) {
                const dateStr = row[dateColIndex].trim();
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj.getTime())) {
                    extractedAuctionDates[domain] = dateObj.getTime();
                    foundAuctionData = true;
                }
            }

            // Extract price if mapped
            if (priceColIndex !== -1 && row[priceColIndex]) {
                const priceStr = row[priceColIndex].replace(/[$,]/g, '').trim();
                const price = parseFloat(priceStr);
                if (!isNaN(price)) {
                    extractedPrices[domain] = price;
                    foundPriceData = true;
                }
            }
        });

        if (extractedDomains.length > 0) {
            setRawDomains(extractedDomains);
            setAuctionEndResults(extractedAuctionDates);
            setPriceResults(extractedPrices);
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

        // Close modal and clear pending data
        setShowColumnMapping(false);
        setPendingCSVData(null);
    };

    const cancelColumnMapping = () => {
        setShowColumnMapping(false);
        setPendingCSVData(null);
        setDetectedColumns([]);
        setSuggestedColumnMappings(null);
    };

    const resetDomains = () => {
        setDomains([]);
        setRawDomains([]);
        setHasAnalyzed(false);
        setOriginalCount(0);
        setAuctionEndResults({});
        setPriceResults({});
        setHasAuctionData(false);
        setAvailableAuctionDates([]);
        setAuctionDateCounts({});
        setShowColumnMapping(false);
        setPendingCSVData(null);
    };

    return {
        rawDomains,
        setRawDomains,
        domains,
        setDomains,
        originalCount,
        hasAnalyzed,
        handleFileUpload,
        processWithMappings,
        resetDomains,
        auctionEndResults,
        priceResults,
        hasAuctionData,
        availableAuctionDates,
        auctionDateCounts,
        // Column mapping states
        showColumnMapping,
        detectedColumns,
        suggestedColumnMappings,
        cancelColumnMapping
    };
};
