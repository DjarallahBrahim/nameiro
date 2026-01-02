import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for managing user settings (API credentials)
 */
export const useSettings = (currentUser) => {
    const [showAtomSettings, setShowAtomSettings] = useState(false);
    const [atomCredentials, setAtomCredentials] = useState({
        api_token: '',
        user_id: ''
    });
    const [humbleworthToken, setHumbleworthToken] = useState('');

    // Load User Settings
    useEffect(() => {
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

    return {
        atomCredentials,
        setAtomCredentials,
        humbleworthToken,
        setHumbleworthToken,
        showAtomSettings,
        setShowAtomSettings,
        handleSaveSettings
    };
};
