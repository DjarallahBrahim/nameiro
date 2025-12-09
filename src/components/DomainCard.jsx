import React from 'react';
import './DomainCard.css';

const DomainCard = ({ domain }) => {
    const [showDropdown, setShowDropdown] = React.useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const links = [
        { name: 'GoDaddy', url: `https://www.godaddy.com/domainsearch/find?domainToCheck=${domain.name}` },
        { name: 'Namecheap', url: `https://www.namecheap.com/domains/registration/results/?domain=${domain.name}` },
        { name: 'Spaceship', url: `https://www.spaceship.com/domain-search/?query=${domain.name}` },
        { name: 'Unstoppable', url: `https://unstoppabledomains.com/search?searchTerm=${domain.name}&searchRef=homepage` },
        { name: 'Visit Site', url: `http://${domain.name}`, isLocal: false }
    ];

    return (
        <div className="domain-card glass-panel fade-in">
            <div className="card-image-placeholder">
                {domain.image ? (
                    <img src={domain.image} alt={domain.name} className="domain-card-img" />
                ) : (
                    <span className="domain-ext">{domain.name.split('.').pop()}</span>
                )}
            </div>
            <div className="card-content">
                <div className="card-header">
                    <span className={`status-badge ${domain.status.toLowerCase()}`}>{domain.status}</span>
                    <span className="category-tag">{domain.category}</span>
                </div>
                <h3 className="domain-name">{domain.name}</h3>
                <div className="card-footer">
                    <div className="price-tag">
                        {domain.price > 0 ? `$${domain.price.toLocaleString()}` : "Make Offer"}
                    </div>

                    <div className="buy-dropdown-container" ref={dropdownRef}>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            Buy Through ▾
                        </button>

                        {showDropdown && (
                            <div className="buy-dropdown-menu">
                                {links.map(link => (
                                    <a
                                        key={link.name}
                                        href={link.url}
                                        target={link.isLocal ? "_self" : "_blank"}
                                        rel={link.isLocal ? "" : "noopener noreferrer"}
                                        className="buy-dropdown-item"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        {link.name} {link.isLocal ? '📩' : '↗'}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DomainCard;
