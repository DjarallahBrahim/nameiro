import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const q = query(collection(db, "categories"), orderBy("name"));
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(list);
        } catch (e) {
            console.error("Error fetching categories", e);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCat.trim()) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "categories"), {
                name: newCat.trim(),
                created: serverTimestamp()
            });
            setNewCat('');
            fetchCategories();
        } catch (e) {
            alert("Error adding category");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            await deleteDoc(doc(db, "categories", id));
            fetchCategories();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <h3>Manage Categories</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                Create categories here to use them in the dropdown when adding domains.
            </p>

            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <input
                    type="text"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="New Category Name (e.g. AI, Crypto)"
                    className="admin-input"
                    required
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>Add</button>
            </form>

            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {categories.map(cat => (
                    <div key={cat.id} style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '10px 15px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>{cat.name}</span>
                        <button
                            onClick={() => handleDelete(cat.id)}
                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '1.2rem' }}
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManager;
