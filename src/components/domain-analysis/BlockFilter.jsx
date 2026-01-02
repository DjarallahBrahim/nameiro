import React from 'react';

const BlockFilter = ({ blockQuery, setBlockQuery, blockMode, setBlockMode }) => {
    return (
        <div className="search-container" style={{ marginTop: '1rem' }}>
            <div className="search-input-wrapper">
                <input
                    type="text"
                    placeholder="Block keywords..."
                    value={blockQuery}
                    onChange={(e) => setBlockQuery(e.target.value)}
                    className="search-input"
                />
                {blockQuery && (
                    <button
                        className="search-clear"
                        onClick={() => setBlockQuery('')}
                    >
                        ✕
                    </button>
                )}

                {/* Block Info Icon */}
                <div className="search-info-tooltip-container">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-info-svg">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div className="search-info-tooltip">
                        <strong>Block Filter:</strong><br />
                        Enter keywords to <strong>EXCLUDE</strong> domains matching ANY of the terms.<br /><br />
                        <em>Example: "test dev" hides domains with "test" OR "dev".</em>
                    </div>
                </div>
            </div>

            {/* Block Modes */}
            <div className="search-mode-container">
                {[
                    { id: 'startsWith', label: 'Start with' },
                    { id: 'contains', label: 'Contain' },
                    { id: 'endsWith', label: 'End with' }
                ].map(mode => (
                    <label
                        key={mode.id}
                        className={`extension-checkbox-item ${blockMode === mode.id ? 'selected' : ''}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        <input
                            type="checkbox"
                            checked={blockMode === mode.id}
                            onChange={() => setBlockMode(mode.id)}
                            style={{ display: 'none' }}
                        />
                        <span className={`extension-name ${blockMode === mode.id ? 'selected' : ''}`}>{mode.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default BlockFilter;
