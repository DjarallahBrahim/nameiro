import React from 'react';
import './Hero.css';

const Hero = () => {
    return (
        <section id="hero" className="hero-section">
            <div className="hero-bg-glow"></div>
            <div className="container hero-content fade-in">
                <div className="hero-header-row">
                    <div className="profile-container">
                        <img src="/me.jpeg" alt="Seller Profile" className="profile-avatar" />
                    </div>
                    <h1 className="hero-title">
                        Premium Domains for <br />
                        <span className="gradient-text">Next-Gen Ideas</span>
                    </h1>
                </div>
                <p className="hero-subtitle">
                    Secure the perfect digital identity for your startup, brand, or project.
                    Curated names for AI, Crypto, and Tech.
                </p>
                <div className="hero-actions">
                    <a href="#portfolio" className="btn btn-primary">Browse Portfolio</a>
                    <a href="#contact" className="btn btn-outline">Start Chat</a>
                </div>
            </div>
        </section>
    );
};

export default Hero;
