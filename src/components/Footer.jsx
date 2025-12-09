import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="container footer-content">
                <div className="footer-brand">
                    <div className="logo">
                        Domain<span className="highlight">Bags</span>
                    </div>
                    <p className="copyright">
                        © {new Date().getFullYear()} DomainBags. All rights reserved.
                    </p>
                </div>

                <div className="footer-links">
                    <Link to="/privacy-policy">Privacy Policy</Link>
                    <Link to="/terms-of-service">Terms of Service</Link>
                    <a href="#contact">Contact Us</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
