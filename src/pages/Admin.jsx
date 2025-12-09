import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AddDomain from '../components/admin/AddDomain';
import CategoryManager from '../components/admin/CategoryManager';
import DomainManager from '../components/admin/DomainManager';
import ApiManager from '../components/admin/ApiManager';
import './Admin.css';

const Admin = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('add'); // 'add', 'categories', 'list', 'settings'

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link to="/" className="btn btn-sm btn-outline" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>
                        ← View Site
                    </Link>
                    <div className="admin-brand">
                        Admin<span className="highlight">Board</span>
                    </div>
                </div>
                <div className="user-controls" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="user-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px 15px 5px 5px', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, var(--primary), #00ccff)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>
                            {currentUser?.email?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: '#ddd' }}>{currentUser?.email}</span>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
                    onClick={() => setActiveTab('add')}
                >
                    + Add Domain
                </button>
                <button
                    className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    Tags / Categories
                </button>
                <button
                    className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    Manage Portfolio
                </button>
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    API Settings
                </button>
            </div>

            <main className="admin-content fade-in">
                {activeTab === 'add' && <AddDomain />}
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'list' && <DomainManager />}
                {activeTab === 'settings' && <ApiManager />}
            </main>
        </div>
    );
};
export default Admin;