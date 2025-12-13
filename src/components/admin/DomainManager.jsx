import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

const DomainManager = () => {
    const [domains, setDomains] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPrice, setFilterPrice] = useState('');
    const [filterImage, setFilterImage] = useState(false); // checkbox: has image
    const [filterRating, setFilterRating] = useState(''); // 'rated', 'unrated', ''

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
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
            } catch (e) {
                console.error(e);
                error("Failed to delete domain.");
            }
        }
    };

    const startEdit = (domain) => {
        setEditingId(domain.id);
        setEditForm(domain);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        try {
            await updateDoc(doc(db, "domains", editingId), {
                name: editForm.name,
                price: Number(editForm.price),
                status: editForm.status
                // category is skipped for simplicity here, but can be added
            });
            setEditingId(null);
            success("Domain updated successfully!");
            fetchDomains();
        } catch (e) {
            console.error(e);
            error("Error updating domain");
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
            // Note: Gapped ranges (e.g. 1500-2000) are excluded by this specific list as per request
        }

        // 4. Has Image
        if (filterImage && !d.image) return false;

        // 5. Rating
        if (filterRating === 'rated' && (!d.special || d.special === 0)) return false;
        if (filterRating === 'unrated' && (d.special && d.special > 0)) return false;

        return true;
    });

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <div className="domain-manager-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <h3>Portfolio Inventory ({domains.length})</h3>
                    <span style={{ color: 'var(--text-muted)' }}>Showing: {filtered.length}</span>
                </div>

                {/* Filters Bar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
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

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 10px' }}>
                        <input
                            type="checkbox"
                            checked={filterImage}
                            onChange={e => setFilterImage(e.target.checked)}
                        />
                        Has Image
                    </label>

                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                            setSearchTerm('');
                            setFilterCategory('');
                            setFilterPrice('');
                            setFilterImage(false);
                            setFilterRating('');
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="domain-list" style={{ marginTop: '20px' }}>
                {filtered.map(domain => (
                    <div key={domain.id} className="domain-item">
                        {editingId === domain.id ? (
                            // Edit Mode
                            <div className="edit-mode-form">
                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="admin-input" />
                                <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="admin-input price-input" />
                                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="admin-input">
                                    <option>Available</option><option>Sold</option><option>Pending</option>
                                </select>
                                <div className="edit-actions">
                                    <button onClick={saveEdit} className="btn btn-primary btn-sm">Save</button>
                                    <button onClick={cancelEdit} className="btn btn-outline btn-sm">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
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
                            </>
                        )}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No domains match your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DomainManager;
