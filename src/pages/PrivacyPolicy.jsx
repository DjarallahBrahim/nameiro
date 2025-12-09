import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
    return (
        <>
            <Navbar />
            <div className="container" style={{ paddingTop: '100px', minHeight: '80vh' }}>
                <h1 className="section-title">Privacy <span className="highlight">Policy</span></h1>
                <div className="glass-panel" style={{ padding: '40px', marginTop: '30px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>1. Introduction</h3>
                    <p>Welcome to DomainBags. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>2. Data We Collect</h3>
                    <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows: Identity Data (name), Contact Data (email address), and Usage Data (how you use our website).</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>3. How We Use Your Data</h3>
                    <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances: To facilitate domain inquiries and transfers, and to improve our website experience.</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>4. Data Security</h3>
                    <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way.</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>5. Contact Us</h3>
                    <p>If you have any questions about this privacy policy or our privacy practices, please contact us via the form on our homepage.</p>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PrivacyPolicy;
