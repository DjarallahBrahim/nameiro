import React, { useState, useMemo } from 'react';
import './DomainAnalysis.css';

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DomainAnalysis = () => {
    const { currentUser, login, logout } = useAuth();
    const navigate = useNavigate();
    const [rawDomains, setRawDomains] = useState([]);
    const [domains, setDomains] = useState([]);
    const [originalCount, setOriginalCount] = useState(0);
    const [isDragActive, setIsDragActive] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Analysis Results State
    const [analysisResults, setAnalysisResults] = useState({});
    const [analyzingDomains, setAnalyzingDomains] = useState({});

    // Filter states
    const [excludeNumbers, setExcludeNumbers] = useState(true);
    const [excludeHyphens, setExcludeHyphens] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableExtensions, setAvailableExtensions] = useState([]);
    const [selectedExtensions, setSelectedExtensions] = useState(['.com']);
    const [extensionDropdownOpen, setExtensionDropdownOpen] = useState(false);
    const [extensionCounts, setExtensionCounts] = useState({});

    // Auction End Date Filter State
    const [auctionEndResults, setAuctionEndResults] = useState({}); // Map: domain -> timestamp
    const [hasAuctionData, setHasAuctionData] = useState(false);

    // Replace range with unique available dates
    const [availableAuctionDates, setAvailableAuctionDates] = useState([]);
    const [selectedAuctionDate, setSelectedAuctionDate] = useState('');

    const [auctionDropdownOpen, setAuctionDropdownOpen] = useState(false);
    const [auctionDateCounts, setAuctionDateCounts] = useState({});

    // Sort Order State
    const [sortOrder, setSortOrder] = useState(''); // '' (default), 'asc', 'desc'
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

    const [scrollDirection, setScrollDirection] = useState('down'); // 'up' | 'down'



    // Search Mode State
    const [searchMode, setSearchMode] = useState('contains'); // 'contains', 'startsWith', 'endsWith'

    // Block Filter State
    const [blockQuery, setBlockQuery] = useState('');
    const [blockMode, setBlockMode] = useState('contains'); // 'contains', 'startsWith', 'endsWith'

    const [showAtomSettings, setShowAtomSettings] = useState(false);
    const [atomCredentials, setAtomCredentials] = useState({
        api_token: '',
        user_id: ''
    });
    const [humbleworthToken, setHumbleworthToken] = useState('');

    // Super Super Valuation State
    const [showSuperValuationModal, setShowSuperValuationModal] = useState(false);
    const [isSuperValuating, setIsSuperValuating] = useState(false);

    // Load User Settings
    React.useEffect(() => {
        const fetchSettings = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.atom_api_token) setAtomCredentials(prev => ({ ...prev, api_token: data.atom_api_token }));
                        if (data.atom_user_id) setAtomCredentials(prev => ({ ...prev, user_id: data.atom_user_id }));
                        if (data.humbleworth_token) setHumbleworthToken(data.humbleworth_token);
                    }
                } catch (error) {
                    console.error("Error fetching settings:", error);
                }
            }
        };
        fetchSettings();
    }, [currentUser]);

    const handleSaveSettings = async () => {
        if (!currentUser) return;
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                atom_api_token: atomCredentials.api_token,
                atom_user_id: atomCredentials.user_id,
                humbleworth_token: humbleworthToken
            }, { merge: true });
            alert("Settings saved successfully!");
            setShowAtomSettings(false);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings: " + error.message);
        }
    };

    // Reactive Filtering Effect (Original Logic)
    React.useEffect(() => {
        if (rawDomains.length === 0) return;

        // 1. First Pass: Apply Content Filters (Numbers/Hyphens)
        // This creates the "base" list for this view configuration
        const filteredByContent = rawDomains.filter(domain => {
            if (excludeNumbers && /\d/.test(domain)) return false;
            if (excludeHyphens && /-/.test(domain)) return false;
            return true;
        });

        // 2. Calculate Stats based on the CONTENT-FILTERED list
        const tldCounts = {};
        filteredByContent.forEach(domain => {
            const tld = domain.substring(domain.lastIndexOf('.')).toLowerCase();
            tldCounts[tld] = (tldCounts[tld] || 0) + 1;
        });

        // 3. Update Extension Lists
        const sortedExtensions = Object.keys(tldCounts).sort((a, b) => tldCounts[b] - tldCounts[a]);
        setAvailableExtensions(sortedExtensions);
        setExtensionCounts(tldCounts);

        // 4. Update Main Domain List
        // Note: We don't filter by extension here yet, that happens in the memoized 'filteredDomains'
        // This 'domains' state represents "All Valid Domains" before search/extension filtering
        setDomains(filteredByContent);

        // Reset pagination when filters change
        setCurrentPage(1);

    }, [rawDomains, excludeNumbers, excludeHyphens]);


    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split(/[\r\n]+/).filter(line => line.trim());

            if (lines.length === 0) return;

            // Find true header row (ignoring metadata lines like "****Auction lists...")
            let headerRowIndex = 0;
            let headers = [];

            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                const row = lines[i].toLowerCase();
                if (row.includes('domain') || row.includes('auction end')) {
                    headerRowIndex = i;
                    headers = lines[i].split(',').map(h => h.trim().toLowerCase());
                    break;
                }
            }

            // Fallback: if no clear header found, try line 0
            if (headers.length === 0 && lines.length > 0) {
                headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            }

            // Robust header detection
            const auctionColIndex = headers.findIndex(h =>
                h === 'auction end' ||
                h === 'auction end date' ||
                h.includes('auction end')
            );

            let domainColIndex = headers.indexOf('domain');
            if (domainColIndex === -1) domainColIndex = 0;

            const extractedDomains = [];
            const extractedAuctionDates = {};
            let foundAuctionData = false;

            const startIdx = headerRowIndex + 1;

            for (let i = startIdx; i < lines.length; i++) {
                const columns = lines[i].split(',').map(c => c.trim());
                if (columns[domainColIndex]) {
                    const domain = columns[domainColIndex].trim();
                    extractedDomains.push(domain);

                    // Extract Auction End Date if available
                    if (auctionColIndex !== -1 && columns[auctionColIndex]) {
                        const dateStr = columns[auctionColIndex].trim();
                        // robustly parse date
                        const dateObj = new Date(dateStr);
                        if (!isNaN(dateObj.getTime())) {
                            extractedAuctionDates[domain] = dateObj.getTime();
                            foundAuctionData = true;
                        }
                    }
                }
            }

            if (extractedDomains.length > 0) {
                setRawDomains(extractedDomains);
                setAuctionEndResults(extractedAuctionDates);
                setHasAuctionData(foundAuctionData);

                // Extract unique dates for the dropdown
                // Extract unique dates and counts for the dropdown
                if (foundAuctionData) {
                    const uniqueDates = new Set();
                    const dateCounts = {};

                    Object.values(extractedAuctionDates).forEach(ts => {
                        const dateStr = new Date(ts).toLocaleDateString();
                        uniqueDates.add(dateStr);
                        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                    });

                    // Sort dates chronologically
                    const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(a) - new Date(b));
                    setAvailableAuctionDates(sortedDates);
                    setAuctionDateCounts(dateCounts);
                } else {
                    setAvailableAuctionDates([]);
                    setAuctionDateCounts({});
                }

                setOriginalCount(extractedDomains.length);
                setHasAnalyzed(true);
            }
        };
        reader.readAsText(file);
    };

    const handleAnalyseDomain = async (domain) => {
        if (analyzingDomains[domain]) return;

        setAnalyzingDomains(prev => ({ ...prev, [domain]: true }));

        // Check for token (if not default fallback in backend, we should probably warn, but for now just send what we have)
        // Note: Backend has a fallback, but we prefer user token if set.
        const tokenToSend = humbleworthToken || undefined;

        try {
            // 1. Start Prediction
            const response = await fetch('/api/replicate/predictions', {
                method: "POST",
                headers: {
                    "Authorization": tokenToSend ? "Bearer " + tokenToSend : "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    version: "a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
                    input: { domains: domain }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Start API failed: ${response.status} ${errorText} `);
            }

            const prediction = await response.json();
            const predictionId = prediction.id;

            // 2. Poll for Results
            // We need to poll the get url. The API returns a full URL like https://api.replicate.com/v1/predictions/xyz
            // We need to replace the host with our proxy path

            const pollUrl = `/api/replicate/predictions/${predictionId}`;

            let result = prediction;
            while (result.status !== "succeeded" && result.status !== "failed" && result.status !== "canceled") {
                await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s

                const pollResponse = await fetch(pollUrl, {
                    headers: {
                        "Authorization": tokenToSend ? "Bearer " + tokenToSend : undefined,
                    }
                });

                if (!pollResponse.ok) {
                    const errorText = await pollResponse.text();
                    throw new Error(`Poll API failed: ${pollResponse.status} ${errorText} `);
                }

                result = await pollResponse.json();
            }

            if (result.status === "succeeded" && result.output && result.output.valuations && result.output.valuations.length > 0) {
                setAnalysisResults(prev => ({
                    ...prev,
                    [domain]: result.output.valuations[0]
                }));
            } else if (result.status === "failed") {
                throw new Error("Prediction failed on server side.");
            }

        } catch (error) {
            console.error("Analysis failed:", error);
            alert(`Analysis failed: ${error.message} `);
        } finally {
            setAnalyzingDomains(prev => ({ ...prev, [domain]: false }));
        }
    };

    const handleSuperValuation = async () => {
        if (paginatedDomains.length === 0) return;

        setShowSuperValuationModal(false);
        setIsSuperValuating(true);

        const domainsToAnalyze = paginatedDomains;
        // 1. Lowercase domains according to best practices
        const domainsString = domainsToAnalyze.map(d => d.toLowerCase()).join(',');

        // Set analyzing state for all (using original keys)
        const newAnalyzingState = { ...analyzingDomains };
        domainsToAnalyze.forEach(d => newAnalyzingState[d] = true);
        setAnalyzingDomains(newAnalyzingState);

        const tokenToSend = humbleworthToken || undefined;

        try {
            // 1. Start Prediction
            const response = await fetch('/api/replicate/predictions', {
                method: "POST",
                headers: {
                    "Authorization": tokenToSend ? "Bearer " + tokenToSend : "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    version: "a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
                    input: { domains: domainsString }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Start API failed: ${response.status} ${errorText} `);
            }

            const prediction = await response.json();
            const predictionId = prediction.id;

            // 2. Poll for Results
            const pollUrl = `/api/replicate/predictions/${predictionId}`;
            let result = prediction;

            while (result.status !== "succeeded" && result.status !== "failed" && result.status !== "canceled") {
                await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s

                const pollResponse = await fetch(pollUrl, {
                    headers: {
                        "Authorization": tokenToSend ? "Bearer " + tokenToSend : undefined,
                    }
                });

                if (!pollResponse.ok) {
                    const errorText = await pollResponse.text();
                    throw new Error(`Poll API failed: ${pollResponse.status} ${errorText} `);
                }

                result = await pollResponse.json();
            }

            if (result.status === "succeeded" && result.output && result.output.valuations) {
                // Update results for all domains
                setAnalysisResults(prev => {
                    const next = { ...prev };

                    // Create a map of lowercase domains to their original case in our list
                    // This ensures we can map the lowercase API response back to the correct state key
                    const lowercaseToOriginal = {};
                    domainsToAnalyze.forEach(d => lowercaseToOriginal[d.toLowerCase()] = d);

                    result.output.valuations.forEach(val => {
                        // The API returns 'domain' in lowercase (e.g. "blogerme.com")
                        // We need to find which original domain string this corresponds to
                        const returnedDomain = val.domain.toLowerCase();
                        const originalDomainKey = lowercaseToOriginal[returnedDomain];

                        if (originalDomainKey) {
                            next[originalDomainKey] = val;
                        }
                    });
                    return next;
                });
            } else if (result.status === "failed") {
                throw new Error("Batch prediction failed on server side.");
            }

        } catch (error) {
            console.error("Super Valuation failed:", error);
            alert(`Super Valuation failed: ${error.message}`);
        } finally {
            // Reset analyzing state
            setAnalyzingDomains(prev => {
                const next = { ...prev };
                domainsToAnalyze.forEach(d => next[d] = false);
                return next;
            });
            setIsSuperValuating(false);
        }
    };

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

    // Search and Pagination logic
    const filteredDomains = useMemo(() => {
        let filtered = domains;

        // Filter by selected extensions
        if (selectedExtensions.length > 0) {
            filtered = filtered.filter(domain => {
                const ext = domain.substring(domain.lastIndexOf('.')).toLowerCase();
                return selectedExtensions.includes(ext);
            });
        }

        // Filter by search query

        if (searchQuery) {
            const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);

            if (terms.length > 0) {
                if (searchMode === 'startsWith') {
                    filtered = filtered.filter(domain =>
                        terms.some(term => domain.toLowerCase().startsWith(term))
                    );
                } else if (searchMode === 'endsWith') {
                    filtered = filtered.filter(domain => {
                        const lastDotIndex = domain.lastIndexOf('.');
                        const nameOnly = lastDotIndex !== -1 ? domain.substring(0, lastDotIndex) : domain;
                        return terms.some(term => nameOnly.toLowerCase().endsWith(term));
                    });
                } else {
                    // contains (default)
                    filtered = filtered.filter(domain =>
                        terms.some(term => domain.toLowerCase().includes(term))
                    );
                }
            }
        }

        // Filter by block query (Exclude domains)
        if (blockQuery) {
            const blockTerms = blockQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);

            if (blockTerms.length > 0) {
                if (blockMode === 'startsWith') {
                    filtered = filtered.filter(domain =>
                        !blockTerms.some(term => domain.toLowerCase().startsWith(term))
                    );
                } else if (blockMode === 'endsWith') {
                    filtered = filtered.filter(domain => {
                        const lastDotIndex = domain.lastIndexOf('.');
                        const nameOnly = lastDotIndex !== -1 ? domain.substring(0, lastDotIndex) : domain;
                        return !blockTerms.some(term => nameOnly.toLowerCase().endsWith(term));
                    });
                } else {
                    // contains (default)
                    filtered = filtered.filter(domain =>
                        !blockTerms.some(term => domain.toLowerCase().includes(term))
                    );
                }
            }
        }

        // Filter by Auction Date Dropdown
        if (hasAuctionData && selectedAuctionDate) {
            filtered = filtered.filter(domain => {
                const mask = auctionEndResults[domain];
                if (!mask) return false;
                // Compare by local date string to match the dropdown value
                return new Date(mask).toLocaleDateString() === selectedAuctionDate;
            });
        }

        // Apply Sorting
        if (sortOrder === 'asc') {
            filtered = [...filtered].sort((a, b) => a.length - b.length);
        } else if (sortOrder === 'desc') {
            filtered = [...filtered].sort((a, b) => b.length - a.length);
        }

        return filtered;
    }, [domains, searchQuery, selectedExtensions, selectedAuctionDate, hasAuctionData, auctionEndResults, sortOrder, searchMode, blockQuery, blockMode]);

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

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };


    const handleAnalyseAtom = async (domain) => {
        if (analyzingDomains[domain]) return;

        if (!atomCredentials.api_token || !atomCredentials.user_id) {
            alert("Please configure your Atom API Token and User ID in the settings (gear icon).");
            setShowAtomSettings(true);
            return;
        }

        setAnalyzingDomains(prev => ({ ...prev, [domain]: true }));


        try {
            const response = await fetch(`/api/atom/atom-appraisal?domain=${domain}&api_token=${atomCredentials.api_token}&user_id=${atomCredentials.user_id}`);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Atom API failed: ${text} `);
            }

            const data = await response.json();

            setAnalysisResults(prev => ({
                ...prev,
                [domain]: { ...prev[domain], atom: data }
            }));

        } catch (error) {
            console.error("Atom Analysis failed:", error);
            alert(`Atom Analysis failed: ${error.message} `);
        } finally {
            setAnalyzingDomains(prev => ({ ...prev, [domain]: false }));
        }
    };

    return (
        <div className="domain-analysis-container">
            {/* Super Valuation Confirmation Modal - Moved to Top Level for Positioning */}
            {showSuperValuationModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0)',
                    zIndex: 99999,
                    pointerEvents: 'auto'
                }} onClick={() => setShowSuperValuationModal(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()} style={{
                        position: 'relative',
                        maxWidth: '400px',
                        width: '90%',
                        maxHeight: '90vh',
                        background: '#1e293b',
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        margin: 'auto', /* Force center */
                        pointerEvents: 'auto',
                        zIndex: 100000
                    }}>
                        <div className="settings-modal-header">
                            <h3>🚀 Super Valuation</h3>
                            <button className="btn-close-modal" onClick={() => setShowSuperValuationModal(false)}>×</button>
                        </div>

                        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                            <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Valuate {paginatedDomains.length} domains?</h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                This will process all domains on the current page in a single batch request, optimized for speed and efficiency.
                            </p>
                        </div>

                        <div className="settings-footer" style={{ justifyContent: 'center', gap: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowSuperValuationModal(false)}
                                style={{ padding: '0.6rem 1.2rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSuperValuation}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                    border: 'none',
                                    fontWeight: '600'
                                }}
                            >
                                Yes, Start Batch!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="analysis-card">
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
                                        navigate('/analyse-domain'); // Refresh/Standardize state
                                        window.location.reload(); // Ensure clean state if needed
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

                {showAtomSettings && (
                    <div className="settings-modal-overlay" onClick={() => setShowAtomSettings(false)}>
                        <div className="settings-modal" onClick={e => e.stopPropagation()}>
                            <div className="settings-modal-header">
                                <h3>API Configuration</h3>
                                <button className="btn-close-modal" onClick={() => setShowAtomSettings(false)}>×</button>
                            </div>

                            <div className="settings-section">
                                <h4>⚛️ Atom Appraisal</h4>
                                <div className="settings-row">
                                    <label>User ID</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2943085"
                                        value={atomCredentials.user_id}
                                        onChange={(e) => setAtomCredentials(prev => ({ ...prev, user_id: e.target.value }))}
                                    />
                                </div>
                                <div className="settings-row">
                                    <label>API Token</label>
                                    <input
                                        type="password"
                                        placeholder="Atom API Token"
                                        value={atomCredentials.api_token}
                                        onChange={(e) => setAtomCredentials(prev => ({ ...prev, api_token: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="settings-divider"></div>

                            <div className="settings-section">
                                <h4>💎 Humbleworth (Replicate)</h4>
                                <div className="settings-row">
                                    <label>API Token</label>
                                    <input
                                        type="password"
                                        placeholder="Replicate API Token"
                                        value={humbleworthToken}
                                        onChange={(e) => setHumbleworthToken(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="settings-footer" style={{ justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="settings-info-icon">ⓘ</span>
                                    <span>Settings are synced to your account.</span>
                                </div>
                                <button className="btn btn-primary" onClick={handleSaveSettings} style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!currentUser ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        textAlign: 'center',
                        minHeight: '400px'
                    }}>
                        <div className="glass-panel" style={{
                            padding: '50px',
                            maxWidth: '450px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                        }}>
                            <div style={{
                                fontSize: '4rem',
                                marginBottom: '20px',
                                textShadow: '0 0 20px rgba(0, 242, 234, 0.3)'
                            }}>🔒</div>
                            <h2 style={{
                                marginBottom: '15px',
                                fontSize: '1.8rem',
                                background: 'linear-gradient(to right, #fff, var(--primary))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Access Required</h2>
                            <p style={{
                                marginBottom: '35px',
                                color: 'var(--text-muted)',
                                lineHeight: '1.6',
                                fontSize: '1.1rem'
                            }}>
                                Please sign in to unlock domain upload and analysis tools.
                                <br />
                                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Secure authentication via Google</span>
                            </p>
                            <button className="btn btn-primary" style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                padding: '14px 28px',
                                fontSize: '1.1rem'
                            }} onClick={async () => {
                                try {
                                    await login();
                                } catch (error) {
                                    console.error("Login failed:", error);
                                    alert("Login failed: " + error.message);
                                }
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                ) : !hasAnalyzed ? (
                    <>
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
                    </>
                ) : (
                    <div className="results-section">
                        {/* stats */}
                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="stat-value">{originalCount.toLocaleString()}</span>
                                <span className="stat-label">Total Found</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{domains.length.toLocaleString()}</span>
                                <span className="stat-label">After Filtering</span>
                            </div>
                            {searchQuery && (
                                <div className="stat-item">
                                    <span className="stat-value">{filteredDomains.length.toLocaleString()}</span>
                                    <span className="stat-label">Search Results</span>
                                </div>
                            )}
                            <div className="stat-item">
                                <span className="stat-value">{currentPage} / {totalPages}</span>
                                <span className="stat-label">Current Page</span>
                            </div>
                        </div>
                        {/* Search Bar */}
                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Search domains..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="search-input"
                                />
                                {searchQuery && (
                                    <button
                                        className="search-clear"
                                        onClick={() => handleSearchChange('')}
                                    >
                                        ✕
                                    </button>
                                )}

                                {/* Search Info Icon (Inside Input) */}
                                <div className="search-info-tooltip-container">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-info-svg">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <div className="search-info-tooltip">
                                        <strong>Multi-word Search:</strong><br />
                                        Enter multiple words separated by spaces to find domains matching <strong>ANY</strong> of the terms (OR logic).<br /><br />
                                        <em>Example: "shop store" finds domains with "shop" OR "store".</em>
                                    </div>
                                </div>
                            </div>



                            {/* Search Modes */}
                            <div className="search-mode-container">
                                {[
                                    { id: 'startsWith', label: 'Start with' },
                                    { id: 'contains', label: 'Contain' },
                                    { id: 'endsWith', label: 'End with' }
                                ].map(mode => (
                                    <label
                                        key={mode.id}
                                        className={`extension-checkbox-item ${searchMode === mode.id ? 'selected' : ''}`}
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={searchMode === mode.id}
                                            onChange={() => setSearchMode(mode.id)}
                                            style={{ display: 'none' }}
                                        />
                                        <span className={`extension-name ${searchMode === mode.id ? 'selected' : ''}`}>{mode.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Block Filter Bar */}
                        <div className="search-container" style={{ marginTop: '1rem' }}>
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Block keywords..."
                                    value={blockQuery}
                                    onChange={(e) => setBlockQuery(e.target.value)}
                                    className="search-input"
                                />
                                {blockQuery && (
                                    <button
                                        className="search-clear"
                                        onClick={() => setBlockQuery('')}
                                    >
                                        ✕
                                    </button>
                                )}

                                {/* Block Info Icon */}
                                <div className="search-info-tooltip-container">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-info-svg">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <div className="search-info-tooltip">
                                        <strong>Block Filter:</strong><br />
                                        Enter keywords to <strong>EXCLUDE</strong> domains matching ANY of the terms.<br /><br />
                                        <em>Example: "test dev" hides domains with "test" OR "dev".</em>
                                    </div>
                                </div>
                            </div>

                            {/* Block Modes */}
                            <div className="search-mode-container">
                                {[
                                    { id: 'startsWith', label: 'Start with' },
                                    { id: 'contains', label: 'Contain' },
                                    { id: 'endsWith', label: 'End with' }
                                ].map(mode => (
                                    <label
                                        key={mode.id}
                                        className={`extension-checkbox-item ${blockMode === mode.id ? 'selected' : ''}`}
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={blockMode === mode.id}
                                            onChange={() => setBlockMode(mode.id)}
                                            style={{ display: 'none' }}
                                        />
                                        <span className={`extension-name ${blockMode === mode.id ? 'selected' : ''}`}>{mode.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Unified Filter Group */}
                        {domains.length > 0 && (
                            <div className="filter-group-container">
                                {/* Extension Filter Dropdown */}
                                {availableExtensions.length > 0 && (
                                    <div className="extension-filter-dropdown">
                                        <button
                                            className="extension-dropdown-toggle"
                                            onClick={() => setExtensionDropdownOpen(!extensionDropdownOpen)}
                                        >
                                            <span className="dropdown-label">Filter by Extension:</span>
                                            <span className="dropdown-selected-count">
                                                {selectedExtensions.length} selected
                                            </span>
                                            <span className="dropdown-arrow">{extensionDropdownOpen ? '▲' : '▼'}</span>
                                        </button>

                                        {extensionDropdownOpen && (
                                            <div className="extension-dropdown-content">
                                                <div className="dropdown-actions">
                                                    <button
                                                        className="btn-select-all-ext"
                                                        onClick={() => setSelectedExtensions(availableExtensions)}
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        className="btn-clear-all-ext"
                                                        onClick={() => setSelectedExtensions([])}
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                                <div className="extension-chips-grid">
                                                    {availableExtensions.map(ext => (
                                                        <label
                                                            key={ext}
                                                            className={`extension-checkbox-item ${selectedExtensions.includes(ext) ? 'selected' : ''}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedExtensions.includes(ext)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedExtensions([...selectedExtensions, ext]);
                                                                    } else {
                                                                        setSelectedExtensions(selectedExtensions.filter(x => x !== ext));
                                                                    }
                                                                }}
                                                                className="extension-checkbox"
                                                            />
                                                            <span className="extension-name">{ext}</span>
                                                            <span className="extension-count">
                                                                {extensionCounts[ext] || 0}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Auction End Date Filter */}
                                {/* Auction End Date Dropdown Filter */}
                                {hasAuctionData && availableAuctionDates.length > 0 && (
                                    <div className="extension-filter-dropdown">
                                        <button
                                            className="extension-dropdown-toggle"
                                            onClick={() => setAuctionDropdownOpen(!auctionDropdownOpen)}
                                        >
                                            <span className="dropdown-label">Auction End Date:</span>
                                            <span className="dropdown-selected-count">
                                                {selectedAuctionDate || 'All Dates'}
                                            </span>
                                            <span className="dropdown-arrow">{auctionDropdownOpen ? '▲' : '▼'}</span>
                                        </button>

                                        {auctionDropdownOpen && (
                                            <div className="extension-dropdown-content">
                                                <div className="extension-chips-grid">
                                                    <div
                                                        className={`extension-checkbox-item ${selectedAuctionDate === '' ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setSelectedAuctionDate('');
                                                            setAuctionDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span className="extension-name">All Dates</span>
                                                    </div>
                                                    {availableAuctionDates.map(dateStr => (
                                                        <div
                                                            key={dateStr}
                                                            className={`extension-checkbox-item ${selectedAuctionDate === dateStr ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setSelectedAuctionDate(dateStr);
                                                                setAuctionDropdownOpen(false);
                                                            }}
                                                        >
                                                            <span className="extension-name">{dateStr}</span>
                                                            <span className="extension-count">
                                                                {auctionDateCounts[dateStr] || 0}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Sort Order Dropdown */}
                                <div className="extension-filter-dropdown">
                                    <button
                                        className="extension-dropdown-toggle"
                                        onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                                    >
                                        <span className="dropdown-label">Order Results:</span>
                                        <span className="dropdown-selected-count">
                                            {sortOrder === 'asc' ? 'Shortest First' : sortOrder === 'desc' ? 'Longest First' : 'Default'}
                                        </span>
                                        <span className="dropdown-arrow">{sortDropdownOpen ? '▲' : '▼'}</span>
                                    </button>

                                    {sortDropdownOpen && (
                                        <div className="extension-dropdown-content">
                                            <div className="extension-chips-grid">
                                                {[
                                                    { label: 'Default', value: '' },
                                                    { label: 'Shortest First', value: 'asc' },
                                                    { label: 'Longest First', value: 'desc' }
                                                ].map(option => (
                                                    <div
                                                        key={option.value}
                                                        className={`extension-checkbox-item ${sortOrder === option.value ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setSortOrder(option.value);
                                                            setSortDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span className="extension-name">{option.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
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
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(1, 'top')}
                                    disabled={currentPage === 1}
                                >
                                    ««
                                </button>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(currentPage - 1, 'top')}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>
                                <span className="page-info">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(currentPage + 1, 'top')}
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                                {/* Super Valuation Button */}
                                <button
                                    className="btn-super-valuation"
                                    onClick={() => setShowSuperValuationModal(true)}
                                    disabled={isSuperValuating || paginatedDomains.length === 0}
                                    style={{
                                        marginLeft: '1rem',
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)',
                                        transition: 'all 0.2s ease',
                                        opacity: isSuperValuating ? 0.7 : 1
                                    }}
                                >
                                    {isSuperValuating ? (
                                        <>
                                            <span className="loading-spinner-small"></span> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <span>⚡</span> Super HumbleWorth Valuation
                                        </>
                                    )}
                                </button>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(totalPages, 'top')}
                                    disabled={currentPage === totalPages}
                                >
                                    »»
                                </button>
                            </div>
                        )}
                        <div className="domains-list">
                            {paginatedDomains.length > 0 ? (
                                paginatedDomains.map((domain, index) => (
                                    <div key={index} className="domain-row-wrapper">
                                        <div className="domain-item">
                                            <div className="domain-info-col">
                                                <a
                                                    href={`http://${domain}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="domain-name"
                                                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                                                >
                                                    {domain}
                                                </a>
                                                {auctionEndResults[domain] && (
                                                    <span className="auction-date-badge">
                                                        📅 {new Date(auctionEndResults[domain]).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="action-buttons-container">
                                                <button
                                                    className="action-icon-btn humble-btn"
                                                    onClick={() => handleAnalyseDomain(domain)}
                                                    disabled={analyzingDomains[domain]}
                                                    title="Analyze with Humbleworth"
                                                >
                                                    <span style={{ fontSize: '1.2rem', marginBottom: '2px' }}>🪙</span>
                                                </button>
                                                <button
                                                    className="action-icon-btn atom-btn"
                                                    onClick={() => handleAnalyseAtom(domain)}
                                                    disabled={analyzingDomains[domain]}
                                                    title="Analyze with Atom Appraisal"
                                                >
                                                    <span style={{ fontSize: '1.4rem' }}>⚛️</span>
                                                </button>
                                            </div>
                                        </div>
                                        {/* Display Humbleworth Results */}
                                        {analysisResults[domain] && analysisResults[domain].marketplace !== undefined && (
                                            <div className="valuation-results">
                                                <div className="provider-badge">HUMBLEWORTH</div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div className="valuation-label">Marketplace</div>
                                                    <div className="valuation-value-white">${analysisResults[domain].marketplace?.toLocaleString()}</div>
                                                </div>
                                                <div className="valuation-divider">
                                                    <div className="valuation-label" style={{ color: '#a78bfa' }}>Brokerage</div>
                                                    <div className="valuation-value-purple">${analysisResults[domain].brokerage?.toLocaleString()}</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div className="valuation-label">Auction</div>
                                                    <div className="valuation-value-white">${analysisResults[domain].auction?.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Display Atom Results */}
                                        {analysisResults[domain] && analysisResults[domain].atom && (
                                            <div className="valuation-results-atom">
                                                <div style={{ position: 'absolute', top: '0.5rem', left: '1rem', opacity: 0.7, fontSize: '0.7rem', color: '#60a5fa', fontWeight: 'bold', letterSpacing: '0.05em' }}>ATOM APPRAISAL</div>

                                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '1rem' }}>
                                                    {/* Price */}
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div className="valuation-label" style={{ color: '#94a3b8' }}>Appraisal Value</div>
                                                        <div style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
                                                            ${(analysisResults[domain].atom.atom_appraisal || 0).toLocaleString()}
                                                        </div>
                                                    </div>

                                                    {/* Score */}
                                                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                                                        <div className="valuation-label" style={{ color: '#94a3b8' }}>Domain Score</div>
                                                        <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                                            {analysisResults[domain].atom.domain_score || 'N/A'}/10
                                                        </div>
                                                    </div>

                                                    {/* TLDs Taken */}
                                                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                                                        <div className="valuation-label" style={{ color: '#94a3b8' }}>TLDs Taken</div>
                                                        <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                                            {analysisResults[domain].atom.tld_taken_count || 0}
                                                        </div>
                                                    </div>

                                                    {/* Age */}
                                                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                                                        <div className="valuation-label" style={{ color: '#94a3b8' }}>Est. Age</div>
                                                        <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                                            {analysisResults[domain].atom.date_registered ?
                                                                `${(new Date().getFullYear() - new Date(analysisResults[domain].atom.date_registered).getFullYear()).toFixed(1)} Yrs`
                                                                : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ))
                            ) : (
                                <div className="no-results-message">
                                    No domains match your criteria.
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
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
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(1, 'bottom')}
                                    disabled={currentPage === 1}
                                >
                                    ««
                                </button>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(currentPage - 1, 'bottom')}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>
                                <span className="page-info">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(currentPage + 1, 'bottom')}
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                                <button
                                    className="btn-page"
                                    onClick={() => goToPage(totalPages, 'bottom')}
                                    disabled={currentPage === totalPages}
                                >
                                    »»
                                </button>
                            </div>
                        )}



                        <div className="action-row">
                            <button className="btn-reset" onClick={() => {
                                setDomains([]);
                                setRawDomains([]);
                                setHasAnalyzed(false);
                                setOriginalCount(0);
                                setCurrentPage(1);
                                setAnalysisResults({});
                                setAuctionEndResults({});
                                setHasAuctionData(false);
                                setAvailableAuctionDates([]);
                                setSelectedAuctionDate('');
                                setHasAuctionData(false);
                                setAvailableAuctionDates([]);
                                setSelectedAuctionDate('');
                                setAuctionDropdownOpen(false);
                                setAuctionDateCounts({});
                            }}>Upload New</button>
                        </div>
                    </div>
                )
                }
            </div >

            {/* Scroll Hint Icon (Visual Only) - Moved here to escape backdrop-filter stacking context */}
            {domains.length > 0 && (
                <div className={`scroll-hint-icon ${scrollDirection}`}>
                    {scrollDirection === 'down' ? '↓' : '↑'}
                </div>
            )}
        </div >
    );
};

export default DomainAnalysis;
