import React from 'react';

const ColumnMappingModal = ({
    columns,
    suggestedMappings,
    onConfirm,
    onCancel
}) => {
    const [mappings, setMappings] = React.useState(suggestedMappings);

    const handleMappingChange = (field, value) => {
        setMappings(prev => ({
            ...prev,
            [field]: value || null
        }));
    };

    const handleConfirm = () => {
        if (!mappings.domainColumn) {
            alert('Please select a column for Domain Name (required)');
            return;
        }
        onConfirm(mappings);
    };

    // Group columns by type
    const textColumns = columns.filter(c => c.type === 'text');
    const dateColumns = columns.filter(c => c.type === 'date');
    const numberColumns = columns.filter(c => c.type === 'number');

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content column-mapping-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Map CSV Columns</h2>
                    <p className="modal-subtitle">Select which columns to use for your domain data</p>
                </div>

                <div className="modal-body">
                    {/* Domain Name Mapping (Required) */}
                    <div className="mapping-field">
                        <label className="mapping-label required">
                            Domain Name <span className="required-badge">Required</span>
                        </label>
                        <select
                            className="mapping-select"
                            value={mappings.domainColumn || ''}
                            onChange={(e) => handleMappingChange('domainColumn', e.target.value)}
                        >
                            <option value="">-- Select Column --</option>
                            {textColumns.map(col => (
                                <option key={col.name} value={col.name}>
                                    {col.name} {col.sample.length > 0 && `(e.g., ${col.sample[0]})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Mapping (Optional) */}
                    <div className="mapping-field">
                        <label className="mapping-label">
                            Date <span className="optional-badge">Optional</span>
                        </label>
                        <select
                            className="mapping-select"
                            value={mappings.dateColumn || ''}
                            onChange={(e) => handleMappingChange('dateColumn', e.target.value)}
                        >
                            <option value="">-- None --</option>
                            {dateColumns.map(col => (
                                <option key={col.name} value={col.name}>
                                    {col.name} {col.sample.length > 0 && `(e.g., ${col.sample[0]})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Price/Bid Mapping (Optional) */}
                    <div className="mapping-field">
                        <label className="mapping-label">
                            Price/Bid <span className="optional-badge">Optional</span>
                        </label>
                        <select
                            className="mapping-select"
                            value={mappings.priceColumn || ''}
                            onChange={(e) => handleMappingChange('priceColumn', e.target.value)}
                        >
                            <option value="">-- None --</option>
                            {numberColumns.map(col => (
                                <option key={col.name} value={col.name}>
                                    {col.name} {col.sample.length > 0 && `(e.g., ${col.sample[0]})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Preview Section */}
                    <div className="column-preview">
                        <h3>Detected Columns ({columns.length})</h3>
                        <div className="column-list">
                            {columns.map(col => (
                                <div key={col.name} className="column-item">
                                    <span className="column-name">{col.name}</span>
                                    <span className={`column-type type-${col.type}`}>{col.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn-confirm" onClick={handleConfirm}>
                        Confirm & Import
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ColumnMappingModal;
