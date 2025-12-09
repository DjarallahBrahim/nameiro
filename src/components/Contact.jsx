import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would send to a backend.
        // For now, we'll simulate a mailto link opening with the content.
        const subject = `Inquiry from ${formData.name}`;
        const body = `${formData.message}%0D%0A%0D%0AFrom: ${formData.name} (${formData.email})`;
        window.location.href = `mailto:brahim@leadnameiro.com?subject=${subject}&body=${body}`;
    };

    return (
        <section id="contact" className="contact-section container">
            <h2 className="section-title">Get In Touch</h2>

            <div className="contact-container glass-panel">
                <div className="contact-info">
                    <h3>Let's Negotiate</h3>
                    <p>Interested in a domain? Have a question? Reach out directly using the form or the details below.</p>

                    <div className="contact-details">
                        <div className="contact-item">
                            <span className="icon">📧</span>
                            <a href="mailto:brahim@leadnameiro.com">brahim@leadnameiro.com</a>
                        </div>

                        <div className="contact-item">
                            <span className="icon">📱</span>
                            <a href="tel:+33613158705">+33 6 13 15 87 05</a>
                        </div>

                        <div className="contact-item">
                            <span className="icon">💼</span>
                            <a href="https://www.linkedin.com/in/djarallah-brahim/" target="_blank" rel="noopener noreferrer">
                                LinkedIn Profile
                            </a>
                        </div>
                    </div>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            name="name"
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            name="message"
                            placeholder="I'm interested in..."
                            rows="5"
                            value={formData.message}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary">Send Message</button>
                </form>
            </div>
        </section>
    );
};

export default Contact;
