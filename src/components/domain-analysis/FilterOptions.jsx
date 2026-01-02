import React from 'react';

const FilterOptions = ({ excludeNumbers, setExcludeNumbers, excludeHyphens, setExcludeHyphens }) => {
    return (
        <div className="filter-options">
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={excludeNumbers}
                    onChange={(e) => setExcludeNumbers(e.target.checked)}
                />
                Exclude Numbers (0-9)
            </label>
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={excludeHyphens}
                    onChange={(e) => setExcludeHyphens(e.target.checked)}
                />
                Exclude Hyphens (-)
            </label>
        </div>
    );
};

export default FilterOptions;
