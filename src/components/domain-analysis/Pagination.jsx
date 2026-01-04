import React from 'react';

const Pagination = ({
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    handleItemsPerPageChange,
    source // 'top' or 'bottom'
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination">
            <div className="page-size-selector">
                <label>Per page:</label>
                <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="page-size-select"
                >
                    <option value={20}>20</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                </select>
            </div>

            <div className="pagination-controls">
                <button
                    className="btn-page"
                    onClick={() => goToPage(1, source)}
                    disabled={currentPage === 1}
                >
                    ««
                </button>
                <button
                    className="btn-page"
                    onClick={() => goToPage(currentPage - 1, source)}
                    disabled={currentPage === 1}
                >
                    ‹
                </button>
                <span className="page-info">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    className="btn-page"
                    onClick={() => goToPage(currentPage + 1, source)}
                    disabled={currentPage === totalPages}
                >
                    ›
                </button>
                <button
                    className="btn-page"
                    onClick={() => goToPage(totalPages, source)}
                    disabled={currentPage === totalPages}
                >
                    »»
                </button>
            </div>
        </div>
    );
};

export default Pagination;
