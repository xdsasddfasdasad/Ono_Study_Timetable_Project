// src/components/Auth/RequireAuthHandler.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const RequireAuthHandler = () => {
  console.log("RequireAuthHandler rendering...");
  let currentUser = null;
  let isLoading = true;
  let errorOccurred = false;
  try {
      const authHookValue = useAuth();
      console.log("RequireAuthHandler - Value from useAuth() hook:", authHookValue);
      if (authHookValue) {
          currentUser = authHookValue.currentUser;
          isLoading = authHookValue.isLoading;
      } else {
          console.error("RequireAuthHandler - useAuth() did not return a value. Is AuthProvider wrapping the Routes?");
          errorOccurred = true;
          isLoading = false;
      }
  } catch (error) {
      console.error("RequireAuthHandler - Error calling useAuth():", error);
      errorOccurred = true;
      isLoading = false;
  }
  const location = useLocation();
  console.log(`RequireAuthHandler - State before redirect: isLoading=${isLoading}, hasCurrentUser=${!!currentUser}, errorOccurred=${errorOccurred}`);
  if (isLoading) {
    console.log("RequireAuthHandler - Showing loading state...");
    return <div>בודק אימות...</div>;
  }
  if (errorOccurred) {
      console.warn("RequireAuthHandler - Error occurred, redirecting to /login as fallback.");
       return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (currentUser) {
    console.log("RequireAuthHandler - User found, redirecting to /home");
    return <Navigate to="/home" state={{ from: location }} replace />;
  } else {
    console.log("RequireAuthHandler - No user found (and no error), redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};