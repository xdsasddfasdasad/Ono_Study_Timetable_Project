import React, { createContext, useState, useContext, useEffect } from 'react';
// Import Firebase auth functions and the listener
import { onAuthStateChangedListener, signOutUser, getUserProfile } from '../firebase/authService'; // Adjust path

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    console.log("AuthProvider rendering...");
    // currentUser will now hold the combined data from Auth and Firestore
    const [currentUser, setCurrentUser] = useState(null);
    // isLoading manages the initial auth state check
    const [isLoading, setIsLoading] = useState(true);

    // Effect to listen for authentication state changes
    useEffect(() => {
        console.log("AuthProvider: Setting up auth state listener.");
        // Subscribe to the listener, returns an unsubscribe function
        const unsubscribe = onAuthStateChangedListener(async (userAuth) => {
            console.log("[AuthProvider] Auth state changed. UserAuth:", userAuth ? userAuth.uid : null);
            if (userAuth) {
                // User is logged in (Firebase Auth)
                try {
                    // Fetch additional profile data from Firestore using the UID
                    const userProfile = await getUserProfile(userAuth.uid);
                    if (userProfile) {
                        // Combine Auth data (uid, email) with Firestore profile data
                        const combinedUserData = {
                            ...userAuth, // Includes uid, email, emailVerified etc.
                            ...userProfile, // Includes firstName, lastName, username, etc. (overwrites email if exists)
                            // Ensure the final 'id' field matches the UID
                            id: userAuth.uid
                        };
                        console.log("[AuthProvider] User profile found. Setting combined currentUser:", combinedUserData);
                        setCurrentUser(combinedUserData);
                    } else {
                         // Auth user exists, but no profile found in Firestore (edge case?)
                         console.warn(`[AuthProvider] User ${userAuth.uid} authenticated but profile not found in Firestore.`);
                         // Decide how to handle: logout? set only auth data? set error?
                         setCurrentUser(userAuth); // Set basic auth data for now
                    }
                } catch (error) {
                    console.error("[AuthProvider] Error fetching user profile:", error);
                    // Handle profile fetch error (e.g., maybe log user out?)
                    setCurrentUser(null); // Log out on profile fetch error
                }
            } else {
                // User is logged out
                console.log("[AuthProvider] User logged out.");
                setCurrentUser(null);
            }
            // Finished initial check or update, set loading to false
            // Move setIsLoading(false) here to ensure it happens after async profile fetch
            if (isLoading) {
                 console.log("[AuthProvider] Initial auth check complete. Setting loading false.");
                 setIsLoading(false);
            }
        });

        // Cleanup function: Unsubscribe the listener when the component unmounts
        return () => {
             console.log("AuthProvider: Cleaning up auth state listener.");
             unsubscribe();
        };
    }, []); // Empty dependency array means this runs only once on mount

    // Logout function now calls the Firebase sign out utility
    const logout = async () => {
        console.log("AuthContext: logout function called.");
        try {
            await signOutUser();
            console.log("AuthContext: Firebase sign out successful.");
            // No need to manually set currentUser to null, the listener will do it
        } catch (error) {
            console.error("AuthContext: Error during sign out:", error);
            // Handle potential sign out errors
        }
    };

    // Value provided to consuming components
    // Login is now handled by components calling authService directly
    const value = { currentUser, isLoading, logout }; // Removed login from context value

    console.log(`AuthProvider rendering Provider with: isLoading=${isLoading}, currentUser UID=${currentUser?.uid}`);
    return (
        <AuthContext.Provider value={value}>
           {children}
        </AuthContext.Provider>
    );
};

// Custom hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};