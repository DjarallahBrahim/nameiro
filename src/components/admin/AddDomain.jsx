import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, getDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { callGeminiPrompt, callGeminiImage } from '../../utils/gemini';

const AddDomain = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '', price: '', category: '', status: 'Available', special: 0, imagePrompt: '', imageUrl: ''
    });
    const [magicLoading, setMagicLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const { success, error } = useToast();

    useEffect(() => {
        const fetchCats = async () => {
            const q = query(collection(db, "categories"), orderBy("name"));
            const snapshot = await getDocs(q);
            setCategories(snapshot.docs.map(d => d.data().name));
        };
        fetchCats();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleMagicPrompt = async () => {
        if (!formData.name) return error("Enter domain name first!");
        setMagicLoading(true);
        try {
            const prompt = await callGeminiPrompt(formData.name);
            setFormData(prev => ({ ...prev, imagePrompt: prompt }));
            success("Magic Prompt Generated! ✨");
        } catch (e) {
            error(e.message);
        } finally {
            setMagicLoading(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!formData.imagePrompt) return error("Enter a prompt first.");
        setGenerating(true);
        try {
            const imgUrl = await callGeminiImage(formData.imagePrompt);
            setFormData(prev => ({ ...prev, imageUrl: imgUrl }));
            success("Image Generated! 🎨");
        } catch (e) {
            error(e.message);
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
                special: Number(formData.special) || 0,
                image: formData.imageUrl,
                created: serverTimestamp()
            });
            success(`Domain ${formData.name} added successfully! 🚀`);
            setFormData({ name: '', price: '', category: '', status: 'Available', special: 0, imagePrompt: '', imageUrl: '' });
        } catch (e) {
            error("Error adding domain");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <div className="admin-grid">
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

                        <div className="form-group">
                            <label>Rating (Special)</label>
                            <div className="star-rating" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`star ${(hoverRating || formData.special) >= star ? 'filled' : ''}`}
                                        onClick={() => setFormData({ ...formData, special: star })}
                                        onMouseEnter={() => setHoverRating(star)}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ margin: 0 }}>Prompt</label>
                            <button
                                type="button"
                                onClick={handleMagicPrompt}
                                disabled={magicLoading}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                {magicLoading ? (
                                    <>
                                        <span className="loading-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span>
                                        Thinking...
                                    </>
                                ) : (
                                    '✨ Magic Prompt'
                                )}
                            </button>
                        </div>
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
                        onClick={handleGenerateImage}
                        disabled={generating}
                        style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                        {generating ? (
                            <>
                                <span className="loading-spinner"></span>
                                Generating...
                            </>
                        ) : (
                            '🎨 Generate Image'
                        )}
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
    const [loadingMap, setLoadingMap] = useState({}); // { [idx-action]: bool }
    const fileInputRef = useRef(null);
    const { success, error } = useToast();

    // Helper for loading states
    const isLoading = (idx, action) => !!loadingMap[`${idx}-${action}`];
    const setLoading = (idx, action, val) => setLoadingMap(prev => ({ ...prev, [`${idx}-${action}`]: val }));

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview([]);
            setCanUpload(false);
            setMessage("Parsing...");
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

            const startIdx = lines[0] && lines[0].toLowerCase().includes('domain') ? 1 : 0;
            if (lines.length <= startIdx) {
                setMessage("File appears empty.");
                return;
            }

            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',');
                if (parts.length < 3) continue;

                const [domain, price, category] = parts.map(s => s.trim());
                if (domain) {
                    const matchedCategory = categories.find(c => c.toLowerCase() === category.toLowerCase());
                    const isValid = !!matchedCategory;
                    if (!isValid) allValid = false;

                    parsed.push({
                        domain,
                        price: price || '0',
                        category: matchedCategory || category || 'Uncategorized',
                        isValid,
                        error: isValid ? null : `Category "${category}" not found.`,
                        imagePrompt: '',
                        imageUrl: '',
                        special: 0
                    });
                }
            }
            setPreview(parsed);
            if (parsed.length === 0) {
                setMessage("No valid data found.");
                setCanUpload(false);
            } else {
                setCanUpload(allValid);
                setMessage(allValid ? `✅ Found ${parsed.length} valid items.` : `Found ${parsed.length} items (some errors).`);
            }
        };
        reader.readAsText(fileToParse);
    };

    const handleBulkMagicPrompt = async (idx) => {
        setLoading(idx, 'prompt', true);
        try {
            const prompt = await callGeminiPrompt(preview[idx].domain);
            const newPreview = [...preview];
            newPreview[idx].imagePrompt = prompt;
            setPreview(newPreview);
            success("Prompt generated!");
        } catch (e) {
            error("Prompt failed: " + e.message);
        } finally {
            setLoading(idx, 'prompt', false);
        }
    };

    const handleBulkGenerateImage = async (idx) => {
        if (!preview[idx].imagePrompt) return error("Generate a prompt first!");
        setLoading(idx, 'image', true);
        try {
            const imgUrl = await callGeminiImage(preview[idx].imagePrompt);
            const newPreview = [...preview];
            newPreview[idx].imageUrl = imgUrl;
            setPreview(newPreview);
            success("Image generated!");
        } catch (e) {
            error("Image failed: " + e.message);
        } finally {
            setLoading(idx, 'image', false);
        }
    };

    const handleBulkRating = (idx, rating) => {
        const newPreview = [...preview];
        newPreview[idx].special = rating;
        setPreview(newPreview);
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
                    special: Number(item.special) || 0,
                    image: item.imageUrl || '',
                    created: serverTimestamp()
                })
            );
            await Promise.all(promises);
            success(`Successfully added ${preview.length} domains!`);
            setPreview([]);
            setFile(null);
            setCanUpload(false);
            setMessage("Upload Complete!");
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e) {
            console.error(e);
            error("Error uploading batch.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ marginTop: '50px', borderTop: '1px solid var(--glass-border)', paddingTop: '30px' }}>
            <h3>Bulk Upload via CSV</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
                Format: <code>Domain,Price,Category</code>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', alignItems: 'center', padding: '30px', border: '2px dashed var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} ref={fileInputRef} />
                <div style={{ fontSize: '3rem', opacity: 0.5 }}>📂</div>
                {file ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{file.name}</div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Drag & Drop or Click to Browse</div>
                )}
                <button className="btn btn-outline" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                    {file ? 'Change File' : 'Select CSV File'}
                </button>
            </div>

            {message && <p style={{ color: 'var(--primary)', marginBottom: '10px' }}>{message}</p>}

            {preview.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px' }}>
                    <div className="bulk-list">
                        {preview.map((item, idx) => (
                            <div key={idx} className="bulk-item" style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(200px, 1fr) 1fr 1fr',
                                gap: '15px',
                                padding: '15px',
                                background: 'rgba(255,255,255,0.03)',
                                borderBottom: '1px solid var(--glass-border)',
                                alignItems: 'start'
                            }}>
                                {/* Column 1: Info */}
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.domain}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        ${item.price} • <span style={{ color: item.isValid ? '#00ff80' : '#ff4444' }}>{item.category}</span>
                                    </div>
                                    {!item.isValid && <div style={{ color: '#ff4444', fontSize: '0.8rem' }}>{item.error}</div>}
                                </div>

                                {/* Column 2: AI Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleBulkMagicPrompt(idx)}
                                        disabled={isLoading(idx, 'prompt')}
                                    >
                                        {isLoading(idx, 'prompt') ? <span className="loading-spinner" style={{ width: 12, height: 12 }}></span> : '✨ Magic Prompt'}
                                    </button>

                                    <textarea
                                        className="admin-input"
                                        style={{ fontSize: '0.8rem', padding: '5px', height: '40px' }}
                                        value={item.imagePrompt}
                                        placeholder="Prompt..."
                                        readOnly
                                    />

                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleBulkGenerateImage(idx)}
                                        disabled={isLoading(idx, 'image') || !item.imagePrompt}
                                    >
                                        {isLoading(idx, 'image') ? <span className="loading-spinner" style={{ width: 12, height: 12 }}></span> : '🎨 Gen Image'}
                                    </button>
                                </div>

                                {/* Column 3: Rating & Preview */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    {/* Star Rating */}
                                    <div className="star-rating" style={{ fontSize: '1.2rem' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={`star ${item.special >= star ? 'filled' : ''}`}
                                                onClick={() => handleBulkRating(idx, star)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>

                                    {/* Image Preview */}
                                    <div style={{
                                        width: '60px', height: '60px',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt="Pre" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No Img</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile CSS for this specific list */}
                    <style>{`
                        @media (max-width: 768px) {
                            .bulk-item {
                                grid-template-columns: 1fr !important;
                                gap: 20px !important;
                            }
                        }
                    `}</style>

                    <div style={{ marginTop: '20px' }}>
                        {canUpload ? (
                            <button className="btn btn-primary" disabled={uploading} onClick={handleBulkUpload} style={{ width: '100%' }}>
                                {uploading ? 'Uploading Batch...' : '🚀 Upload All Domains'}
                            </button>
                        ) : (
                            <button className="btn btn-outline" onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = null; fileInputRef.current.click(); } }} style={{ width: '100%', borderColor: '#ff4444', color: '#ff4444' }}>
                                ↻ Reload File & Recheck
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default AddDomain;
