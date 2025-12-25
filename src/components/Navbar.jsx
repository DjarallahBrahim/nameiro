import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (e, targetId) => {
        e.preventDefault();
        setMobileMenuOpen(false); // Close menu on click

        if (location.pathname === '/') {
            const element = document.querySelector(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(`/${targetId}`);
        }
    };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container nav-content">
                <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                    Domain<span className="highlight">Bags</span>
                </Link>

                <div className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? '✕' : '☰'}
                </div>

                <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                    <li><a href="#hero" onClick={(e) => handleNavClick(e, '#hero')}>Home</a></li>
                    <li><a href="#about" onClick={(e) => handleNavClick(e, '#about')}>About</a></li>
                    <li><a href="#portfolio" onClick={(e) => handleNavClick(e, '#portfolio')}>Domains</a></li>
                    <li><Link to="/analyse-domain" target="_blank" className="nav-link">Analyse Domain</Link></li>
                    <li><a href="#contact" className="btn btn-primary btn-sm" onClick={(e) => handleNavClick(e, '#contact')}>Contact</a></li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
