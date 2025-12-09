import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const ApiManager = () => {
    const [apiKey, setApiKey] = useState('');
    const [modelName, setModelName] = useState('gemini-2.5-flash-image');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const docRef = doc(db, "settings", "api_keys");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setApiKey(data.google_genai_key || '');
                if (data.model_name) setModelName(data.model_name);
            }
        } catch (e) {
            console.error("Error fetching settings:", e);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);
        try {
            await setDoc(doc(db, "settings", "api_keys"), {
                google_genai_key: apiKey,
                model_name: modelName,
                updated: serverTimestamp()
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error("Error saving settings:", e);
            alert("Failed to save API Key");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '600px' }}>
            <h3>API Configuration</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                Manage your AI Model keys here. These are used to generate images for your domains.
            </p>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '20px' }}>
                <div className="form-group">
                    <label>Google Gemini API Key</label>
                    <input
                        type="password"
                        className="admin-input"
                        placeholder="AIzaSy..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        required
                    />
                    <small style={{ color: 'var(--text-muted)' }}>
                        Get your key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Google AI Studio</a>.
                    </small>
                </div>

                <div className="form-group">
                    <label>Image Model Name</label>
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="gemini-2.5-flash-image"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                    />
                    <small style={{ color: 'var(--text-muted)' }}>
                        Use <code>gemini-2.5-flash-image</code> or <code>imagen-3.0-generate-001</code>.
                    </small>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </button>

                    {saved && <span style={{ color: '#00ff80', fontWeight: 'bold' }}>✓ Saved successfully!</span>}
                </div>
            </form>
        </div>
    );
};

export default ApiManager;
