// src/components/Auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoadingAuth, isSeedingGlobal } = useAuth(); // ✅ Get isSeedingGlobal
  const location = useLocation();

  // ✅ If seeding is in progress, show a global loading/waiting state
  if (isSeedingGlobal) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Initializing Data... Please Wait.</Typography>
        </Box>
    );
  }
  if (isLoadingAuth) {
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