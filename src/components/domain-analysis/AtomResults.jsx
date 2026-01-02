import React from 'react';

const AtomResults = ({ atomData }) => {
    if (!atomData) return null;

    const { atom_appraisal, domain_score, tld_taken_count, date_registered } = atomData;

    return (
        <div className="valuation-results-atom">
            <div className="atom-badge">
                ATOM APPRAISAL
            </div>

            <div className="atom-results-grid">
                {/* Price */}
                <div className="atom-result-item">
                    <div className="valuation-label">Appraisal Value</div>
                    <div className="atom-value-primary">
                        ${(atom_appraisal || 0).toLocaleString()}
                    </div>
                </div>

                {/* Score */}
                <div className="atom-result-item">
                    <div className="valuation-label">Domain Score</div>
                    <div className="atom-value-secondary">
                        {domain_score || 'N/A'}/10
                    </div>
                </div>

                {/* TLDs Taken */}
                <div className="atom-result-item">
                    <div className="valuation-label">TLDs Taken</div>
                    <div className="atom-value-secondary">
                        {tld_taken_count || 0}
                    </div>
                </div>

                {/* Age */}
                <div className="atom-result-item">
                    <div className="valuation-label">Est. Age</div>
                    <div className="atom-value-secondary">
                        {date_registered ?
                            `${(new Date().getFullYear() - new Date(date_registered).getFullYear()).toFixed(1)} Yrs`
                            : 'N/A'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AtomResults;
