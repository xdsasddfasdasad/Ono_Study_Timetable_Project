// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { onAuthStateChangedListener, signOutUser, getUserProfile } from '../firebase/authService'; // Adjust path

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    console.log("AuthProvider rendering...");
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isSeedingGlobal, setIsSeedingGlobal] = useState(false); // From previous discussion

    useEffect(() => {
        console.log("[AuthProvider] 5. Setting up onAuthStateChanged listener. isSeedingGlobal:", isSeedingGlobal);
        const unsubscribe = onAuthStateChangedListener(async (userAuth) => {
            console.log("[AuthProvider] 5a. onAuthStateChanged triggered. userAuth:", userAuth ? userAuth.uid : null, "Current isSeedingGlobal:", isSeedingGlobal);

            if (isSeedingGlobal) {
                console.log("[AuthProvider] Seeding is in progress, auth state processing deferred for now.");
                // We still need to ensure isLoadingAuth eventually becomes false after the very first check
                if (isLoadingAuth) setIsLoadingAuth(false);
                return;
            }

            if (userAuth) {
                try {
                    console.log(`[AuthProvider] User ${userAuth.uid} authenticated by Firebase. Fetching profile...`);
                    const userProfile = await getUserProfile(userAuth.uid);
                    if (userProfile) {
                        const combinedUserData = { ...userAuth, ...userProfile, id: userAuth.uid };
                        setCurrentUser(combinedUserData);
                        console.log("[AuthProvider] 6a. currentUser SET to combined user object (Auth + Profile):", combinedUserData.uid);
                    } else {
                        console.warn(`[AuthProvider] User ${userAuth.uid} authenticated, but NO Firestore PROFILE found. Logging out user as incomplete.`);
                        await signOutUser(); // This will re-trigger onAuthStateChanged with null
                                             // No need to setCurrentUser(null) here, listener will handle it.
                    }
                } catch (error) {
                    console.error("[AuthProvider] Error fetching user profile:", error);
                    setCurrentUser(null); // Fallback: Log out user on profile fetch error
                    console.log("[AuthProvider] 6c. currentUser SET to NULL due to profile fetch error.");
                }
            } else {
                setCurrentUser(null);
                console.log("[AuthProvider] 6b. No Auth user. currentUser SET to NULL.");
            }

            // Set loading to false after the first auth state has been determined and processed
            if (isLoadingAuth) {
                setIsLoadingAuth(false);
                console.log("[AuthProvider] 7. Initial auth check complete. isLoadingAuth SET to false.");
            }
        });
        return () => {
            console.log("AuthProvider: Cleaning up auth state listener.");
            unsubscribe();
        };
    }, [isLoadingAuth, isSeedingGlobal]);

    const logout = async () => {
        console.log("[AuthContext] 2. logout function in context called");
        try {
            await signOutUser(); // From authService
            console.log("[AuthContext] 3. signOutUser (Firebase) successful. onAuthStateChanged will handle currentUser update.");
            // The onAuthStateChanged listener will set currentUser to null
        } catch (error) {
            console.error("[AuthContext] Error calling signOutUser:", error);
            // Potentially set an error state here if needed for UI feedback
        }
    };

    // Value provided to consuming components
    const value = {
        currentUser,
        isLoadingAuth, // Renamed from isLoading
        logout,        // Now correctly defined above
        isSeedingGlobal,
        setIsSeedingGlobal,
    };

    console.log(`AuthProvider rendering Provider with: isLoadingAuth=${isLoadingAuth}, isSeedingGlobal=${isSeedingGlobal}, currentUser UID=${currentUser?.uid}`);
    return (
        <AuthContext.Provider value={value}>
           {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};