import React, { useState } from 'react';

const UploadSection = ({ processFile }) => {
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div
            className={`upload-section ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
        >
            <div className="upload-icon">📂</div>
            <h3>Upload your Domain List</h3>
            <p className="upload-text">Supported format: CSV (Columns: Domain, TLD)</p>
            <p className="upload-hint" style={{ marginTop: '0.5rem', fontSize: '0.85em', opacity: 0.8, maxWidth: '80%', margin: '0.5rem auto' }}>
                The TLD is optional.<br />
                Note: If the TLD is not present, the "Filter by Extension" will be empty.
            </p>
            <input
                type="file"
                id="file-upload"
                className="file-input"
                accept=".csv,.txt"
                onChange={handleFileChange}
            />
            <button className="btn-select-file">Select File</button>
        </div>
    );
};

export default UploadSection;
