import React from 'react';

const AuthGate = ({ login }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            minHeight: '400px'
        }}>
            <div className="glass-panel" style={{
                padding: '50px',
                maxWidth: '450px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '20px',
                    textShadow: '0 0 20px rgba(0, 242, 234, 0.3)'
                }}>🔒</div>
                <h2 style={{
                    marginBottom: '15px',
                    fontSize: '1.8rem',
                    background: 'linear-gradient(to right, #fff, var(--primary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Access Required</h2>
                <p style={{
                    marginBottom: '35px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.6',
                    fontSize: '1.1rem'
                }}>
                    Please sign in to unlock domain upload and analysis tools.
                    <br />
                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Secure authentication via Google</span>
                </p>
                <button className="btn btn-primary" style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 28px',
                    fontSize: '1.1rem'
                }} onClick={async () => {
                    try {
                        await login();
                    } catch (error) {
                        console.error("Login failed:", error);
                        alert("Login failed: " + error.message);
                    }
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default AuthGate;
