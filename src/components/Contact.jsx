import React from 'react';
import './Contact.css';

const Contact = () => {
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

                <form action="https://api.web3forms.com/submit" method="POST" className="contact-form">
                    <input type="hidden" name="access_key" value={import.meta.env.VITE_WEB3FORMS_KEY} />
                    
                    <div className="form-group">
                        <input
                            type="text"
                            name="name"
                            placeholder="Your Name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Your Email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            name="message"
                            placeholder="I'm interested in..."
                            rows="5"
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Send Message
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Contact;
