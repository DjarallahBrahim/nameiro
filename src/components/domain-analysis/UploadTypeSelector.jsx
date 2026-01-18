import React, { useState } from 'react';

const UploadTypeSelector = ({
    uploadType,
    onUploadTypeChange,
    minMarketplaceValue,
    onMinMarketplaceValueChange
}) => {
    return (
        <div className="upload-type-selector">
            <h3 className="upload-type-title">Analysis Mode</h3>

            <div className="upload-type-options">
                {/* Manual Analysis Option */}
                <label className={`upload-type-option ${uploadType === 'manual' ? 'selected' : ''}`}>
                    <input
                        type="radio"
                        name="uploadType"
                        value="manual"
                        checked={uploadType === 'manual'}
                        onChange={(e) => onUploadTypeChange(e.target.value)}
                    />
                    <div className="option-content">
                        <div className="option-header">
                            <span className="option-icon">👤</span>
                            <span className="option-name">Manual Analysis</span>
                        </div>
                        <p className="option-description">
                            Upload CSV and analyze domains individually on-demand
                        </p>
                    </div>
                </label>

                {/* Automatic Analysis Option */}
                <label className={`upload-type-option ${uploadType === 'automatic' ? 'selected' : ''}`}>
                    <input
                        type="radio"
                        name="uploadType"
                        value="automatic"
                        checked={uploadType === 'automatic'}
                        onChange={(e) => onUploadTypeChange(e.target.value)}
                    />
                    <div className="option-content">
                        <div className="option-header">
                            <span className="option-icon">⚡</span>
                            <span className="option-name">Automatic Batch Analysis</span>
                        </div>
                        <p className="option-description">
                            Automatically analyze all domains in background
                        </p>
                    </div>
                </label>
            </div>

            {/* Marketplace Value Threshold (only for automatic mode) */}
            {uploadType === 'automatic' && (
                <div className="marketplace-threshold-section">
                    <label className="threshold-label">
                        <span className="threshold-label-text">
                            💰 Minimum Marketplace Value
                        </span>
                        <span className="threshold-badge">Filter Results</span>
                    </label>
                    <div className="threshold-input-wrapper">
                        <span className="threshold-currency">$</span>
                        <input
                            type="number"
                            className="threshold-input"
                            value={minMarketplaceValue}
                            onChange={(e) => onMinMarketplaceValueChange(parseInt(e.target.value) || 0)}
                            placeholder="e.g., 500"
                            min="0"
                            step="100"
                        />
                    </div>
                    <p className="threshold-helper">
                        Only domains with marketplace value ≥ this amount will be saved
                    </p>
                </div>
            )}
        </div>
    );
};

export default UploadTypeSelector;
