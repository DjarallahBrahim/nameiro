import React, { useState, useEffect } from 'react';
import DomainCard from './DomainCard';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import './DomainGrid.css';

const DomainGrid = () => {
    const [domains, setDomains] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [activeCategory, setActiveCategory] = useState('All');
    const [lastDoc, setLastDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // 1. Fetch Categories once
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const q = query(collection(db, "categories"), orderBy("name"));
                const snapshot = await getDocs(q);
                const cats = snapshot.docs.map(d => d.data().name);
                setCategories(['All', ...cats]);
            } catch (e) {
                console.error("Error fetching categories:", e);
            }
        };
        fetchCategories();
    }, []);

    // 2. Fetch Domains (Initial & Filter Change)
    useEffect(() => {
        setLoading(true);
        setHasMore(true);
        const fetchInitial = async () => {
            try {
                let q = collection(db, "domains");
                const constraints = [];

                // If filtering by category, we DO NOT use orderBy("created") to avoid "Index Required" error.
                // We only sort by created when showing "All".
                if (activeCategory !== 'All') {
                    constraints.push(where("category", "==", activeCategory));
                } else {
                    constraints.push(orderBy("created", "desc"));
                }

                constraints.push(limit(6));

                const finalQuery = query(q, ...constraints);
                const snapshot = await getDocs(finalQuery);

                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDomains(data);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === 6);

            } catch (error) {
                console.error("Error fetching domains:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitial();
    }, [activeCategory]);

    // 3. Load More
    const handleLoadMore = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);

        try {
            let q = collection(db, "domains");
            const constraints = [];

            if (activeCategory !== 'All') {
                constraints.push(where("category", "==", activeCategory));
            } else {
                constraints.push(orderBy("created", "desc"));
            }

            constraints.push(startAfter(lastDoc));
            constraints.push(limit(6));

            const finalQuery = query(q, ...constraints);
            const snapshot = await getDocs(finalQuery);

            const newDomains = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDomains(prev => [...prev, ...newDomains]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

            if (snapshot.docs.length < 6) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <section id="portfolio" className="portfolio-section container">
            <h2 className="section-title">Premium Portfolio</h2>

            <div className="filter-bar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Loading...</div>
            ) : domains.length > 0 ? (
                <>
                    <div className="domain-grid">
                        {domains.map(domain => (
                            <DomainCard key={domain.id} domain={domain} />
                        ))}
                    </div>

                    {hasMore && (
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <button
                                className="btn btn-outline"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Loading...' : 'Load More Domains'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No domains found in this category.</p>
                </div>
            )}
        </section>
    );
};

export default DomainGrid;
