// src/components/Auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  console.log(`ProtectedRoute rendering: isLoading=${isLoading}, hasCurrentUser=${!!currentUser}`);
  if (isLoading) {
    console.log("ProtectedRoute: Showing loading state...");
    return <div>Loading Authentication...</div>;
  }
  if (!currentUser) {
    console.log("ProtectedRoute: No user, redirecting to /login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  console.log("ProtectedRoute: Authenticated, rendering requested route.");
  return children;
};

export default ProtectedRoute;