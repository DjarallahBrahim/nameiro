import React from 'react';
import './DomainTable.css';

const DomainList = ({
    paginatedDomains,
    auctionEndResults,
    priceResults,
    analysisResults,
    analyzingDomains,
    handleAnalyseDomain,
    handleAnalyseAtom,
    isFavorite,
    onToggleFavorite,
    columnSort,
    setColumnSort
}) => {
    // Handle column header click
    const handleSort = (column) => {
        let direction = 'asc';
        if (columnSort.column === column && columnSort.direction === 'asc') {
            direction = 'desc';
        } else if (columnSort.column === column && columnSort.direction === 'desc') {
            direction = null; // Reset to no sorting
        }
        if (direction === null) {
            setColumnSort({ column: null, direction: null });
        } else {
            setColumnSort({ column, direction });
        }
    };

    // Render sort icon
    const renderSortIcon = (column) => {
        if (columnSort.column !== column) {
            return <span className="sort-icon sort-icon-inactive">⇅</span>;
        }
        if (columnSort.direction === 'asc') {
            return <span className="sort-icon sort-icon-asc">↑</span>;
        }
        return <span className="sort-icon sort-icon-desc">↓</span>;
    };

    if (paginatedDomains.length === 0) {
        return (
            <div className="no-results-message">
                No domains match your criteria.
            </div>
        );
    }

    return (
        <div className="domain-table-container">
            <table className="domain-table">
                <thead>
                    <tr>
                        <th className="th-domain">Domain</th>
                        <th className="th-auction">Auction Date</th>
                        <th className="th-price th-sortable" onClick={() => handleSort('price')}>
                            Price {renderSortIcon('price')}
                        </th>
                        <th className="th-hw-market th-sortable" onClick={() => handleSort('hwMarket')}>
                            HW Market {renderSortIcon('hwMarket')}
                        </th>
                        <th className="th-hw-broker th-sortable" onClick={() => handleSort('hwBroker')}>
                            HW Broker {renderSortIcon('hwBroker')}
                        </th>
                        <th className="th-hw-auction th-sortable" onClick={() => handleSort('hwAuction')}>
                            HW Auction {renderSortIcon('hwAuction')}
                        </th>
                        <th className="th-atom-value th-sortable" onClick={() => handleSort('atomValue')}>
                            Atom Value {renderSortIcon('atomValue')}
                        </th>
                        <th className="th-atom-score th-sortable" onClick={() => handleSort('atomScore')}>
                            Score {renderSortIcon('atomScore')}
                        </th>
                        <th className="th-tlds th-sortable" onClick={() => handleSort('tlds')}>
                            TLDs {renderSortIcon('tlds')}
                        </th>
                        <th className="th-age th-sortable" onClick={() => handleSort('age')}>
                            Age {renderSortIcon('age')}
                        </th>
                        <th className="th-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedDomains.map((domain, index) => {
                        // Handle both string domains and domain objects from favorites
                        const domainName = typeof domain === 'string' ? domain : domain.domain;
                        const analysisResult = analysisResults[domainName];
                        const auctionDate = auctionEndResults[domainName];
                        const price = priceResults?.[domainName];
                        const isAnalyzing = analyzingDomains[domainName];
                        const isFav = isFavorite(domainName);

                        // Extract Humbleworth data
                        const hwMarket = analysisResult?.marketplace;
                        const hwBroker = analysisResult?.brokerage;
                        const hwAuction = analysisResult?.auction;

                        // Extract Atom data
                        const atomData = analysisResult?.atom;
                        const atomValue = atomData?.atom_appraisal;
                        const atomScore = atomData?.domain_score;
                        const tldsTaken = atomData?.tld_taken_count;
                        const dateRegistered = atomData?.date_registered;
                        const age = dateRegistered
                            ? `${(new Date().getFullYear() - new Date(dateRegistered).getFullYear())} Yrs`
                            : null;

                        return (
                            <tr key={index} className="domain-row">
                                <td className="td-domain">
                                    <div className="domain-cell-content">
                                        <a
                                            href={`http://${domainName}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="domain-link"
                                        >
                                            {domainName}
                                        </a>
                                        <button
                                            className="btn-copy-domain"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(domainName);
                                                // Visual feedback could be handled by a parent component toast or local state
                                                // For now, let's use a simple button animation via class
                                                const btn = e.currentTarget;
                                                btn.classList.add('copied');
                                                setTimeout(() => btn.classList.remove('copied'), 1500);
                                            }}
                                            title="Copy domain"
                                        >
                                            <span className="copy-icon">📋</span>
                                            <span className="check-icon">✓</span>
                                        </button>

                                        {/* Google Search */}
                                        <a
                                            href={`https://www.google.com/search?q=${domainName.split('.')[0]}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-external-link google-link"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Search on Google"
                                        >
                                            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                                                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                                                    <path d="M21.35,11.1H12v3.8h5.6c-0.6,2.3-2.5,3.8-5.6,3.8c-3.5,0-6.2-2.7-6.2-6.2s2.7-6.2,6.2-6.2c1.7,0,3.1,0.6,4.2,1.5l2.9-2.9 C17.2,2.9,14.8,2,12,2C6.5,2,2,6.5,2,12s4.5,10,10,10c5.7,0,9.7-4,9.7-10C21.7,11.6,21.6,11.3,21.35,11.1z" fill="currentColor" />
                                                </g>
                                            </svg>
                                        </a>

                                        {/* DotDB Search */}
                                        <a
                                            href={`https://dotdb.com/search?keyword=${domainName.split('.')[0]}&position=any`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-external-link dotdb-link"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Search on DotDB"
                                        >
                                            <svg viewBox="0 0 100 100" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="50" cy="50" r="50" fill="#007bff" />
                                                <text x="50" y="75" font-family="Arial, sans-serif" font-weight="bold" font-size="70" text-anchor="middle" fill="#ffffff">d</text>
                                            </svg>
                                        </a>
                                    </div>
                                </td>
                                <td className="td-auction">
                                    {auctionDate && (
                                        <span className="table-badge auction-badge">
                                            {new Date(auctionDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    )}
                                </td>
                                <td className="td-price">
                                    {price !== undefined && price !== null && (
                                        <span className="table-badge price-badge">
                                            ${typeof price === 'number' ? price.toLocaleString() : price}
                                        </span>
                                    )}
                                </td>
                                <td className="td-hw-market">
                                    {hwMarket !== undefined && (
                                        <span className="value-cell hw-value">
                                            ${hwMarket.toLocaleString()}
                                        </span>
                                    )}
                                </td>
                                <td className="td-hw-broker">
                                    {hwBroker !== undefined && (
                                        <span className="value-cell hw-value-primary">
                                            ${hwBroker.toLocaleString()}
                                        </span>
                                    )}
                                </td>
                                <td className="td-hw-auction">
                                    {hwAuction !== undefined && (
                                        <span className="value-cell hw-value">
                                            ${hwAuction.toLocaleString()}
                                        </span>
                                    )}
                                </td>
                                <td className="td-atom-value">
                                    {atomValue !== undefined && (
                                        <span className="value-cell atom-value">
                                            ${atomValue.toLocaleString()}
                                        </span>
                                    )}
                                </td>
                                <td className="td-atom-score">
                                    {atomScore !== undefined && (
                                        <span className="value-cell atom-score">
                                            {atomScore}/10
                                        </span>
                                    )}
                                </td>
                                <td className="td-tlds">
                                    {tldsTaken !== undefined && (
                                        <span className="value-cell">
                                            {tldsTaken}
                                        </span>
                                    )}
                                </td>
                                <td className="td-age">
                                    {age && (
                                        <span className="value-cell">
                                            {age}
                                        </span>
                                    )}
                                </td>
                                <td className="td-actions">
                                    <div className="table-actions">
                                        <button
                                            className={`table-action-btn favorite-btn ${isFav ? 'is-favorite' : ''}`}
                                            onClick={() => onToggleFavorite(domainName, analysisResult)}
                                            title={isFav ? "Remove from favorites" : "Add to favorites"}
                                        >
                                            <span style={{ filter: isFav ? 'none' : 'grayscale(100%)' }}>
                                                ❤️
                                            </span>
                                        </button>
                                        <button
                                            className="table-action-btn humble-btn"
                                            onClick={() => handleAnalyseDomain(domainName)}
                                            disabled={isAnalyzing}
                                            title="Analyze with Humbleworth"
                                        >
                                            🪙
                                        </button>
                                        <button
                                            className="table-action-btn atom-btn"
                                            onClick={() => handleAnalyseAtom(domainName)}
                                            disabled={isAnalyzing}
                                            title="Analyze with Atom Appraisal"
                                        >
                                            ⚛️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default DomainList;
