import React from 'react';
import './BatchProgressTracker.css';

const BatchProgressTracker = ({
    jobData,
    onCancel
}) => {
    if (!jobData) return null;

    const {
        status,
        currentBatch,
        totalBatches,
        processedDomains,
        totalDomains,
        qualifyingDomains,
        minMarketplaceValue,
        errors = [],
        progress,
        estimatedTimeRemaining
    } = jobData;

    const formatTime = (seconds) => {
        if (!seconds || seconds < 0) return '...';
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    const getStatusText = () => {
        switch (status) {
            case 'processing':
                return `Processing Batch ${currentBatch} of ${totalBatches}...`;
            case 'completed':
                return 'Analysis Complete!';
            case 'failed':
                return 'Analysis Failed';
            case 'cancelled':
                return 'Analysis Cancelled';
            default:
                return 'Initializing...';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'processing':
                return '#60a5fa';
            case 'completed':
                return '#22c55e';
            case 'failed':
                return '#ef4444';
            case 'cancelled':
                return '#f59e0b';
            default:
                return '#94a3b8';
        }
    };

    return (
        <div className="batch-progress-tracker">
            <div className="progress-header">
                <div className="progress-status">
                    <div
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor() }}
                    />
                    <h3 className="status-text">{getStatusText()}</h3>
                </div>
                {status === 'processing' && (
                    <button
                        className="btn-cancel-batch"
                        onClick={onCancel}
                        title="Cancel batch processing"
                    >
                        ✕ Cancel
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{
                        width: `${progress || 0}%`,
                        backgroundColor: getStatusColor()
                    }}
                />
            </div>
            <div className="progress-percentage">{Math.round(progress || 0)}%</div>

            {/* Stats Grid */}
            <div className="progress-stats">
                <div className="stat-item">
                    <span className="stat-label">Processed</span>
                    <span className="stat-value">
                        {processedDomains?.toLocaleString() || 0} / {totalDomains?.toLocaleString() || 0}
                    </span>
                </div>

                <div className="stat-item highlight">
                    <span className="stat-label">Qualifying Domains</span>
                    <span className="stat-value qualifying">
                        {qualifyingDomains?.toLocaleString() || 0}
                    </span>
                    {minMarketplaceValue > 0 && (
                        <span className="stat-subtext">
                            marketplace ≥ ${minMarketplaceValue.toLocaleString()}
                        </span>
                    )}
                </div>

                {errors.length > 0 && (
                    <div className="stat-item error">
                        <span className="stat-label">Errors</span>
                        <span className="stat-value">{errors.length}</span>
                    </div>
                )}

                {status === 'processing' && estimatedTimeRemaining > 0 && (
                    <div className="stat-item">
                        <span className="stat-label">Est. Time Remaining</span>
                        <span className="stat-value">{formatTime(estimatedTimeRemaining)}</span>
                    </div>
                )}
            </div>

            {/* Batch Progress */}
            {status === 'processing' && (
                <div className="batch-indicator">
                    <div className="batch-dots">
                        {Array.from({ length: Math.min(totalBatches, 10) }).map((_, i) => (
                            <div
                                key={i}
                                className={`batch-dot ${i < currentBatch ? 'completed' : ''} ${i === currentBatch - 1 ? 'active' : ''}`}
                                title={`Batch ${i + 1}`}
                            />
                        ))}
                        {totalBatches > 10 && <span className="batch-more">+{totalBatches - 10}</span>}
                    </div>
                </div>
            )}

            {/* Completion Message */}
            {status === 'completed' && (
                <>
                    <div className="completion-message">
                        <span className="completion-icon">✓</span>
                        <p className="completion-text">
                            Found <strong>{qualifyingDomains}</strong> qualifying domain{qualifyingDomains !== 1 ? 's' : ''}
                            {minMarketplaceValue > 0 && ` with marketplace value ≥ $${minMarketplaceValue.toLocaleString()}`}
                        </p>
                    </div>

                    {/* Download Button */}
                    {jobData.downloadUrl && (
                        <div className="download-section">
                            <a
                                href={jobData.downloadUrl}
                                download="filtered-domains.csv"
                                className="btn-download-csv"
                            >
                                📥 Download Filtered CSV ({qualifyingDomains} domains)
                            </a>
                            <p className="download-note">
                                Download link expires in 24 hours
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Error List */}
            {errors.length > 0 && status !== 'processing' && (
                <details className="error-details">
                    <summary className="error-summary">
                        View {errors.length} error{errors.length !== 1 ? 's' : ''}
                    </summary>
                    <div className="error-list">
                        {errors.slice(0, 10).map((error, i) => (
                            <div key={i} className="error-item">
                                <span className="error-domain">{error.domain}</span>
                                <span className="error-message">{error.message}</span>
                            </div>
                        ))}
                        {errors.length > 10 && (
                            <div className="error-more">
                                ... and {errors.length - 10} more
                            </div>
                        )}
                    </div>
                </details>
            )}
        </div>
    );
};

export default BatchProgressTracker;
