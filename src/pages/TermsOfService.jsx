import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsOfService = () => {
    return (
        <>
            <Navbar />
            <div className="container" style={{ paddingTop: '100px', minHeight: '80vh' }}>
                <h1 className="section-title">Terms of <span className="highlight">Service</span></h1>
                <div className="glass-panel" style={{ padding: '40px', marginTop: '30px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>1. Agreement to Terms</h3>
                    <p>By accessing or using DomainBags, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>2. Domain Sales</h3>
                    <p>All domains listed on DomainBags are owned by us. We use third-party escrow and transfer services (such as Escrow.com, Dan.com, or Sedo) to ensure secure transactions. Ownership is transferred only upon confirmation of full payment.</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>3. Pricing</h3>
                    <p>Prices for domains are subject to change without notice. We reserve the right to modify or discontinue the listing of any domain at any time.</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>4. Intellectual Property</h3>
                    <p>The Service and its original content, features and functionality are and will remain the exclusive property of DomainBags and its licensors.</p>

                    <h3 style={{ color: '#fff', marginTop: '20px' }}>5. Limitation of Liability</h3>
                    <p>In no event shall DomainBags be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default TermsOfService;
