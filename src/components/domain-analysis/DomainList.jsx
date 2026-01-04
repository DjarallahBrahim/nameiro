import React from 'react';
import DomainItem from './DomainItem';

const DomainList = ({
    paginatedDomains,
    auctionEndResults,
    priceResults,
    analysisResults,
    analyzingDomains,
    handleAnalyseDomain,
    handleAnalyseAtom,
    isFavorite,
    onToggleFavorite
}) => {
    if (paginatedDomains.length === 0) {
        return (
            <div className="no-results-message">
                No domains match your criteria.
            </div>
        );
    }

    return (
        <div className="domains-list">
            {paginatedDomains.map((domain, index) => {
                // Handle both string domains and domain objects from favorites
                const domainName = typeof domain === 'string' ? domain : domain.domain;
                const analysisResult = analysisResults[domainName];

                return (
                    <DomainItem
                        key={index}
                        domain={domainName}
                        auctionEndDate={auctionEndResults[domainName]}
                        price={priceResults?.[domainName]}
                        analysisResult={analysisResult}
                        isAnalyzing={analyzingDomains[domainName]}
                        onAnalyseHumbleworth={() => handleAnalyseDomain(domainName)}
                        onAnalyseAtom={() => handleAnalyseAtom(domainName)}
                        isFavorite={isFavorite(domainName)}
                        onToggleFavorite={() => onToggleFavorite(domainName, analysisResult)}
                    />
                );
            })}
        </div>
    );
};

export default DomainList;
