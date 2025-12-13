import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { callGeminiPrompt, callGeminiImage } from '../../utils/gemini';

const DomainManager = () => {
    const [domains, setDomains] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPrice, setFilterPrice] = useState('');
    const [filterImage, setFilterImage] = useState(''); // '' | 'has-image' | 'no-image'
    const [filterRating, setFilterRating] = useState(''); // 'rated', 'unrated', ''

    // Selection
    const [selectedIds, setSelectedIds] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [aiLoading, setAiLoading] = useState(false); // for edit mode AI
    const [editHoverRating, setEditHoverRating] = useState(0);

    const { success, error } = useToast();

    useEffect(() => {
        fetchDomains();
        fetchCategories();
    }, []);

    const fetchDomains = async () => {
        const s = await getDocs(collection(db, "domains"));
        setDomains(s.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const fetchCategories = async () => {
        const q = query(collection(db, "categories"), orderBy("name"));
        const s = await getDocs(q);
        setCategories(s.docs.map(d => d.data().name));
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this domain permanently?")) {
            try {
                await deleteDoc(doc(db, "domains", id));
                success("Domain deleted successfully!");
                fetchDomains();
                // Remove from selection if it was selected
                setSelectedIds(prev => prev.filter(selId => selId !== id));
            } catch (e) {
                console.error(e);
                error("Failed to delete domain.");
            }
        }
    };

    const startEdit = (domain) => {
        setEditingId(domain.id);
        setEditForm({
            ...domain,
            special: domain.special || 0,
            image: domain.image || '',
            category: domain.category || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
        setEditHoverRating(0);
    };

    const saveEdit = async () => {
        try {
            await updateDoc(doc(db, "domains", editingId), {
                name: editForm.name,
                price: Number(editForm.price),
                status: editForm.status,
                category: editForm.category,
                special: Number(editForm.special),
                image: editForm.image
            });
            setEditingId(null);
            success("Domain updated successfully!");
            fetchDomains();
        } catch (e) {
            console.error(e);
            error("Error updating domain");
        }
    };

    // AI Generation in Edit Mode
    const handleEditMagic = async () => {
        setAiLoading(true);
        try {
            const prompt = await callGeminiPrompt(editForm.name);
            const imgUrl = await callGeminiImage(prompt);
            setEditForm(prev => ({ ...prev, image: imgUrl }));
            success("New AI Image Generated!");
        } catch (e) {
            error(e.message);
        } finally {
            setAiLoading(false);
        }
    };

    // Advanced Filtering Logic
    const filtered = domains.filter(d => {
        // 1. Search Term
        if (searchTerm && !d.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // 2. Category
        if (filterCategory && d.category !== filterCategory) return false;

        // 3. Price Range
        if (filterPrice) {
            const p = d.price;
            if (filterPrice === '100-500' && (p < 100 || p > 500)) return false;
            if (filterPrice === '500-1000' && (p < 500 || p > 1000)) return false;
            if (filterPrice === '1000-1500' && (p < 1000 || p > 1500)) return false;
            if (filterPrice === '>2000' && p <= 2000) return false;
        }

        // 4. Has Image
        if (filterImage === 'has-image' && !d.image) return false;
        if (filterImage === 'no-image' && d.image) return false;

        // 5. Rating
        if (filterRating === 'rated' && (!d.special || d.special === 0)) return false;
        if (filterRating === 'unrated' && (d.special && d.special > 0)) return false;

        return true;
    });

    // Bulk Actions
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filtered.map(d => d.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} domains? This cannot be undone.`)) return;

        try {
            const batch = writeBatch(db);
            selectedIds.forEach(id => {
                const docRef = doc(db, "domains", id);
                batch.delete(docRef);
            });
            await batch.commit();

            success(`Successfully deleted ${selectedIds.length} domains.`);
            setSelectedIds([]);
            fetchDomains();
        } catch (e) {
            console.error(e);
            error("Error deleting batch.");
        }
    };

    const isAllSelected = filtered.length > 0 && filtered.every(d => selectedIds.includes(d.id));

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <div className="domain-manager-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <h3>Portfolio Inventory ({domains.length})</h3>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Showing: {filtered.length}</span>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="btn btn-primary"
                                style={{ background: '#ff4444', borderColor: '#ff4444', height: '32px', padding: '0 15px', fontSize: '0.9rem' }}
                            >
                                Trash {selectedIds.length} Selected
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Bar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
                    {/* Select All Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid var(--glass-border)', paddingRight: '15px', marginRight: '5px' }}>
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            title="Select All"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Search domains..."
                        className="admin-input search-input"
                        style={{ flex: '1 1 200px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />

                    <select
                        className="admin-input"
                        style={{ flex: '1 1 150px' }}
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        className="admin-input"
                        style={{ flex: '1 1 150px' }}
                        value={filterPrice}
                        onChange={e => setFilterPrice(e.target.value)}
                    >
                        <option value="">Any Price</option>
                        <option value="100-500">$100 - $500</option>
                        <option value="500-1000">$500 - $1,000</option>
                        <option value="1000-1500">$1,000 - $1,500</option>
                        <option value=">2000">&gt; $2,000</option>
                    </select>

                    <select
                        className="admin-input"
                        style={{ flex: '1 1 150px' }}
                        value={filterRating}
                        onChange={e => setFilterRating(e.target.value)}
                    >
                        <option value="">Any Rating</option>
                        <option value="rated">Rated (★)</option>
                        <option value="unrated">Unrated</option>
                    </select>

                    <select
                        className="admin-input"
                        style={{ flex: '1 1 150px' }}
                        value={filterImage}
                        onChange={e => setFilterImage(e.target.value)}
                    >
                        <option value="">Any Image Status</option>
                        <option value="has-image">Has Image</option>
                        <option value="no-image">No Image</option>
                    </select>

                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                            setSearchTerm('');
                            setFilterCategory('');
                            setFilterPrice('');
                            setFilterImage('');
                            setFilterRating('');
                            setSelectedIds([]);
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="domain-list" style={{ marginTop: '20px' }}>
                {filtered.map(domain => (
                    <div key={domain.id} className="domain-item" style={{
                        display: 'flex',
                        gap: '15px',
                        alignItems: 'center',
                        background: selectedIds.includes(domain.id) ? 'rgba(255, 68, 68, 0.1)' : undefined,
                        border: selectedIds.includes(domain.id) ? '1px solid rgba(255, 68, 68, 0.3)' : undefined
                    }}>
                        {/* Checkbox */}
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(domain.id)}
                                onChange={() => handleSelectOne(domain.id)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ flex: 1 }}>
                            {editingId === domain.id ? (
                                // Edit Mode
                                <div className="edit-mode-form" style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px',
                                    background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px'
                                }}>
                                    <div style={{ gridColumn: '1 / -1', fontWeight: 'bold' }}>Editing {domain.name}</div>

                                    {/* Row 1: Basic Info */}
                                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="admin-input" placeholder="Name" />
                                    <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="admin-input" placeholder="Price" />
                                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="admin-input">
                                        <option>Available</option><option>Sold</option><option>Pending</option>
                                    </select>
                                    <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="admin-input">
                                        <option value="">Select Category...</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>

                                    {/* Row 2: Rating */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <label>Rate:</label>
                                        <div className="star-rating" onMouseLeave={() => setEditHoverRating(0)}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    className={`star ${(editHoverRating || editForm.special) >= star ? 'filled' : ''}`}
                                                    onClick={() => setEditForm({ ...editForm, special: star })}
                                                    onMouseEnter={() => setEditHoverRating(star)}
                                                    style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Row 3: Image */}
                                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                className="admin-input"
                                                placeholder="Image URL"
                                                value={editForm.image}
                                                onChange={e => setEditForm({ ...editForm, image: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            className="btn btn-outline"
                                            onClick={handleEditMagic}
                                            disabled={aiLoading}
                                            type="button"
                                            title="Auto-Generate Image with AI"
                                        >
                                            {aiLoading ? '🤖 Generating...' : '✨ Auto-Gen Image'}
                                        </button>
                                        {editForm.image && (
                                            <div style={{ width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ffffff33' }}>
                                                <img src={editForm.image} alt="Pre" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="edit-actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button onClick={saveEdit} className="btn btn-primary btn-sm">Save Changes</button>
                                        <button onClick={cancelEdit} className="btn btn-outline btn-sm">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode (Unchanged logic, just ensure styling)
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <div className="domain-info">
                                        <div className="domain-name" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {domain.image && <span style={{ fontSize: '0.8rem' }}>🖼️</span>}
                                            {domain.name}
                                        </div>
                                        <div className="domain-meta">
                                            {domain.category} • <span className={`status-badge ${domain.status.toLowerCase()}`}>{domain.status}</span>
                                            {domain.special > 0 && <span style={{ marginLeft: '8px', color: '#ffd700' }}>{'★'.repeat(domain.special)}</span>}
                                        </div>
                                    </div>
                                    <div className="domain-actions">
                                        <span className="domain-price">${domain.price.toLocaleString()}</span>
                                        <div className="action-buttons">
                                            <button onClick={() => startEdit(domain)} className="btn btn-outline btn-sm">Edit</button>
                                            <button onClick={() => handleDelete(domain.id)} className="btn btn-outline btn-sm delete-btn">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DomainManager;
