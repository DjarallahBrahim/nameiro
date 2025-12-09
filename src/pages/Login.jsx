import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate('/admin');
        }
    }, [currentUser, navigate]);

    const handleLogin = async () => {
        try {
            await login();
            navigate('/admin');
        } catch (error) {
            console.error("Failed to log in", error);
            alert('Login Failed: ' + error.message);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark)',
            color: '#fff'
        }}>
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '20px' }}>Admin Access</h2>
                <p style={{ marginBottom: '30px', color: 'var(--text-muted)' }}>
                    Please sign in to manage your domain portfolio.
                </p>
                <button className="btn btn-primary" onClick={handleLogin}>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default Login;
