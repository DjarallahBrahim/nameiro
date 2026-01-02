import React from 'react';
import ValuationResults from './ValuationResults';
import AtomResults from './AtomResults';

const DomainItem = ({
    domain,
    auctionEndDate,
    analysisResult,
    isAnalyzing,
    onAnalyseHumbleworth,
    onAnalyseAtom,
    isFavorite,
    onToggleFavorite
}) => {
    return (
        <div className="domain-row-wrapper">
            <div className="domain-item">
                <div className="domain-info-col">
                    <a
                        href={`http://${domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="domain-name"
                        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                        {domain}
                    </a>
                    {auctionEndDate && (
                        <span className="auction-date-badge">
                            📅 {new Date(auctionEndDate).toLocaleDateString()}
                        </span>
                    )}
                </div>

                <div className="action-buttons-container">
                    {/* Favorite Button */}
                    <button
                        className={`action-icon-btn favorite-btn ${isFavorite ? 'is-favorite' : ''}`}
                        onClick={onToggleFavorite}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <span style={{ fontSize: '1.3rem', filter: isFavorite ? 'none' : 'grayscale(100%)' }}>
                            ❤️
                        </span>
                    </button>

                    {/* Humbleworth Button */}
                    <button
                        className="action-icon-btn humble-btn"
                        onClick={onAnalyseHumbleworth}
                        disabled={isAnalyzing}
                        title="Analyze with Humbleworth"
                    >
                        <span style={{ fontSize: '1.2rem', marginBottom: '2px' }}>🪙</span>
                    </button>

                    {/* Atom Button */}
                    <button
                        className="action-icon-btn atom-btn"
                        onClick={onAnalyseAtom}
                        disabled={isAnalyzing}
                        title="Analyze with Atom Appraisal"
                    >
                        <span style={{ fontSize: '1.4rem' }}>⚛️</span>
                    </button>
                </div>
            </div>

            {/* Display Humbleworth Results */}
            {analysisResult && analysisResult.marketplace !== undefined && (
                <ValuationResults
                    marketplace={analysisResult.marketplace}
                    brokerage={analysisResult.brokerage}
                    auction={analysisResult.auction}
                />
            )}

            {/* Display Atom Results */}
            {analysisResult && analysisResult.atom && (
                <AtomResults atomData={analysisResult.atom} />
            )}
        </div>
    );
};

export default DomainItem;
