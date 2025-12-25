import React, { useState, useMemo } from 'react';
import './DomainAnalysis.css';

const DomainAnalysis = () => {
    const [domains, setDomains] = useState([]);
    const [originalCount, setOriginalCount] = useState(0);
    const [isDragActive, setIsDragActive] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Filter states
    const [excludeNumbers, setExcludeNumbers] = useState(true);
    const [excludeHyphens, setExcludeHyphens] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableExtensions, setAvailableExtensions] = useState([]);
    const [selectedExtensions, setSelectedExtensions] = useState(['.com']);
    const [showAllExtensions, setShowAllExtensions] = useState(false);
    const [extensionDropdownOpen, setExtensionDropdownOpen] = useState(false);
    const [extensionCounts, setExtensionCounts] = useState({});

    // TLD Checking state
    const [expandedDomain, setExpandedDomain] = useState(null);
    const [tldResults, setTldResults] = useState({});
    const [loadingDomain, setLoadingDomain] = useState(null);
    const [expandedTldView, setExpandedTldView] = useState({});

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split(/[\r\n]+/).filter(line => line.trim());

            if (lines.length === 0) return;

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            let domainColIndex = headers.indexOf('domain');
            let tldColIndex = headers.indexOf('tld');

            if (domainColIndex === -1) {
                domainColIndex = 0;
            }

            const rawDomains = [];
            const tldCounts = {};
            const startIdx = headers.indexOf('domain') !== -1 ? 1 : 0;

            for (let i = startIdx; i < lines.length; i++) {
                const columns = lines[i].split(',').map(c => c.trim());
                if (columns[domainColIndex]) {
                    rawDomains.push(columns[domainColIndex]);

                    // Get TLD from TLD column if available, otherwise extract from domain
                    let tld;
                    if (tldColIndex !== -1 && columns[tldColIndex]) {
                        tld = columns[tldColIndex].toLowerCase();
                        if (!tld.startsWith('.')) tld = '.' + tld;
                    } else {
                        tld = columns[domainColIndex].substring(columns[domainColIndex].lastIndexOf('.')).toLowerCase();
                    }

                    // Count TLDs
                    if (tld) {
                        tldCounts[tld] = (tldCounts[tld] || 0) + 1;
                    }
                }
            }


            setOriginalCount(rawDomains.length);

            // Set available extensions sorted by count (descending) and store counts
            const sortedExtensions = Object.keys(tldCounts).sort((a, b) => tldCounts[b] - tldCounts[a]);
            setAvailableExtensions(sortedExtensions);
            setExtensionCounts(tldCounts);

            // If .com is available and not already selected, set it as default
            if (sortedExtensions.includes('.com') && !selectedExtensions.includes('.com')) {
                setSelectedExtensions(['.com']);
            }

            const filtered = rawDomains.filter(domain => {
                if (excludeNumbers && /\d/.test(domain)) return false;
                if (excludeHyphens && /-/.test(domain)) return false;
                return true;
            });

            setDomains(filtered);
            setCurrentPage(1);
            setHasAnalyzed(true);
        };
        reader.readAsText(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    // Search and Pagination logic
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
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(domain => domain.toLowerCase().includes(query));
        }

        return filtered;
    }, [domains, searchQuery, selectedExtensions]);

    const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);
    const paginatedDomains = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredDomains.slice(start, end);
    }, [filteredDomains, currentPage, itemsPerPage]);

    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleItemsPerPageChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const checkTLD = async (domain) => {
        setLoadingDomain(domain);
        setExpandedDomain(domain);

        try {
            const response = await fetch('/api/tld-checker', {
                method: 'POST',
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi6ImZ6dmZ2amNzbm9kaWpyZHVqenJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTIzNzcsImV4cCI6MjA3MDM4ODM3N30.VWaITCDp5Hy39aCgvtqrDtWJla4q4x0CyJb40GqgvdI',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dmZ2amNzbm9kaWpyZHVqenJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTIzNzcsImV4cCI6MjA3MDM4ODM3N30.VWaITCDp5Hy39aCgvtqrDtWJla4q4x0CyJb40GqgvdI',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ domain })
            });

            const data = await response.json();
            setTldResults(prev => ({ ...prev, [domain]: data }));
        } catch (error) {
            console.error('Error checking TLD:', error);
            setTldResults(prev => ({ ...prev, [domain]: { error: 'Failed to check TLD' } }));
        } finally {
            setLoadingDomain(null);
        }
    };

    return (
        <div className="domain-analysis-container">
            <div className="analysis-card">
                <h1 className="analysis-title">Domain List Analysis</h1>

                {!hasAnalyzed ? (
                    <>
                        <div className="filter-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={excludeNumbers}
                                    onChange={(e) => setExcludeNumbers(e.target.checked)}
                                />
                                Exclude Numbers (0-9)
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={excludeHyphens}
                                    onChange={(e) => setExcludeHyphens(e.target.checked)}
                                />
                                Exclude Hyphens (-)
                            </label>
                        </div>

                        <div
                            className={`upload-section ${isDragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            <div className="upload-icon">📂</div>
                            <h3>Upload your Domain List</h3>
                            <p className="upload-text">Supported format: CSV (Columns: Domain, TLD)</p>
                            <p className="upload-hint" style={{ marginTop: '0.5rem', fontSize: '0.85em', opacity: 0.8, maxWidth: '80%', margin: '0.5rem auto' }}>
                                The TLD is optional.<br />
                                Note: If the TLD is not present, the "Filter by Extension" will be empty.
                            </p>
                            <input
                                type="file"
                                id="file-upload"
                                className="file-input"
                                accept=".csv,.txt"
                                onChange={handleFileChange}
                            />
                            <button className="btn-select-file">Select File</button>
                        </div>
                    </>
                ) : (
                    <div className="results-section">
                        {/* Search Bar */}
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search domains..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button
                                    className="search-clear"
                                    onClick={() => handleSearchChange('')}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Extension Filter Dropdown */}
                        {availableExtensions.length > 0 && (
                            <div className="extension-filter-dropdown">
                                <button
                                    className="extension-dropdown-toggle"
                                    onClick={() => setExtensionDropdownOpen(!extensionDropdownOpen)}
                                >
                                    <span className="dropdown-label">Filter by Extension:</span>
                                    <span className="dropdown-selected-count">
                                        {selectedExtensions.length} selected
                                    </span>
                                    <span className="dropdown-arrow">{extensionDropdownOpen ? '▲' : '▼'}</span>
                                </button>

                                {extensionDropdownOpen && (
                                    <div className="extension-dropdown-content">
                                        <div className="dropdown-actions">
                                            <button
                                                className="btn-select-all-ext"
                                                onClick={() => setSelectedExtensions(availableExtensions)}
                                            >
                                                Select All
                                            </button>
                                            <button
                                                className="btn-clear-all-ext"
                                                onClick={() => setSelectedExtensions([])}
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div className="extension-chips-grid">
                                            {availableExtensions.map(ext => (
                                                <label
                                                    key={ext}
                                                    className={`extension-checkbox-item ${selectedExtensions.includes(ext) ? 'selected' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedExtensions.includes(ext)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedExtensions([...selectedExtensions, ext]);
                                                            } else {
                                                                setSelectedExtensions(selectedExtensions.filter(x => x !== ext));
                                                            }
                                                        }}
                                                        className="extension-checkbox"
                                                    />
                                                    <span className="extension-name">{ext}</span>
                                                    <span className="extension-count">
                                                        {extensionCounts[ext] || 0}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="stat-value">{originalCount.toLocaleString()}</span>
                                <span className="stat-label">Total Found</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{domains.length.toLocaleString()}</span>
                                <span className="stat-label">After Filtering</span>
                            </div>
                            {searchQuery && (
                                <div className="stat-item">
                                    <span className="stat-value">{filteredDomains.length.toLocaleString()}</span>
                                    <span className="stat-label">Search Results</span>
                                </div>
                            )}
                            <div className="stat-item">
                                <span className="stat-value">{currentPage} / {totalPages}</span>
                                <span className="stat-label">Current Page</span>
                            </div>
                        </div>

                        <div className="domains-list">
                            {paginatedDomains.length > 0 ? (
                                paginatedDomains.map((domain, index) => (
                                    <div key={index} className="domain-row-wrapper">
                                        <div className="domain-item">
                                            <span className="domain-name">{domain}</span>
                                            <button
                                                className="btn-check-tld"
                                                onClick={() => checkTLD(domain)}
                                                disabled={loadingDomain === domain}
                                            >
                                                {loadingDomain === domain ? '⏳ Checking...' : 'Check TLD'}
                                            </button>
                                        </div>

                                        {expandedDomain === domain && tldResults[domain] && (
                                            <div className="tld-results">
                                                {tldResults[domain].error ? (
                                                    <div className="error-message">{tldResults[domain].error}</div>
                                                ) : (
                                                    <>
                                                        <div className="tld-categories">
                                                            {(() => {
                                                                const categories = tldResults[domain].categories || {};
                                                                const allTlds = Object.values(categories).flat();

                                                                // Calculate all stats in one pass
                                                                const totalCount = allTlds.length;
                                                                const allRegisteredTlds = allTlds.filter(t => t.registered);
                                                                const registeredCount = allRegisteredTlds.length;
                                                                const availableCount = totalCount - registeredCount;

                                                                // Display logic
                                                                const isExpanded = expandedTldView[domain];
                                                                const displayLimit = 30;
                                                                const displayTlds = isExpanded ? allRegisteredTlds : allRegisteredTlds.slice(0, displayLimit);
                                                                const remaining = allRegisteredTlds.length - displayLimit;

                                                                return (
                                                                    <>
                                                                        <div className="tld-summary" style={{ marginBottom: '1.5rem' }}>
                                                                            <div className="summary-stat">
                                                                                <span className="summary-label">Total Checked</span>
                                                                                <span className="summary-value">{totalCount}</span>
                                                                            </div>
                                                                            <div className="summary-stat">
                                                                                <span className="summary-label">Registered</span>
                                                                                <span className="summary-value registered">{registeredCount}</span>
                                                                            </div>
                                                                            <div className="summary-stat">
                                                                                <span className="summary-label">Available</span>
                                                                                <span className="summary-value score">{availableCount}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="tld-grid-compact">
                                                                            {displayTlds.map((tldInfo, idx) => (
                                                                                <div key={idx} className="tld-badge-compact">
                                                                                    .{tldInfo.tld}
                                                                                </div>
                                                                            ))}
                                                                            {remaining > 0 && !isExpanded && (
                                                                                <div
                                                                                    className="tld-badge-compact tld-remaining"
                                                                                    onClick={() => setExpandedTldView(prev => ({ ...prev, [domain]: true }))}
                                                                                >
                                                                                    +{remaining}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="no-results-message">
                                    No domains match your criteria.
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <div className="page-size-selector">
                                    <label>Per page:</label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                        className="page-size-select"
                                    >
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={200}>200</option>
                                    </select>
                                </div>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    ««
                                </button>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>
                                <span className="page-info">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    »»
                                </button>
                            </div>
                        )}

                        <div className="action-row">
                            <button className="btn-reset" onClick={() => {
                                setDomains([]);
                                setHasAnalyzed(false);
                                setOriginalCount(0);
                                setCurrentPage(1);
                            }}>Upload New</button>
                        </div>
                    </div>
                )
                }
            </div >
        </div >
    );
};

export default DomainAnalysis;
