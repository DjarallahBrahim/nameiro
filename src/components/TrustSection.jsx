import React from 'react';
import './TrustSection.css';

const TrustSection = () => {
    const guarantees = [
        {
            icon: "🛡️",
            title: "Secure Transactions",
            desc: "We never handle payments directly. All transactions are processed via trusted brokers like Escrow.com, Dan, or Sedo for your complete safety."
        },
        {
            icon: "⚡",
            title: "Fast Transfer",
            desc: "Time is money. We guarantee to initiate the domain transfer process within 24 hours of purchase confirmation."
        },
        {
            icon: "✅",
            title: "Verified Ownership",
            desc: "Every domain listed is exclusively owned by us. No third-party delays, no uncertain negotiations. You deal directly with the owner."
        },
        {
            icon: "🤝",
            title: "Lifetime Support",
            desc: "Not tech-savvy? No problem. We provide free guidance on how to transfer, set up DNS, and get your new domain running."
        }
    ];

    return (
        <section className="trust-section container">
            <div className="trust-header">
                <h2 className="section-title">The DomainBags <span className="highlight">Guarantee</span></h2>
                <p className="section-subtitle">Premium domains deserve a premium buying experience.</p>
            </div>

            <div className="trust-grid">
                {guarantees.map((item, idx) => (
                    <div className="trust-card" key={idx}>
                        <div className="trust-icon">{item.icon}</div>
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TrustSection;
