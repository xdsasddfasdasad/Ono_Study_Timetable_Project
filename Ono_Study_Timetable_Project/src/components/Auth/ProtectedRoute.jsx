// src/components/Auth/ProtectedRoute.jsx
import React from 'react';
// Imports routing tools from react-router-dom.
// - Navigate: Used for programmatic redirection (e.g., sending a user to the login page).
// - useLocation: Gives us access to the current URL, which is useful for post-login redirects.
// - Outlet: A placeholder used in parent routes to render their child route components.
import { Navigate, useLocation, Outlet } from 'react-router-dom';
// Imports the custom hook that provides authentication state from our AuthContext.
import { useAuth } from '../../context/AuthContext.jsx';
// Imports Material-UI components for displaying loading indicators.
import { Box, CircularProgress, Typography } from '@mui/material';

// This component acts as a gatekeeper for routes that require a user to be logged in.
// It checks for several states (initial data seeding, authentication loading, and final auth status)
// before deciding whether to render the requested page or redirect to the login screen.
const ProtectedRoute = ({ children }) => {
  // Destructures the necessary values from the authentication context.
  // - currentUser: The authenticated user object from Firebase, or null if not logged in.
  // - isLoadingAuth: A boolean that's true while Firebase is initially checking the user's auth status.
  // - isSeedingGlobal: A boolean that's true during a special, one-time data initialization process for a user.
  const { currentUser, isLoadingAuth, isSeedingGlobal } = useAuth();
  // Gets the current location object, which contains the pathname the user is trying to access.
  const location = useLocation();

  // First, check if the application is in a global data seeding state.
  // This is a high-priority loading screen that takes precedence over other checks.
  // It indicates a one-time setup (e.g., for a new user) is in progress.
  if (isSeedingGlobal) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Initializing Data... Please Wait.</Typography>
        </Box>
    );
  }

  // Second, check if the app is in the process of verifying the user's authentication status.
  // This typically happens on a page refresh, as Firebase checks for a persisted session.
  // We show a loading spinner to prevent a flicker of the login page before the user is confirmed.
  if (isLoadingAuth) {
    return (
         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Checking Authentication...</Typography>
         </Box>
     );
  }

  // After the loading checks are complete, we can definitively check if there is a logged-in user.
  // If not, we redirect them to the login page.
  if (!currentUser) {
    console.log("ProtectedRoute: No user, redirecting to /login.");
    // The Navigate component handles the redirection.
    // - 'to="/login"': The destination path.
    // - 'state={{ from: location }}': We pass the current location in the redirect state. This allows the login
    //   page to redirect the user back to the page they were originally trying to access after a successful login.
    // - 'replace': This replaces the current entry in the history stack, so the user can't click the "back"
    //   button to get back to the protected route they were redirected from.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user is authenticated and all loading is finished, we grant access.
  console.log("ProtectedRoute: Authenticated, rendering children/outlet.");
  // This pattern provides flexibility.
  // - If the component is used as a wrapper (`<ProtectedRoute><Dashboard/></ProtectedRoute>`), `children` will be rendered.
  // - If it's used in a route config (`<Route element={<ProtectedRoute />}><Route path='dashboard' .../></Route>`),
  //   the `<Outlet />` will render the matched child route.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;