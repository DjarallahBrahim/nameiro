import React from 'react';

const SuperValuationButton = ({ onClick, isValuating, domainCount }) => {
    if (domainCount === 0) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <button
                className="btn-super-valuation"
                onClick={onClick}
                disabled={isValuating}
                style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    opacity: isValuating ? 0.7 : 1
                }}
            >
                {isValuating ? (
                    <>
                        <span className="loading-spinner-small"></span> Processing...
                    </>
                ) : (
                    <>
                        <span>⚡</span> Super HumbleWorth Valuation
                    </>
                )}
            </button>
        </div>
    );
};

export default SuperValuationButton;
