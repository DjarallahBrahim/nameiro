import React, { useState, useEffect } from 'react';
import './ClientFeedback.css';

import img1 from '../assets/images/feedback/IMG_3881.jpeg';
import img2 from '../assets/images/feedback/IMG_3882.jpeg';
import img3 from '../assets/images/feedback/IMG_3883.jpeg';
import img4 from '../assets/images/feedback/IMG_3884.jpeg';

const ClientFeedback = () => {
    const images = [img1, img2, img3, img4];
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-scroll logic
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 4000); // 4 seconds per slide
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <section className="client-feedback-section container">
            <div className="feedback-header">
                <h2 className="section-title">Client <span className="highlight">Feedback</span></h2>
                <p className="section-subtitle">Real experiences from our successful domain buyers.</p>
            </div>

            <div className="carousel-wrapper">
                <div className="carousel-container">
                    <div
                        className="carousel-track"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {images.map((src, idx) => (
                            <div className="carousel-slide" key={idx}>
                                <img src={src} alt={`Client feedback ${idx + 1}`} loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Dots */}
                <div className="carousel-dots">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            className={`dot ${idx === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ClientFeedback;
