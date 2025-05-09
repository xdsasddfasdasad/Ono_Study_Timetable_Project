import React, { createContext, useState, useContext, useEffect } from 'react';
// Import Firebase auth functions and the listener
import { onAuthStateChangedListener, signOutUser, getUserProfile } from '../firebase/authService'; // Adjust path

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener(async (userAuth) => {
            if (userAuth) {
                try {
                    const userProfile = await getUserProfile(userAuth.uid);
                    if (userProfile) {
                        const combinedUserData = { ...userAuth, ...userProfile, id: userAuth.uid };
                        setCurrentUser(combinedUserData);
                        console.log("[AuthProvider] User authenticated and profile loaded:", combinedUserData.uid);
                    } else {
                        console.warn(`[AuthProvider] User ${userAuth.uid} authenticated, but NO PROFILE found in Firestore. Logging out user.`);
                        // ✅ אם אין פרופיל, התייחס לזה כאל משתמש לא תקין והתנתק
                        await signOutUser(); // This will trigger onAuthStateChanged again with userAuth = null
                        setCurrentUser(null); // Ensure local state is also cleared immediately if needed
                    }
                } catch (error) {
                    console.error("[AuthProvider] Error fetching user profile:", error);
                    setCurrentUser(null); // Log out on error
                }
            } else {
                setCurrentUser(null);
                console.log("[AuthProvider] No user authenticated.");
            }
            // Set loading to false only after all async operations for the auth state change are done
            if (isLoading) setIsLoading(false);
        });
        return () => unsubscribe();
    }, [isLoading]); // Re-run if isLoading changes (though primarily for initial load logic)

    const logout = async () => { /* ... as before ... */ };
    const value = { currentUser, isLoading, logout };
    return ( <AuthContext.Provider value={value}> {children} </AuthContext.Provider> );
};
``

// Custom hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};