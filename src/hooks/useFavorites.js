import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for managing user's favorite domains in Firebase
 * Saves domain name along with Humbleworth and Atom analysis data
 */
export const useFavorites = (currentUser) => {
    const [favorites, setFavorites] = useState([]); // Array of domain objects
    const [loading, setLoading] = useState(true);

    // Load favorites from Firebase when user logs in
    useEffect(() => {
        if (!currentUser) {
            setFavorites([]);
            setLoading(false);
            return;
        }

        const loadFavorites = async () => {
            try {
                setLoading(true);
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists() && userDoc.data().favoriteDomains) {
                    setFavorites(userDoc.data().favoriteDomains);
                } else {
                    setFavorites([]);
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
                setFavorites([]);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [currentUser]);

    // Add domain to favorites with analysis data
    const addToFavorites = async (domainName, analysisData = {}) => {
        if (!currentUser) {
            alert('Please sign in to add favorites');
            return;
        }

        try {
            const domainObject = {
                domain: domainName,
                addedAt: new Date().toISOString(),
                humbleworth: analysisData.humbleworth || null,
                atom: analysisData.atom || null
            };

            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            let updatedFavorites;
            if (userDoc.exists()) {
                const currentFavorites = userDoc.data().favoriteDomains || [];
                // Remove existing entry if present (to update it)
                const filtered = currentFavorites.filter(fav => fav.domain !== domainName);
                updatedFavorites = [...filtered, domainObject];

                await updateDoc(userDocRef, {
                    favoriteDomains: updatedFavorites
                });
            } else {
                updatedFavorites = [domainObject];
                await setDoc(userDocRef, {
                    favoriteDomains: updatedFavorites
                });
            }

            setFavorites(updatedFavorites);
        } catch (error) {
            console.error('Error adding to favorites:', error);
            alert('Failed to add to favorites');
        }
    };

    // Remove domain from favorites
    const removeFromFavorites = async (domainName) => {
        if (!currentUser) return;

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const currentFavorites = userDoc.data().favoriteDomains || [];
                const updatedFavorites = currentFavorites.filter(fav => fav.domain !== domainName);

                await updateDoc(userDocRef, {
                    favoriteDomains: updatedFavorites
                });

                setFavorites(updatedFavorites);
            }
        } catch (error) {
            console.error('Error removing from favorites:', error);
            alert('Failed to remove from favorites');
        }
    };

    // Toggle favorite status
    const toggleFavorite = async (domainName, analysisData = {}) => {
        if (isFavorite(domainName)) {
            await removeFromFavorites(domainName);
        } else {
            await addToFavorites(domainName, analysisData);
        }
    };

    // Check if domain is favorite
    const isFavorite = (domainName) => {
        return favorites.some(fav => fav.domain === domainName);
    };

    // Get favorite data for a domain
    const getFavoriteData = (domainName) => {
        return favorites.find(fav => fav.domain === domainName);
    };

    return {
        favorites,
        loading,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite,
        getFavoriteData
    };
};
