// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// Imports the necessary Firebase authentication services.
import { onAuthStateChangedListener, signOutUser, getUserProfile } from '../firebase/authService';

// Creates a new React Context to hold and provide authentication state to the application.
const AuthContext = createContext(null);

// This is the Provider component that will wrap the entire application or parts of it
// that need access to authentication information. It manages the user's session state.
export const AuthProvider = ({ children }) => {
    // These console logs are useful for debugging the component's render lifecycle.
    console.log("AuthProvider rendering...");
    
    // === STATE MANAGEMENT ===
    // `currentUser`: Holds the authenticated user object (a combination of Firebase Auth and Firestore profile data), or null if logged out.
    const [currentUser, setCurrentUser] = useState(null);
    // `isLoadingAuth`: A crucial state to manage the initial authentication check. It's true when the app first loads
    // and becomes false after Firebase confirms whether a user is logged in or not. This prevents UI flickering.
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    // `isSeedingGlobal`: A special state flag used to pause authentication processing during critical,
    // one-time data setup operations (e.g., for a brand new user).
    const [isSeedingGlobal, setIsSeedingGlobal] = useState(false);

    // This is the core effect for managing the user's authentication session.
    // It sets up a long-lived listener to Firebase's auth state.
    useEffect(() => {
        // Log when the listener is being set up.
        console.log("[AuthProvider] 5. Setting up onAuthStateChanged listener. isSeedingGlobal:", isSeedingGlobal);
        
        // `onAuthStateChangedListener` is a wrapper around Firebase's `onAuthStateChanged`.
        // It returns an `unsubscribe` function to clean up the listener later.
        const unsubscribe = onAuthStateChangedListener(async (userAuth) => {
            // This callback function runs whenever the user's login state changes (login, logout, token refresh).
            console.log("[AuthProvider] 5a. onAuthStateChanged triggered. userAuth:", userAuth ? userAuth.uid : null, "Current isSeedingGlobal:", isSeedingGlobal);

            // This is a critical guard against race conditions. If a global data seed is in progress,
            // we do not want to change the user state. We defer processing until seeding is complete.
            if (isSeedingGlobal) {
                console.log("[AuthProvider] Seeding is in progress, auth state processing deferred for now.");
                // Ensure isLoadingAuth is eventually false after the very first check.
                if (isLoadingAuth) setIsLoadingAuth(false);
                return;
            }

            // If `userAuth` exists, it means Firebase has confirmed the user is authenticated.
            if (userAuth) {
                try {
                    console.log(`[AuthProvider] User ${userAuth.uid} authenticated by Firebase. Fetching profile...`);
                    // It's not enough to be authenticated; we also need the user's profile data from Firestore.
                    const userProfile = await getUserProfile(userAuth.uid);
                    
                    if (userProfile) {
                        // If the profile exists, combine the auth data and profile data into a single user object.
                        const combinedUserData = { ...userAuth, ...userProfile, id: userAuth.uid };
                        setCurrentUser(combinedUserData);
                        console.log("[AuthProvider] 6a. currentUser SET to combined user object (Auth + Profile):", combinedUserData.uid);
                    } else {
                        // This handles an inconsistent state where a user exists in Auth but not in our Firestore database.
                        // We log them out to force a clean state.
                        console.warn(`[AuthProvider] User ${userAuth.uid} authenticated, but NO Firestore PROFILE found. Logging out user as incomplete.`);
                        await signOutUser(); // This will re-trigger the listener with a null user.
                    }
                } catch (error) {
                    console.error("[AuthProvider] Error fetching user profile:", error);
                    setCurrentUser(null); // On any error, log the user out.
                    console.log("[AuthProvider] 6c. currentUser SET to NULL due to profile fetch error.");
                }
            } else {
                // If `userAuth` is null, the user is logged out.
                setCurrentUser(null);
                console.log("[AuthProvider] 6b. No Auth user. currentUser SET to NULL.");
            }

            // After the very first auth check is complete, set loading to false.
            if (isLoadingAuth) {
                setIsLoadingAuth(false);
                console.log("[AuthProvider] 7. Initial auth check complete. isLoadingAuth SET to false.");
            }
        });

        // The cleanup function for the useEffect hook.
        // This is essential to prevent memory leaks by removing the listener when the component unmounts.
        return () => {
            console.log("AuthProvider: Cleaning up auth state listener.");
            unsubscribe();
        };
    }, [isLoadingAuth, isSeedingGlobal]); // The effect re-runs if these state values change.

    // A function to log the user out. It's provided to the rest of the app via the context value.
    const logout = async () => {
        console.log("[AuthContext] 2. logout function in context called");
        try {
            // This simply calls the Firebase sign-out service.
            await signOutUser();
            // We don't need to manually set `currentUser` to null here. The `onAuthStateChanged` listener
            // will automatically fire with a null user and handle the state update for us.
            console.log("[AuthContext] 3. signOutUser (Firebase) successful. onAuthStateChanged will handle currentUser update.");
        } catch (error) {
            console.error("[AuthContext] Error calling signOutUser:", error);
        }
    };

    // The `value` object contains all the state and functions that will be made available
    // to any component that consumes this context.
    const value = {
        currentUser,
        isLoadingAuth,
        logout,
        isSeedingGlobal,
        setIsSeedingGlobal, // Provide the setter so other parts of the app can trigger the seeding state.
    };

    console.log(`AuthProvider rendering Provider with: isLoadingAuth=${isLoadingAuth}, isSeedingGlobal=${isSeedingGlobal}, currentUser UID=${currentUser?.uid}`);
    
    return (
        <AuthContext.Provider value={value}>
           {children}
        </AuthContext.Provider>
    );
};

// A custom hook for easy consumption of the context.
export const useAuth = () => {
  const context = useContext(AuthContext);
  // This check ensures that the hook is used within a component tree wrapped by AuthProvider.
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};