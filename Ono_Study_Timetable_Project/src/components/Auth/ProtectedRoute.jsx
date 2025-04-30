// src/components/Auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  // קבל את הנתונים מה-hook
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  // הדפס את הסטטוס בכל רינדור של הרכיב המגן
  console.log(`ProtectedRoute rendering: isLoading=${isLoading}, hasCurrentUser=${!!currentUser}`);

  // 1. בדיקת טעינה
  if (isLoading) {
    console.log("ProtectedRoute: Showing loading state...");
    return <div>Loading Authentication...</div>;
  }

  // 2. בדיקת משתמש (רק אם הטעינה הסתיימה)
  if (!currentUser) {
    console.log("ProtectedRoute: No user, redirecting to /login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. משתמש מאומת והטעינה הסתיימה
  console.log("ProtectedRoute: Authenticated, rendering requested route.");
  return children; // רנדר את הדף המוגן
};

export default ProtectedRoute;