// src/pages/LoginPage.jsx

import React, { useState, useEffect, useCallback } from "react";
// Imports Material-UI components for building the login form and its states.
import {
  Box, Button, TextField, Typography, Stack, Paper, Avatar, Alert, CircularProgress, Link as MuiLink, 
  LinearProgress
} from "@mui/material";
// Imports routing hooks for navigation and accessing location state.
import { useNavigate, Navigate, Link as RouterLink, useLocation } from "react-router-dom";
// Imports the specific authentication service for signing in.
import { signInUser } from "../firebase/authService";
// Imports the authentication context to get the current user and global auth states.
import { useAuth } from '../context/AuthContext.jsx';
// Imports a developer utility for seeding the database with initial data.
import { runAllSeedsNow } from '../utils/runInitialSeed';

// This is the "smart" page component for the user login screen.
// It manages form state, handles login attempts, displays errors, and redirects on success.
export default function LoginPage() {
  // === STATE MANAGEMENT ===
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(""); // Holds user-facing error messages.
  const [isLoading, setIsLoading] = useState(false); // Loading state for the login process.
  const [isSeedButtonLoading, setIsSeedButtonLoading] = useState(false); // Separate loading state for the dev-only seed button.

  const navigate = useNavigate();
  const location = useLocation(); // Used to get the page the user was trying to access before being sent to login.
  const { currentUser, isLoadingAuth, isSeedingGlobal, setIsSeedingGlobal } = useAuth();

  // --- Effect for Automatic Redirection ---
  // This effect checks if a user is already logged in and redirects them away from the login page.
  useEffect(() => {
    // Only perform the redirect if auth is settled, no seeding is happening, a user exists, and there's no error.
    if (!authIsLoading && !isSeedingGlobal && currentUser && !error) {
      // Redirect to the page they originally intended to visit, or to the dashboard as a default.
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    }
  }, [currentUser, authIsLoading, isSeedingGlobal, navigate, location.state, error]);

  // --- HANDLERS ---
  // A generic handler for the form's text inputs.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear any previous error when the user starts typing.
  };

  // A handler for the developer-only database seeding button.
  const handleSeedDatabase = async () => {
    if (isSeedButtonLoading || isLoading) return;
    setIsSeedButtonLoading(true);
    setError("");
    // Always show a confirmation dialog for such a destructive action.
    if (window.confirm("Run database seed? (DEV ONLY - This may overwrite data or create duplicates if not a fresh database)")) {
      try {
        // The seed utility is passed the setter for the global seeding flag.
        // It will set this flag to `true` at the start and `false` at the end of its process.
        await runAllSeedsNow(true, setIsSeedingGlobal);
      } catch (seedError) {
        console.error("[LoginPage] Uncaught error directly from runAllSeedsNow:", seedError);
        alert(`Seeding process encountered an unexpected critical failure: ${seedError.message}`);
        setError(`Seeding issue: ${seedError.message}`);
      }
    }
    setIsSeedButtonLoading(false);
  };

  // The main handler for the login form submission.
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSeedButtonLoading || isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      // Call the authentication service to sign the user in.
      await signInUser(formData.email, formData.password);
      // The redirection is now handled by the useEffect hook, which will fire
      // when the `currentUser` state updates in the AuthContext after a successful login.
    } catch (err) {
      // Translate Firebase error codes into user-friendly messages.
      let errorMessage = "Login failed. Please check your credentials.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many login attempts. Please try again later.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER LOGIC ---

  // If the global seeding flag is active, show a full-page loading screen.
  // This prevents any other part of the app from rendering during this critical process.
  if (isSeedingGlobal) {
      return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, color: 'text.secondary' }}>Database Seeding in Progress... Please Wait.</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>(The page will reload automatically when done)</Typography>
          </Box>
      );
  }

  // While waiting for the initial Firebase auth check, show a simple loading state.
  if (authIsLoading && !currentUser) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Authenticating...</Typography>
          </Box>
      );
  }

  // If the user is authenticated and all loading is done, render a Navigate component
  // to redirect them. This is more reliable than calling `navigate` inside the main render body.
  if (currentUser && !authIsLoading && !isSeedingGlobal) {
       return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;
  }

  // The main login form UI.
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="calc(100vh - 120px)" sx={{pt: {xs:1, sm:2}, pb: {xs:1, sm:2}}}>
      <Paper elevation={4} sx={{ padding: { xs: 2, sm: 4 }, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }} component="form" onSubmit={handleLogin} noValidate >
        
        {/* The LinearProgress bar provides visual feedback during the login attempt. */}
        {isLoading && <LinearProgress sx={{ width: '110%', mb: 2 }} />} 
        
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          {/* Icon can be added here, e.g., <LockOutlinedIcon /> */}
        </Avatar>
        <Typography component="h1" variant="h5" mb={3}> Sign in </Typography>
        <Stack spacing={2} sx={{ width: '100%' }}>
          <TextField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth required autoFocus disabled={isLoading || isSeedButtonLoading} error={!!error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('user'))} helperText={error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('user')) ? error : ' '} autoComplete="email" variant="outlined" />
          <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth required disabled={isLoading || isSeedButtonLoading} error={!!error && error.toLowerCase().includes('password')} helperText={error && error.toLowerCase().includes('password') ? error : ' '} autoComplete="current-password" variant="outlined" />
          {/* Display a general error message if it doesn't pertain to a specific field. */}
          {error && !(error.toLowerCase().includes('email') || error.toLowerCase().includes('user') || error.toLowerCase().includes('password')) && ( <Alert severity="error" sx={{width: '100%'}}>{error}</Alert> )}
          <Button variant="contained" fullWidth type="submit" disabled={isLoading || isSeedButtonLoading} sx={{ mt: 2, mb: 1 }} > {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"} </Button>
        </Stack>
      </Paper>
      
      {/* This is a developer-only utility button, which should be removed in a production build. */}
      {process.env.NODE_ENV === 'development' && (
        <Button onClick={handleSeedDatabase} disabled={isSeedButtonLoading || isLoading} color="secondary" sx={{mt: 2}}>
          {isSeedButtonLoading ? <CircularProgress size={24} /> : 'Seed Database (DEV)'}
        </Button>
      )}
    </Box>
  );
}