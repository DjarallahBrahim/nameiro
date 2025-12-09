import React from 'react';
import './SellerProfile.css';

const SellerProfile = () => {
    return (
        <section className="seller-section container">
            <div style={{ width: '100%', maxWidth: '900px', marginBottom: '30px', textAlign: 'center' }}>
                <h2 className="section-title">About <span className="highlight">Me</span></h2>
            </div>

            <div className="seller-card glass-panel">
                <div className="seller-content">
                    <div className="seller-avatar-wrapper">
                        <div className="seller-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                            <img src="/me.jpeg" alt="Djarallah Brahim" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="verified-badge" title="Verified Seller">✓</div>
                    </div>

                    <div className="seller-info">
                        <h2 className="seller-name">Djarallah Brahim <span className="flag">🇫🇷</span></h2>
                        <p className="seller-role">Computer Engineer & Domain Investor</p>

                        <div className="seller-bio">
                            <p>
                                Hello! I'm Djarallah, a Computer Engineer and passionate Domain Flipper based in France.
                                With years of experience in the digital space, I specialize in curating premium, brandable names for startups and visionaries.
                            </p>
                            <p>
                                As a father and professional, I value integrity and transparency above all.
                                My goal is not just to sell a domain, but to provide you with the perfect foundation for your next big venture.
                            </p>
                        </div>

                        <div className="seller-stats">
                            <div className="stat-item">
                                <span className="stat-value">5+</span>
                                <span className="stat-label">Years Experience</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">100%</span>
                                <span className="stat-label">Secure Transfer</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">24h</span>
                                <span className="stat-label">Response Time</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SellerProfile;
