// src/components/Auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  console.log(`ProtectedRoute Check: isLoading=${isLoading}, hasCurrentUser=${!!currentUser}`);
  if (isLoading) {
    return (
         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}> {/* Adjust height if needed */}
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Checking Authentication...</Typography>
         </Box>
     );
  }
  if (!currentUser) {
    console.log("ProtectedRoute: No user, redirecting to /login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  console.log("ProtectedRoute: Authenticated, rendering children/outlet.");
  return children ? children : <Outlet />;
};

export default ProtectedRoute;