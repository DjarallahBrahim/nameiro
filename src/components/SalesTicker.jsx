import React from 'react';
import { sales } from '../data/mockData';
import './SalesTicker.css';

const SalesTicker = () => {
    return (
        <div className="sales-ticker-container">
            <div className="ticker-label">Recent Sales</div>
            <div className="ticker-track">
                <div className="ticker-content">
                    {[...sales, ...sales].map((sale, index) => (
                        <div className="ticker-item" key={index}>
                            <span className="sale-name">{sale.name}</span>
                            <span className="sale-price">${sale.price.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SalesTicker;
