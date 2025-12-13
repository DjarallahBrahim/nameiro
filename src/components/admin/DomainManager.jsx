import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

const DomainManager = () => {
    const [domains, setDomains] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const { success, error } = useToast();

    useEffect(() => {
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        const s = await getDocs(collection(db, "domains"));
        setDomains(s.docs.map(d => ({ id: d.id, ...d.data() })));
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

    const filtered = domains.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <div className="domain-manager-header">
                <h3>Portfolio Inventory ({domains.length})</h3>
                <input
                    type="text"
                    placeholder="Search domains..."
                    className="admin-input search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="domain-list">
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
                                    <div className="domain-name">{domain.name}</div>
                                    <div className="domain-meta">
                                        {domain.category} • <span className={`status-badge ${domain.status.toLowerCase()}`}>{domain.status}</span>
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
            </div>
        </div>
    );
};

export default DomainManager;
