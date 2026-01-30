import { useState, useMemo, useEffect } from 'react';

/**
 * Custom hook for managing all filtering logic
 */
export const useFilters = (rawDomains, auctionEndResults, hasAuctionData, priceResults = {}, analysisResults = {}) => {
    // Content filters
    const [excludeNumbers, setExcludeNumbers] = useState(true);
    const [excludeHyphens, setExcludeHyphens] = useState(true);

    // Extension filters
    const [availableExtensions, setAvailableExtensions] = useState([]);
    const [selectedExtensions, setSelectedExtensions] = useState(['.com']);
    const [extensionDropdownOpen, setExtensionDropdownOpen] = useState(false);
    const [extensionCounts, setExtensionCounts] = useState({});

    // Search filters
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState('contains');

    // Block filters
    const [blockQuery, setBlockQuery] = useState('');
    const [blockMode, setBlockMode] = useState('contains');

    // Auction date filters
    const [selectedAuctionDate, setSelectedAuctionDate] = useState('');
    const [auctionDropdownOpen, setAuctionDropdownOpen] = useState(false);

    // Sort order
    const [sortOrder, setSortOrder] = useState('');
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

    // Price sort
    const [priceSort, setPriceSort] = useState('');
    const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);

    // Column sorting
    const [columnSort, setColumnSort] = useState({ column: null, direction: null }); // { column: 'price' | 'hwMarket' | etc., direction: 'asc' | 'desc' }

    // Base filtered domains (after content filters)
    const domains = useMemo(() => {
        if (rawDomains.length === 0) return [];

        return rawDomains.filter(domain => {
            if (excludeNumbers && /\d/.test(domain)) return false;
            if (excludeHyphens && /-/.test(domain)) return false;
            return true;
        });
    }, [rawDomains, excludeNumbers, excludeHyphens]);

    // Update extension stats when domains change
    useEffect(() => {
        if (domains.length === 0) return;

        const tldCounts = {};
        domains.forEach(domain => {
            const tld = domain.substring(domain.lastIndexOf('.')).toLowerCase();
            tldCounts[tld] = (tldCounts[tld] || 0) + 1;
        });

        const sortedExtensions = Object.keys(tldCounts).sort((a, b) => tldCounts[b] - tldCounts[a]);
        setAvailableExtensions(sortedExtensions);
        setExtensionCounts(tldCounts);
    }, [domains]);

    // Fully filtered domains
    const filteredDomains = useMemo(() => {
        let filtered = domains;

        // Filter by selected extensions
        if (selectedExtensions.length > 0) {
            filtered = filtered.filter(domain => {
                const ext = domain.substring(domain.lastIndexOf('.')).toLowerCase();
                return selectedExtensions.includes(ext);
            });
        }

        // Filter by search query
        if (searchQuery) {
            const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);

            if (terms.length > 0) {
                if (searchMode === 'startsWith') {
                    filtered = filtered.filter(domain =>
                        terms.some(term => domain.toLowerCase().startsWith(term))
                    );
                } else if (searchMode === 'endsWith') {
                    filtered = filtered.filter(domain => {
                        const lastDotIndex = domain.lastIndexOf('.');
                        const nameOnly = lastDotIndex !== -1 ? domain.substring(0, lastDotIndex) : domain;
                        return terms.some(term => nameOnly.toLowerCase().endsWith(term));
                    });
                } else {
                    // contains (default)
                    filtered = filtered.filter(domain =>
                        terms.some(term => domain.toLowerCase().includes(term))
                    );
                }
            }
        }

        // Filter by block query (Exclude domains)
        if (blockQuery) {
            const blockTerms = blockQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);

            if (blockTerms.length > 0) {
                if (blockMode === 'startsWith') {
                    filtered = filtered.filter(domain =>
                        !blockTerms.some(term => domain.toLowerCase().startsWith(term))
                    );
                } else if (blockMode === 'endsWith') {
                    filtered = filtered.filter(domain => {
                        const lastDotIndex = domain.lastIndexOf('.');
                        const nameOnly = lastDotIndex !== -1 ? domain.substring(0, lastDotIndex) : domain;
                        return !blockTerms.some(term => nameOnly.toLowerCase().endsWith(term));
                    });
                } else {
                    // contains (default)
                    filtered = filtered.filter(domain =>
                        !blockTerms.some(term => domain.toLowerCase().includes(term))
                    );
                }
            }
        }

        // Filter by Auction Date Dropdown
        if (hasAuctionData && selectedAuctionDate) {
            filtered = filtered.filter(domain => {
                const timestamp = auctionEndResults[domain];
                if (!timestamp) return false;
                return new Date(timestamp).toLocaleDateString() === selectedAuctionDate;
            });
        }

        // Apply Sorting
        if (sortOrder === 'asc') {
            filtered = [...filtered].sort((a, b) => a.length - b.length);
        } else if (sortOrder === 'desc') {
            filtered = [...filtered].sort((a, b) => b.length - a.length);
        }

        // Apply Price Sorting
        if (priceSort === 'asc') {
            // Low to High - domains without price go to the end
            filtered = [...filtered].sort((a, b) => {
                const priceA = priceResults[a];
                const priceB = priceResults[b];
                if (priceA === undefined && priceB === undefined) return 0;
                if (priceA === undefined) return 1;
                if (priceB === undefined) return -1;
                return priceA - priceB;
            });
        } else if (priceSort === 'desc') {
            // High to Low - domains without price go to the end
            filtered = [...filtered].sort((a, b) => {
                const priceA = priceResults[a];
                const priceB = priceResults[b];
                if (priceA === undefined && priceB === undefined) return 0;
                if (priceA === undefined) return 1;
                if (priceB === undefined) return -1;
                return priceB - priceA;
            });
        }

        // Apply Column Sorting (takes precedence over other sorting)
        if (columnSort.column && columnSort.direction) {
            filtered = [...filtered].sort((a, b) => {
                let valueA, valueB;

                // Get values based on column
                switch (columnSort.column) {
                    case 'price':
                        valueA = priceResults[a];
                        valueB = priceResults[b];
                        break;
                    case 'hwMarket':
                        valueA = analysisResults[a]?.marketplace;
                        valueB = analysisResults[b]?.marketplace;
                        break;
                    case 'hwBroker':
                        valueA = analysisResults[a]?.brokerage;
                        valueB = analysisResults[b]?.brokerage;
                        break;
                    case 'hwAuction':
                        valueA = analysisResults[a]?.auction;
                        valueB = analysisResults[b]?.auction;
                        break;
                    case 'atomValue':
                        valueA = analysisResults[a]?.atom?.atom_appraisal;
                        valueB = analysisResults[b]?.atom?.atom_appraisal;
                        break;
                    case 'atomScore':
                        valueA = analysisResults[a]?.atom?.domain_score;
                        valueB = analysisResults[b]?.atom?.domain_score;
                        break;
                    case 'tlds':
                        valueA = analysisResults[a]?.atom?.tld_taken_count;
                        valueB = analysisResults[b]?.atom?.tld_taken_count;
                        break;
                    case 'age':
                        const dateA = analysisResults[a]?.atom?.date_registered;
                        const dateB = analysisResults[b]?.atom?.date_registered;
                        valueA = dateA ? new Date().getFullYear() - new Date(dateA).getFullYear() : undefined;
                        valueB = dateB ? new Date().getFullYear() - new Date(dateB).getFullYear() : undefined;
                        break;
                    default:
                        return 0;
                }

                // Helper to check if value is valid number
                const isValidA = valueA !== undefined && valueA !== null && !isNaN(Number(valueA));
                const isValidB = valueB !== undefined && valueB !== null && !isNaN(Number(valueB));

                if (!isValidA && !isValidB) return 0;
                if (!isValidA) return 1;
                if (!isValidB) return -1;

                // Sort based on direction
                return columnSort.direction === 'asc' ? valueA - valueB : valueB - valueA;
            });
        }

        return filtered;
    }, [domains, searchQuery, selectedExtensions, selectedAuctionDate, hasAuctionData, auctionEndResults, sortOrder, searchMode, blockQuery, blockMode, priceSort, priceResults, columnSort, analysisResults]);

    return {
        // Content filters
        excludeNumbers,
        setExcludeNumbers,
        excludeHyphens,
        setExcludeHyphens,

        // Extension filters
        availableExtensions,
        selectedExtensions,
        setSelectedExtensions,
        extensionCounts,
        extensionDropdownOpen,
        setExtensionDropdownOpen,

        // Search filters
        searchQuery,
        setSearchQuery,
        searchMode,
        setSearchMode,

        // Block filters
        blockQuery,
        setBlockQuery,
        blockMode,
        setBlockMode,

        // Auction filters
        selectedAuctionDate,
        setSelectedAuctionDate,
        auctionDropdownOpen,
        setAuctionDropdownOpen,

        // Sort
        sortOrder,
        setSortOrder,
        sortDropdownOpen,
        setSortDropdownOpen,

        // Price Sort
        priceSort,
        setPriceSort,
        priceDropdownOpen,
        setPriceDropdownOpen,

        // Column Sort
        columnSort,
        setColumnSort,

        // Computed
        domains,
        filteredDomains
    };
};
