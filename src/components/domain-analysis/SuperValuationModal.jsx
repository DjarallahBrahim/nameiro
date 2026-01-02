import React from 'react';

const SuperValuationModal = ({ show, onClose, onConfirm, domainCount }) => {
    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0)',
            zIndex: 99999,
            pointerEvents: 'auto'
        }} onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()} style={{
                position: 'relative',
                maxWidth: '400px',
                width: '90%',
                maxHeight: '90vh',
                background: '#1e293b',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto',
                pointerEvents: 'auto',
                zIndex: 100000
            }}>
                <div className="settings-modal-header">
                    <h3>🚀 Super Valuation</h3>
                    <button className="btn-close-modal" onClick={onClose}>×</button>
                </div>

                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                    <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Valuate {domainCount} domains?</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        This will process all domains on the current page in a single batch request, optimized for speed and efficiency.
                    </p>
                </div>

                <div className="settings-footer" style={{ justifyContent: 'center', gap: '1rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={onConfirm}
                        style={{
                            padding: '0.6rem 1.5rem',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                            border: 'none',
                            fontWeight: '600'
                        }}
                    >
                        Yes, Start Batch!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperValuationModal;
