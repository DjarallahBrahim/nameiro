import { useState, useMemo, useEffect } from 'react';

/**
 * Custom hook for managing all filtering logic
 */
export const useFilters = (rawDomains, auctionEndResults, hasAuctionData) => {
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

        return filtered;
    }, [domains, searchQuery, selectedExtensions, selectedAuctionDate, hasAuctionData, auctionEndResults, sortOrder, searchMode, blockQuery, blockMode]);

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

        // Computed
        domains,
        filteredDomains
    };
};
