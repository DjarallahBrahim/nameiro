import React from 'react';
import './TrustedBrands.css';

import brand1 from '../assets/images/brands/BoradWide.png';
import brand2 from '../assets/images/brands/Calibray.png';
import brand3 from '../assets/images/brands/EricAdam.png';
import brand4 from '../assets/images/brands/JeffKnapp.png';
import brand5 from '../assets/images/brands/Oexel.png';
import brand6 from '../assets/images/brands/peruTrek.png';


const TrustedBrands = () => {
    // We duplicate the array to create a seamless infinite scrolling marquee
    const brands = [brand1, brand2, brand3, brand4, brand5, brand6];

    return (
        <section className="trusted-brands-section container">
            <div className="brands-header">
                <h2 className="section-title">Brands Bought From <span className="highlight">Us</span></h2>
                <p className="section-subtitle">Join the growing list of successful companies starting their journey with a premium name.</p>
            </div>

            <div className="marquee-container">
                <div className="marquee-content">
                    {/* First set */}
                    {brands.map((src, idx) => (
                        <div className="brand-logo" key={`b1-${idx}`}>
                            <img src={src} alt="Trusted Brand" loading="lazy" />
                        </div>
                    ))}
                    {/* Second set for continuous loop */}
                    {brands.map((src, idx) => (
                        <div className="brand-logo" key={`b2-${idx}`}>
                            <img src={src} alt="Trusted Brand" loading="lazy" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustedBrands;
