// src/components/Auth/RequireAuthHandler.jsx
import React from 'react'; // Removed useContext as it's not needed directly
import { Navigate, useLocation } from 'react-router-dom';
// ✅ ייבוא רק של ה-hook useAuth
import { useAuth } from '../../context/AuthContext.jsx';

export const RequireAuthHandler = () => {
  console.log("RequireAuthHandler rendering...");

  // נשתמש רק ב-hook
  let currentUser = null;
  let isLoading = true; // Default to loading
  let errorOccurred = false; // Flag for errors from useAuth

  try {
      const authHookValue = useAuth(); // Call the hook
      console.log("RequireAuthHandler - Value from useAuth() hook:", authHookValue);

      // Check if the hook returned a valid context value
      if (authHookValue) {
          currentUser = authHookValue.currentUser;
          isLoading = authHookValue.isLoading;
      } else {
          // This case (hook returning null/undefined) indicates the Provider is missing
          console.error("RequireAuthHandler - useAuth() did not return a value. Is AuthProvider wrapping the Routes?");
          errorOccurred = true; // Treat missing provider as an error state
          isLoading = false; // Stop showing loading message if provider is missing
      }
  } catch (error) {
      // Catch errors thrown by useAuth itself (e.g., if context is undefined)
      console.error("RequireAuthHandler - Error calling useAuth():", error);
      errorOccurred = true;
      isLoading = false; // Stop loading on error
  }

  const location = useLocation();
  console.log(`RequireAuthHandler - State before redirect: isLoading=${isLoading}, hasCurrentUser=${!!currentUser}, errorOccurred=${errorOccurred}`);

  // --- Redirect Logic ---

  // 1. Handle Loading State
  if (isLoading) {
    console.log("RequireAuthHandler - Showing loading state...");
    // It's important isLoading becomes false eventually, check AuthContext useEffect logs
    return <div>בודק אימות...</div>;
  }

  // 2. Handle Error State (e.g., Provider missing or hook error)
  // Decide where to redirect on error - Login seems safest default
  if (errorOccurred) {
      console.warn("RequireAuthHandler - Error occurred, redirecting to /login as fallback.");
       return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Handle Authentication State (only if no error and not loading)
  if (currentUser) {
    console.log("RequireAuthHandler - User found, redirecting to /home");
    return <Navigate to="/home" state={{ from: location }} replace />;
  } else {
    console.log("RequireAuthHandler - No user found (and no error), redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};