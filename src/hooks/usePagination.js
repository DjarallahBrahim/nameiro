import { useState, useMemo } from 'react';

/**
 * Custom hook for managing pagination state and logic
 */
export const usePagination = (filteredDomains) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [scrollDirection, setScrollDirection] = useState('down');

    const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);

    const paginatedDomains = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredDomains.slice(start, end);
    }, [filteredDomains, currentPage, itemsPerPage]);

    const goToPage = (page, source) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
        if (source === 'top') {
            setScrollDirection('down');
        } else if (source === 'bottom') {
            setScrollDirection('up');
        }
    };

    const handleItemsPerPageChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
    };

    return {
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalPages,
        paginatedDomains,
        goToPage,
        handleItemsPerPageChange,
        scrollDirection
    };
};
