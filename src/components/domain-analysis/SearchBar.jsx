import React from 'react';

const SearchBar = ({ searchQuery, setSearchQuery, searchMode, setSearchMode }) => {
    return (
        <div className="search-container">
            <div className="search-input-wrapper">
                <input
                    type="text"
                    placeholder="Search domains..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                {searchQuery && (
                    <button
                        className="search-clear"
                        onClick={() => setSearchQuery('')}
                    >
                        ✕
                    </button>
                )}

                {/* Search Info Icon (Inside Input) */}
                <div className="search-info-tooltip-container">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-info-svg">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div className="search-info-tooltip">
                        <strong>Multi-word Search:</strong><br />
                        Enter multiple words separated by spaces to find domains matching <strong>ANY</strong> of the terms (OR logic).<br /><br />
                        <em>Example: "shop store" finds domains with "shop" OR "store".</em>
                    </div>
                </div>
            </div>

            {/* Search Modes */}
            <div className="search-mode-container">
                {[
                    { id: 'startsWith', label: 'Start with' },
                    { id: 'contains', label: 'Contain' },
                    { id: 'endsWith', label: 'End with' }
                ].map(mode => (
                    <label
                        key={mode.id}
                        className={`extension-checkbox-item ${searchMode === mode.id ? 'selected' : ''}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        <input
                            type="checkbox"
                            checked={searchMode === mode.id}
                            onChange={() => setSearchMode(mode.id)}
                            style={{ display: 'none' }}
                        />
                        <span className={`extension-name ${searchMode === mode.id ? 'selected' : ''}`}>{mode.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default SearchBar;
