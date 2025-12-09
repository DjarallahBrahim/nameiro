import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, getDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const AddDomain = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: '',
        status: 'Available',
        imagePrompt: '',
        imageUrl: ''
    });
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (formData.name && !formData.imagePrompt) {
            const generatedPrompt = `Professional logo for domain "${formData.name}", ${formData.category || 'tech'} industry, modern, minimalist, high quality, 4k`;
            setFormData(prev => ({ ...prev, imagePrompt: generatedPrompt }));
        }
    }, [formData.name, formData.category]);

    useEffect(() => {
        const fetchCats = async () => {
            const q = query(collection(db, "categories"), orderBy("name"));
            const snapshot = await getDocs(q);
            setCategories(snapshot.docs.map(d => d.data().name));
        };
        fetchCats();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const generateImage = async () => {
        if (!formData.imagePrompt) {
            alert("Please enter a prompt first.");
            return;
        }
        setGenerating(true);

        try {
            // 1. Get API Key
            const settingsSnap = await getDoc(doc(db, "settings", "api_keys"));
            if (!settingsSnap.exists() || !settingsSnap.data().google_genai_key) {
                alert("API Key not found! please set it in 'API Settings' tab.");
                return;
            }
            const { google_genai_key, model_name } = settingsSnap.data();
            const MODEL = model_name || 'imagen-3.0-generate-001';

            let endpoint, method, body;

            // Detect Model Type to choose endpoint
            if (MODEL.toLowerCase().includes('gemini')) {
                // Assume Gemini Multimodal (generateContent)
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${google_genai_key}`;
                body = {
                    contents: [{ parts: [{ text: formData.imagePrompt }] }]
                };
            } else {
                // Assume Imagen (predict)
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${google_genai_key}`;
                body = {
                    instances: [{ prompt: formData.imagePrompt }],
                    parameters: { sampleCount: 1, aspectRatio: "1:1" }
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || JSON.stringify(data.error));
            }

            let base64Image = null;

            // Parser for Imagen (:predict)
            if (data.predictions?.[0]?.bytesBase64Encoded) {
                base64Image = data.predictions[0].bytesBase64Encoded;
            }
            // Parser for Gemini (:generateContent - if it returns images)
            else if (data.candidates?.[0]?.content?.parts) {
                // Determine if there is image data in parts
                const parts = data.candidates[0].content.parts;
                // Check for inline_data/blob
                const imagePart = parts.find(p => p.inline_data || (p.inlineData));
                if (imagePart) {
                    base64Image = (imagePart.inline_data || imagePart.inlineData).data;
                } else {
                    // It might have just returned text saying "I cannot generate images"
                    console.warn("Gemini Response:", parts);
                    alert("Model returned content but no image found. It likely replied with text: " + parts[0].text);
                    return;
                }
            }
            else if (data.predictions?.[0]?.bytes) {
                base64Image = data.predictions[0].bytes;
            }

            if (base64Image) {
                setFormData(prev => ({ ...prev, imageUrl: `data:image/png;base64,${base64Image}` }));
            } else {
                console.warn("Unexpected response format", data);
                alert("API succeeded but response format was unrecognized. See console.");
            }

        } catch (e) {
            console.error("Generation failed:", e);
            alert("Generation failed: " + e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "domains"), {
                name: formData.name,
                price: Number(formData.price),
                category: formData.category,
                status: formData.status,
                image: formData.imageUrl,
                created: serverTimestamp()
            });
            alert(`Domain ${formData.name} added successfully!`);
            setFormData({ name: '', price: '', category: '', status: 'Available', imagePrompt: '', imageUrl: '' });
        } catch (e) {
            alert("Error adding domain");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div className="form-column">
                    <h3>Add Single Domain</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                        <div className="form-group">
                            <label>Domain Name</label>
                            <input type="text" name="name" className="admin-input" placeholder="example.com" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Price ($)</label>
                            <input type="number" name="price" className="admin-input" placeholder="5000" value={formData.price} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select name="category" className="admin-input" value={formData.category} onChange={handleChange} required>
                                <option value="">Select Category...</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select name="status" className="admin-input" value={formData.status} onChange={handleChange}>
                                <option value="Available">Available</option>
                                <option value="Pending">Pending</option>
                                <option value="Sold">Sold</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add to Inventory'}
                        </button>
                    </form>
                </div>

                <div className="image-column">
                    <h3>AI Image Generation</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Using Google GenAI</p>

                    <div className="form-group">
                        <label>Prompt</label>
                        <textarea
                            name="imagePrompt"
                            className="admin-input"
                            rows="4"
                            value={formData.imagePrompt}
                            onChange={handleChange}
                            placeholder="Describe the logo..."
                        ></textarea>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={generateImage}
                        disabled={generating}
                        style={{ width: '100%', marginBottom: '20px' }}
                    >
                        {generating ? 'Generating...' : '✨ Generate Image'}
                    </button>

                    <div className="image-preview" style={{
                        height: '250px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '12px',
                        border: '1px dashed var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {formData.imageUrl ? (
                            <img src={formData.imageUrl} alt="Generated Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Image Preview</span>
                        )}
                    </div>
                </div>
            </div>

            <BulkUpload categories={categories} />
        </div>
    );
};

const BulkUpload = ({ categories }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [canUpload, setCanUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setMessage(`Selected: ${selected.name}`);
            setPreview([]);
            setCanUpload(false);
            // Auto-process for smoother UX re-check
            parseCSV(selected);
        }
    };

    const parseCSV = (fileToParse) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const parsed = [];
            let allValid = true;

            // Header detection
            const startIdx = lines[0] && lines[0].toLowerCase().includes('domain') ? 1 : 0;

            if (lines.length <= startIdx) {
                setMessage("File appears empty.");
                return;
            }

            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const parts = line.split(',');
                if (parts.length < 3) { continue; }

                const [domain, price, category] = parts.map(s => s.trim());

                if (domain) {
                    const isValid = categories.includes(category);
                    if (!isValid) allValid = false;

                    parsed.push({
                        domain,
                        price: price || '0',
                        category: category || 'Uncategorized',
                        isValid,
                        error: isValid ? null : `Category "${category}" not found.`
                    });
                }
            }

            setPreview(parsed);
            if (parsed.length === 0) {
                setMessage("No valid data found in CSV.");
                setCanUpload(false);
            } else {
                setCanUpload(allValid);
                setMessage(allValid ? `✅ Found ${parsed.length} valid domains.` : `Found ${parsed.length} domains with errors.`);
            }
        };
        reader.readAsText(fileToParse);
    };

    const handleBulkUpload = async () => {
        if (!canUpload) return;
        setUploading(true);
        try {
            const promises = preview.map(item =>
                addDoc(collection(db, "domains"), {
                    name: item.domain,
                    price: Number(item.price),
                    category: item.category,
                    status: 'Available',
                    created: serverTimestamp()
                })
            );
            await Promise.all(promises);
            alert(`Successfully added ${preview.length} domains!`);
            setPreview([]);
            setFile(null);
            setCanUpload(false);
            setMessage("Upload Complete!");
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        } catch (e) {
            console.error(e);
            alert("Error uploading batch.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ marginTop: '50px', borderTop: '1px solid var(--glass-border)', paddingTop: '30px' }}>
            <h3>Bulk Upload via CSV</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
                Format: <code>Domain,Price,Category</code> (e.g., <code>coolai.com,5000,AI</code>)
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', alignItems: 'center', padding: '30px', border: '2px dashed var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                />

                <div style={{ fontSize: '3rem', opacity: 0.5 }}>📂</div>

                {file ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>{file.name}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        Drag and drop your CSV here or click to browse
                    </div>
                )}

                <button
                    className="btn btn-outline"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                    {file ? 'Change File' : 'Select CSV File'}
                </button>
            </div>

            {message && <p style={{ color: 'var(--primary)', marginBottom: '10px' }}>{message}</p>}

            {preview.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px' }}>
                    <h4>Preview ({preview.length} items)</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th>Domain</th>
                                <th>Price</th>
                                <th>Category</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preview.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '8px 0' }}>{item.domain}</td>
                                    <td>${item.price}</td>
                                    <td>{item.category}</td>
                                    <td style={{ color: item.isValid ? '#00ff80' : '#ff4444' }}>
                                        {item.isValid ? '✓ Ready' : item.error}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {canUpload ? (
                        <button
                            className="btn btn-primary"
                            disabled={uploading}
                            onClick={handleBulkUpload}
                            style={{ width: '100%' }}
                        >
                            {uploading ? 'Uploading Batch...' : '🚀 Upload All Domains'}
                        </button>
                    ) : (
                        <button
                            className="btn btn-outline"
                            onClick={() => {
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = null;
                                    fileInputRef.current.click();
                                }
                            }}
                            style={{ width: '100%', borderColor: '#ff4444', color: '#ff4444' }}
                        >
                            ↻ Reload File & Recheck
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
export default AddDomain;
