import React from 'react';

const SettingsModal = ({
    show,
    onClose,
    atomCredentials,
    setAtomCredentials,
    humbleworthToken,
    setHumbleworthToken,
    onSave
}) => {
    if (!show) return null;

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h3>API Configuration</h3>
                    <button className="btn-close-modal" onClick={onClose}>×</button>
                </div>

                <div className="settings-section">
                    <h4>⚛️ Atom Appraisal</h4>
                    <div className="settings-row">
                        <label>User ID</label>
                        <input
                            type="text"
                            placeholder="e.g. 2943085"
                            value={atomCredentials.user_id}
                            onChange={(e) => setAtomCredentials(prev => ({ ...prev, user_id: e.target.value }))}
                        />
                    </div>
                    <div className="settings-row">
                        <label>API Token</label>
                        <input
                            type="password"
                            placeholder="Atom API Token"
                            value={atomCredentials.api_token}
                            onChange={(e) => setAtomCredentials(prev => ({ ...prev, api_token: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="settings-divider"></div>

                <div className="settings-section">
                    <h4>💎 Humbleworth (Replicate)</h4>
                    <div className="settings-row">
                        <label>API Token</label>
                        <input
                            type="password"
                            placeholder="Replicate API Token"
                            value={humbleworthToken}
                            onChange={(e) => setHumbleworthToken(e.target.value)}
                        />
                    </div>
                </div>

                <div className="settings-footer" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="settings-info-icon">ⓘ</span>
                        <span>Settings are synced to your account.</span>
                    </div>
                    <button className="btn btn-primary" onClick={onSave} style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
