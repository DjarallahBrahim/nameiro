import React from 'react';

const StatsRow = ({ originalCount, domainsCount, filteredCount, searchQuery, currentPage, totalPages }) => {
    return (
        <div className="stats-row">
            <div className="stat-item">
                <span className="stat-value">{originalCount.toLocaleString()}</span>
                <span className="stat-label">Total Found</span>
            </div>
            <div className="stat-item">
                <span className="stat-value">{domainsCount.toLocaleString()}</span>
                <span className="stat-label">After Filtering</span>
            </div>
            {searchQuery && (
                <div className="stat-item">
                    <span className="stat-value">{filteredCount.toLocaleString()}</span>
                    <span className="stat-label">Search Results</span>
                </div>
            )}
            <div className="stat-item">
                <span className="stat-value">{currentPage} / {totalPages}</span>
                <span className="stat-label">Current Page</span>
            </div>
        </div>
    );
};

export default StatsRow;
