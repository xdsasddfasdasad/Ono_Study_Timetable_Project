import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, TextField, Typography, Stack, Paper, Avatar, Alert, CircularProgress, Link as MuiLink
} from "@mui/material";
import { useNavigate, Navigate, Link as RouterLink, useLocation } from "react-router-dom";
import { signInUser } from "../firebase/authService"; // For user login
import { useAuth } from '../context/AuthContext.jsx'; // To get auth state and global seeding controls
import { runAllSeedsNow } from '../utils/runInitialSeed'; // The main seeding function
// import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Optional: for Avatar icon

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(""); // For login errors
  const [isLoading, setIsLoading] = useState(false); // For login button loading state
  // State for the local "Seed Database" button's loading appearance
  const [isSeedButtonLoading, setIsSeedButtonLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  // Get global states and setters from AuthContext
  const { currentUser, isLoading: authIsLoading, isSeedingGlobal, setIsSeedingGlobal } = useAuth();

  // Effect to redirect if user is already logged in
  useEffect(() => {
    console.log(`[LoginPage] useEffect check. !authIsLoading: ${!authIsLoading}, !isSeedingGlobal: ${!isSeedingGlobal}, !!currentUser: ${!!currentUser}, !error: ${!error}`);
    // Only redirect if authentication check is complete, global seeding is NOT active,
    // a user is present, and there's no current login error on this page.
    if (!authIsLoading && !isSeedingGlobal && currentUser && !error) {
      console.log("[LoginPage] User logged in, not seeding, redirecting from login page...");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    }
  }, [currentUser, authIsLoading, isSeedingGlobal, navigate, location.state, error]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear login error on new input
  };

  // Handle the "Seed Database" button click
  const handleSeedDatabase = async () => {
    if (isSeedButtonLoading || isLoading) return; // Prevent action if login or another seed is in progress

    setIsSeedButtonLoading(true); // Show loading on the seed button
    setError(""); // Clear any existing login errors

    if (window.confirm("Run database seed? (DEV ONLY - This may overwrite data or create duplicates if not a fresh database)")) {
        console.log("[LoginPage] User confirmed database seed.");
        try {
            // ✅ Pass the global setIsSeedingGlobal function to the seeder
            // runAllSeedsNow will set isSeedingGlobal to true at the start
            // and false at the end (or on error).
            await runAllSeedsNow(true, setIsSeedingGlobal); // Force seed for this button
            // Alerts inside runAllSeedsNow will notify user of completion/failure.
        } catch (seedError) {
             // This catch is for unexpected errors thrown directly by runAllSeedsNow
             console.error("[LoginPage] Uncaught error directly from runAllSeedsNow:", seedError);
             alert(`Seeding process encountered an unexpected critical failure: ${seedError.message}`);
             setError(`Seeding issue: ${seedError.message}`);
        }
    } else {
        console.log("[LoginPage] User cancelled database seed.");
    }
    setIsSeedButtonLoading(false); // Reset local seed button loading state
  };

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSeedButtonLoading || isLoading) return; // Prevent login if seeding or another login is in progress
    setError("");
    setIsLoading(true); // Set loading for the login button
    console.log("[LoginPage] Attempting Firebase login with email:", formData.email);

    try {
      const userCredential = await signInUser(formData.email, formData.password);
      console.log("[LoginPage] Firebase login successful. User UID:", userCredential?.user?.uid);
      // AuthContext's onAuthStateChanged will handle setting currentUser and redirecting.
      // No explicit navigation needed here if ProtectedRoute and useEffect above handle it.
      // However, for immediate UX, navigating can be good:
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("[LoginPage] Firebase login error:", err.code, err.message);
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
      setIsLoading(false); // Reset login button loading state
    }
  };


  // --- Render Logic ---

  // Show full-page loader if global seeding is in progress
  if (isSeedingGlobal) {
      return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, color: 'text.secondary' }}>Database Seeding in Progress... Please Wait.</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>(The page will reload automatically when done)</Typography>
          </Box>
      );
  }

  // Show loader if Firebase Auth is still checking initial state (and not globally seeding)
  if (authIsLoading && !currentUser) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Authenticating...</Typography>
          </Box>
      );
  }

  // If user is logged in (and not seeding/auth loading), this component should have already redirected via useEffect.
  // This is a fallback, but ideally the useEffect handles it.
  if (currentUser && !authIsLoading && !isSeedingGlobal) {
       console.log("[LoginPage] Fallback redirect: User already authenticated.");
       return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;
  }

  // Render the login form
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="calc(100vh - 120px)" sx={{pt: {xs:1, sm:2}, pb: {xs:1, sm:2}}}>
      <Paper elevation={4} sx={{ padding: { xs: 2, sm: 4 }, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center' }} component="form" onSubmit={handleLogin} noValidate >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          {/* <LockOutlinedIcon /> */}
        </Avatar>
        <Typography component="h1" variant="h5" mb={3}> Sign in </Typography>
        <Stack spacing={2} sx={{ width: '100%' }}>
          <TextField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth required autoFocus disabled={isLoading || isSeedButtonLoading} error={!!error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('user'))} helperText={error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('user')) ? error : ' '} autoComplete="email" variant="outlined" />
          <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth required disabled={isLoading || isSeedButtonLoading} error={!!error && error.toLowerCase().includes('password')} helperText={error && error.toLowerCase().includes('password') ? error : ' '} autoComplete="current-password" variant="outlined" />
          {error && !(error.toLowerCase().includes('email') || error.toLowerCase().includes('user') || error.toLowerCase().includes('password')) && ( <Alert severity="error" sx={{width: '100%'}}>{error}</Alert> )}
          <Button variant="contained" fullWidth type="submit" disabled={isLoading || isSeedButtonLoading} sx={{ mt: 2, mb: 1 }} > {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"} </Button>
        </Stack>
      </Paper>

      {/* Seed Button (Visible only in development environment) */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 4, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center', width: '100%', maxWidth: 420 }}>
          <Typography variant="overline" display="block" color="text.secondary" gutterBottom> Developer Tools </Typography>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleSeedDatabase}
            disabled={isSeedButtonLoading || isLoading || authIsLoading} // Disable if login/auth/seed in progress
            startIcon={isSeedButtonLoading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {isSeedButtonLoading ? "Seeding Database..." : "Initialize/Seed Database"}
          </Button>
          <Typography variant="caption" display="block" sx={{mt:1, fontSize: '0.7rem'}}> (Run once to populate Firestore. Check console.) </Typography>
        </Box>
      )}
    </Box>
  );
}