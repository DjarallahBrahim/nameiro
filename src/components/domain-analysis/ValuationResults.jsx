import React from 'react';

const ValuationResults = ({ marketplace, brokerage, auction }) => {
    return (
        <div className="valuation-results">
            <div className="provider-badge">HUMBLEWORTH</div>
            <div style={{ textAlign: 'center' }}>
                <div className="valuation-label">Marketplace</div>
                <div className="valuation-value-white">${marketplace?.toLocaleString()}</div>
            </div>
            <div className="valuation-divider">
                <div className="valuation-label" style={{ color: '#a78bfa' }}>Brokerage</div>
                <div className="valuation-value-purple">${brokerage?.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div className="valuation-label">Auction</div>
                <div className="valuation-value-white">${auction?.toLocaleString()}</div>
            </div>
        </div>
    );
};

export default ValuationResults;
