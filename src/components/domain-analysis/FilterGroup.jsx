import React from 'react';

const FilterGroup = ({
    // Extension filter
    availableExtensions,
    selectedExtensions,
    setSelectedExtensions,
    extensionCounts,
    extensionDropdownOpen,
    setExtensionDropdownOpen,
    // Auction filter
    hasAuctionData,
    availableAuctionDates,
    selectedAuctionDate,
    setSelectedAuctionDate,
    auctionDateCounts,
    auctionDropdownOpen,
    setAuctionDropdownOpen,
    // Sort
    sortOrder,
    setSortOrder,
    sortDropdownOpen,
    setSortDropdownOpen,
    // Visibility
    domainsLength
}) => {
    // Only hide if there are truly no domains loaded, not just filtered to 0
    // This allows users to adjust filters even when current filter results in 0 domains

    return (
        <div className="filter-group-container">
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

            {/* Auction End Date Dropdown Filter */}
            {hasAuctionData && availableAuctionDates.length > 0 && (
                <div className="extension-filter-dropdown">
                    <button
                        className="extension-dropdown-toggle"
                        onClick={() => setAuctionDropdownOpen(!auctionDropdownOpen)}
                    >
                        <span className="dropdown-label">Auction End Date:</span>
                        <span className="dropdown-selected-count">
                            {selectedAuctionDate || 'All Dates'}
                        </span>
                        <span className="dropdown-arrow">{auctionDropdownOpen ? '▲' : '▼'}</span>
                    </button>

                    {auctionDropdownOpen && (
                        <div className="extension-dropdown-content">
                            <div className="extension-chips-grid">
                                <div
                                    className={`extension-checkbox-item ${selectedAuctionDate === '' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedAuctionDate('');
                                        setAuctionDropdownOpen(false);
                                    }}
                                >
                                    <span className="extension-name">All Dates</span>
                                </div>
                                {availableAuctionDates.map(dateStr => (
                                    <div
                                        key={dateStr}
                                        className={`extension-checkbox-item ${selectedAuctionDate === dateStr ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedAuctionDate(dateStr);
                                            setAuctionDropdownOpen(false);
                                        }}
                                    >
                                        <span className="extension-name">{dateStr}</span>
                                        <span className="extension-count">
                                            {auctionDateCounts[dateStr] || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sort Order Dropdown */}
            <div className="extension-filter-dropdown">
                <button
                    className="extension-dropdown-toggle"
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                >
                    <span className="dropdown-label">Order Results:</span>
                    <span className="dropdown-selected-count">
                        {sortOrder === 'asc' ? 'Shortest First' : sortOrder === 'desc' ? 'Longest First' : 'Default'}
                    </span>
                    <span className="dropdown-arrow">{sortDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {sortDropdownOpen && (
                    <div className="extension-dropdown-content">
                        <div className="extension-chips-grid">
                            {[
                                { label: 'Default', value: '' },
                                { label: 'Shortest First', value: 'asc' },
                                { label: 'Longest First', value: 'desc' }
                            ].map(option => (
                                <div
                                    key={option.value}
                                    className={`extension-checkbox-item ${sortOrder === option.value ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSortOrder(option.value);
                                        setSortDropdownOpen(false);
                                    }}
                                >
                                    <span className="extension-name">{option.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterGroup;
