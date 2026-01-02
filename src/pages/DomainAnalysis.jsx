import React, { useState } from 'react';
import './DomainAnalysis.css';
import './DomainAnalysis-scroll-hint.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Custom Hooks
import { useDomainData } from '../hooks/useDomainData';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import { useAnalysis } from '../hooks/useAnalysis';
import { useSettings } from '../hooks/useSettings';
import { useFavorites } from '../hooks/useFavorites';

// UI Components
import AuthGate from '../components/domain-analysis/AuthGate';
import FilterOptions from '../components/domain-analysis/FilterOptions';
import UploadSection from '../components/domain-analysis/UploadSection';
import StatsRow from '../components/domain-analysis/StatsRow';
import SearchBar from '../components/domain-analysis/SearchBar';
import BlockFilter from '../components/domain-analysis/BlockFilter';
import FilterGroup from '../components/domain-analysis/FilterGroup';
import Pagination from '../components/domain-analysis/Pagination';
import DomainList from '../components/domain-analysis/DomainList';
import SettingsModal from '../components/domain-analysis/SettingsModal';
import SuperValuationModal from '../components/domain-analysis/SuperValuationModal';
import SuperValuationButton from '../components/domain-analysis/SuperValuationButton';

const DomainAnalysis = () => {
    const { currentUser, login, logout } = useAuth();
    const navigate = useNavigate();

    // Domain Data Hook
    const {
        rawDomains,
        domains,
        originalCount,
        hasAnalyzed,
        processFile,
        resetDomains,
        auctionEndResults,
        hasAuctionData,
        availableAuctionDates,
        auctionDateCounts
    } = useDomainData();

    // Filters Hook
    const {
        excludeNumbers,
        setExcludeNumbers,
        excludeHyphens,
        setExcludeHyphens,
        availableExtensions,
        selectedExtensions,
        setSelectedExtensions,
        extensionCounts,
        extensionDropdownOpen,
        setExtensionDropdownOpen,
        searchQuery,
        setSearchQuery,
        searchMode,
        setSearchMode,
        blockQuery,
        setBlockQuery,
        blockMode,
        setBlockMode,
        selectedAuctionDate,
        setSelectedAuctionDate,
        auctionDropdownOpen,
        setAuctionDropdownOpen,
        sortOrder,
        setSortOrder,
        sortDropdownOpen,
        setSortDropdownOpen,
        filteredDomains
    } = useFilters(rawDomains, auctionEndResults, hasAuctionData);

    // Settings Hook
    const {
        atomCredentials,
        setAtomCredentials,
        humbleworthToken,
        setHumbleworthToken,
        showAtomSettings,
        setShowAtomSettings,
        handleSaveSettings
    } = useSettings(currentUser);

    // Analysis Hook
    const {
        analysisResults,
        setAnalysisResults,
        analyzingDomains,
        handleAnalyseDomain,
        handleAnalyseAtom,
        handleSuperValuation,
        isSuperValuating
    } = useAnalysis(humbleworthToken, atomCredentials);

    // Pagination Hook
    const {
        currentPage,
        setCurrentPage,
        itemsPerPage,
        totalPages,
        paginatedDomains,
        goToPage,
        handleItemsPerPageChange,
        scrollDirection
    } = usePagination(filteredDomains);

    // Favorites Hook
    const {
        favorites,
        toggleFavorite,
        isFavorite
    } = useFavorites(currentUser);

    // Favorites Filter State
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // When showing favorites only, use favorites from Firebase directly
    // Otherwise, use the filtered domains from the current CSV
    const displayedDomains = showFavoritesOnly
        ? favorites  // Use favorites array directly from Firebase
        : filteredDomains;  // Use filtered domains from current CSV

    // Recalculate pagination for displayed domains
    const displayedPaginatedDomains = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return displayedDomains.slice(start, end);
    }, [displayedDomains, currentPage, itemsPerPage]);

    const displayedTotalPages = Math.ceil(displayedDomains.length / itemsPerPage);

    // Reset to page 1 when toggling favorites mode
    React.useEffect(() => {
        setCurrentPage(1);
    }, [showFavoritesOnly, setCurrentPage]);

    // Load saved analysis results from favorites when in favorites mode
    React.useEffect(() => {
        if (showFavoritesOnly && favorites.length > 0) {
            const savedResults = {};
            favorites.forEach(fav => {
                if (fav.humbleworth || fav.atom) {
                    savedResults[fav.domain] = {
                        marketplace: fav.humbleworth?.marketplace,
                        brokerage: fav.humbleworth?.brokerage,
                        auction: fav.humbleworth?.auction,
                        atom: fav.atom
                    };
                }
            });
            // Merge saved results with current analysis results
            setAnalysisResults(prev => ({ ...prev, ...savedResults }));
        }
    }, [showFavoritesOnly, favorites, setAnalysisResults]);

    // Super Valuation Modal State
    const [showSuperValuationModal, setShowSuperValuationModal] = useState(false);

    // Wrapper function to format analysis data for favorites
    const handleToggleFavorite = async (domainName, analysisResult) => {
        const formattedData = {};

        if (analysisResult) {
            // Extract Humbleworth data if available
            if (analysisResult.marketplace !== undefined) {
                formattedData.humbleworth = {
                    marketplace: analysisResult.marketplace,
                    brokerage: analysisResult.brokerage,
                    auction: analysisResult.auction
                };
            }

            // Extract Atom data if available
            if (analysisResult.atom) {
                formattedData.atom = analysisResult.atom;
            }
        }

        await toggleFavorite(domainName, formattedData);
    };

    // Handle Super Valuation
    const onSuperValuation = () => {
        setShowSuperValuationModal(false);
        handleSuperValuation(paginatedDomains);
    };

    // Handle Reset
    const handleReset = () => {
        resetDomains();
        setCurrentPage(1);
        setAnalysisResults({});
    };

    return (
        <div className="domain-analysis-container">
            {/* Super Valuation Confirmation Modal */}
            <SuperValuationModal
                show={showSuperValuationModal}
                onClose={() => setShowSuperValuationModal(false)}
                onConfirm={onSuperValuation}
                domainCount={paginatedDomains.length}
            />

            <div className="analysis-card">
                {/* Header */}
                <div className="analysis-header">
                    <Link to="/" className="btn-home" title="Back to Home">
                        <span>🏠</span> Home
                    </Link>

                    <h1 className="analysis-title">Domain List Analysis</h1>

                    {currentUser && (
                        <div className="header-actions-right">
                            <button
                                className="btn-settings"
                                onClick={() => setShowAtomSettings(!showAtomSettings)}
                                title="Configure Atom API"
                            >
                                ⚙️
                            </button>
                            <button
                                className="btn-logout"
                                onClick={async () => {
                                    try {
                                        await logout();
                                        navigate('/analyse-domain');
                                        window.location.reload();
                                    } catch (error) {
                                        console.error("Logout failed", error);
                                    }
                                }}
                                title="Sign Out"
                            >
                                <span>🚪</span> Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* Settings Modal */}
                <SettingsModal
                    show={showAtomSettings}
                    onClose={() => setShowAtomSettings(false)}
                    atomCredentials={atomCredentials}
                    setAtomCredentials={setAtomCredentials}
                    humbleworthToken={humbleworthToken}
                    setHumbleworthToken={setHumbleworthToken}
                    onSave={handleSaveSettings}
                />

                {/* Main Content */}
                {!currentUser ? (
                    <AuthGate login={login} />
                ) : !hasAnalyzed && !showFavoritesOnly ? (
                    <>
                        <FilterOptions
                            excludeNumbers={excludeNumbers}
                            setExcludeNumbers={setExcludeNumbers}
                            excludeHyphens={excludeHyphens}
                            setExcludeHyphens={setExcludeHyphens}
                        />

                        {/* Show favorites button even without CSV */}
                        {favorites.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <button
                                    className="btn-favorites-toggle"
                                    onClick={() => setShowFavoritesOnly(true)}
                                    style={{
                                        background: 'linear-gradient(135deg, #ec4899, #be185d)',
                                        color: 'white',
                                        border: '1px solid #be185d',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span>❤️</span>
                                    View My Saved Favorites ({favorites.length})
                                </button>
                            </div>
                        )}

                        <UploadSection processFile={processFile} />
                    </>
                ) : (
                    <div className="results-section">
                        {/* Favorites Mode Banner */}
                        {showFavoritesOnly && (
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(190, 24, 93, 0.2))',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                borderRadius: '12px',
                                padding: '1rem 1.5rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>❤️</span>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#ec4899', fontSize: '1.1rem' }}>
                                        Viewing Your Saved Favorites
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        These domains are loaded from your Firebase account
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <StatsRow
                            originalCount={showFavoritesOnly ? favorites.length : originalCount}
                            domainsCount={showFavoritesOnly ? favorites.length : domains.length}
                            filteredCount={displayedDomains.length}
                            searchQuery={showFavoritesOnly ? 'Favorites' : searchQuery}
                            currentPage={currentPage}
                            totalPages={displayedTotalPages}
                        />

                        {/* Search Bar */}
                        <SearchBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchMode={searchMode}
                            setSearchMode={setSearchMode}
                        />

                        {/* Block Filter */}
                        <BlockFilter
                            blockQuery={blockQuery}
                            setBlockQuery={setBlockQuery}
                            blockMode={blockMode}
                            setBlockMode={setBlockMode}
                        />

                        {/* Filter Group */}
                        <FilterGroup
                            availableExtensions={availableExtensions}
                            selectedExtensions={selectedExtensions}
                            setSelectedExtensions={setSelectedExtensions}
                            extensionCounts={extensionCounts}
                            extensionDropdownOpen={extensionDropdownOpen}
                            setExtensionDropdownOpen={setExtensionDropdownOpen}
                            hasAuctionData={hasAuctionData}
                            availableAuctionDates={availableAuctionDates}
                            selectedAuctionDate={selectedAuctionDate}
                            setSelectedAuctionDate={setSelectedAuctionDate}
                            auctionDateCounts={auctionDateCounts}
                            auctionDropdownOpen={auctionDropdownOpen}
                            setAuctionDropdownOpen={setAuctionDropdownOpen}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            sortDropdownOpen={sortDropdownOpen}
                            setSortDropdownOpen={setSortDropdownOpen}
                            domainsLength={domains.length}
                        />
                        {/* Super Valuation Button */}
                        <SuperValuationButton
                            onClick={() => setShowSuperValuationModal(true)}
                            isValuating={isSuperValuating}
                            domainCount={displayedPaginatedDomains.length}
                        />
                        {/* Favorites Toggle */}
                        {favorites.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                                <button
                                    className={`btn-favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
                                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                                    style={{
                                        background: showFavoritesOnly
                                            ? 'linear-gradient(135deg, #ec4899, #be185d)'
                                            : 'rgba(236, 72, 153, 0.1)',
                                        color: showFavoritesOnly ? 'white' : '#ec4899',
                                        border: `1px solid ${showFavoritesOnly ? '#be185d' : 'rgba(236, 72, 153, 0.3)'}`,
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span>{showFavoritesOnly ? '❤️' : '🤍'}</span>
                                    {showFavoritesOnly
                                        ? 'Back to Current File'
                                        : `View My Favorites (${favorites.length})`
                                    }
                                </button>
                            </div>
                        )}

                        {/* Top Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={displayedTotalPages}
                            itemsPerPage={itemsPerPage}
                            goToPage={goToPage}
                            handleItemsPerPageChange={handleItemsPerPageChange}
                            source="top"
                        />
                        {/* Domain List */}
                        <DomainList
                            paginatedDomains={displayedPaginatedDomains}
                            auctionEndResults={auctionEndResults}
                            analysisResults={analysisResults}
                            analyzingDomains={analyzingDomains}
                            handleAnalyseDomain={handleAnalyseDomain}
                            handleAnalyseAtom={handleAnalyseAtom}
                            isFavorite={isFavorite}
                            onToggleFavorite={handleToggleFavorite}
                        />

                        {/* Bottom Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={displayedTotalPages}
                            itemsPerPage={itemsPerPage}
                            goToPage={goToPage}
                            handleItemsPerPageChange={handleItemsPerPageChange}
                            source="bottom"
                        />

                        {/* Reset Button */}
                        <div className="action-row">
                            <button className="btn-reset" onClick={handleReset}>
                                Upload New
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Scroll Hint Icon */}
            {hasAnalyzed && (
                <div className={`scroll-hint-icon ${scrollDirection}`}>
                    {scrollDirection === 'down' ? '↓' : '↑'}
                </div>
            )}
        </div>
    );
};

export default DomainAnalysis;
