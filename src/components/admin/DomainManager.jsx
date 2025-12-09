import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const DomainManager = () => {
    const [domains, setDomains] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        const s = await getDocs(collection(db, "domains"));
        setDomains(s.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this domain permanently?")) {
            await deleteDoc(doc(db, "domains", id));
            fetchDomains();
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
            fetchDomains();
        } catch (e) {
            alert("Error updating");
        }
    };

    const filtered = domains.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Portfolio Inventory ({domains.length})</h3>
                <input
                    type="text"
                    placeholder="Search domains..."
                    className="admin-input"
                    style={{ width: '300px' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
                {filtered.map(domain => (
                    <div key={domain.id} style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '15px',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid var(--glass-border)'
                    }}>
                        {editingId === domain.id ? (
                            // Edit Mode
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="admin-input" />
                                <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="admin-input" style={{ width: '100px' }} />
                                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="admin-input">
                                    <option>Available</option><option>Sold</option><option>Pending</option>
                                </select>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={saveEdit} className="btn btn-primary btn-sm">Save</button>
                                    <button onClick={cancelEdit} className="btn btn-outline btn-sm">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{domain.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {domain.category} • <span className={`status-badge ${domain.status.toLowerCase()}`}>{domain.status}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${domain.price.toLocaleString()}</span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => startEdit(domain)} className="btn btn-outline btn-sm">Edit</button>
                                        <button onClick={() => handleDelete(domain.id)} className="btn btn-outline btn-sm" style={{ borderColor: '#ff4444', color: '#ff4444' }}>Delete</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DomainManager;
