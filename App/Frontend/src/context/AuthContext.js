import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(auth.currentUser);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            if (u && !u.isAnonymous) {
                try {
                    // Ensure user document exists in Firestore
                    const userRef = doc(db, 'users', u.uid);
                    const userSnap = await getDoc(userRef);

                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            email: u.email,
                            fullName: u.displayName || 'App User',
                            createdAt: serverTimestamp(),
                            role: 'user',
                            admin: false,
                            platform: 'app'
                        });
                    }
                } catch (error) {
                    console.error("Error ensuring user profile:", error);
                }
            }

            setUser(u);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const isGuest = !user || user.isAnonymous;

    return (
        <AuthContext.Provider value={{ user, loading, isGuest }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
