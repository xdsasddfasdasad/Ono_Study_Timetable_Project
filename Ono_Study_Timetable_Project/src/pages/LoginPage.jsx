import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, TextField, Typography, Stack, Paper, Avatar, Alert, CircularProgress, Link as MuiLink, 
  LinearProgress // ✨ 1. ייבוא של הרכיב החדש
} from "@mui/material";
import { useNavigate, Navigate, Link as RouterLink, useLocation } from "react-router-dom";
import { signInUser } from "../firebase/authService";
import { useAuth } from '../context/AuthContext.jsx';
import { runAllSeedsNow } from '../utils/runInitialSeed';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeedButtonLoading, setIsSeedButtonLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoading: authIsLoading, isSeedingGlobal, setIsSeedingGlobal } = useAuth();

  useEffect(() => {
    if (!authIsLoading && !isSeedingGlobal && currentUser && !error) {
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    }
  }, [currentUser, authIsLoading, isSeedingGlobal, navigate, location.state, error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSeedDatabase = async () => {
    if (isSeedButtonLoading || isLoading) return;
    setIsSeedButtonLoading(true);
    setError("");
    if (window.confirm("Run database seed? (DEV ONLY - This may overwrite data or create duplicates if not a fresh database)")) {
      try {
        await runAllSeedsNow(true, setIsSeedingGlobal);
      } catch (seedError) {
        console.error("[LoginPage] Uncaught error directly from runAllSeedsNow:", seedError);
        alert(`Seeding process encountered an unexpected critical failure: ${seedError.message}`);
        setError(`Seeding issue: ${seedError.message}`);
      }
    }
    setIsSeedButtonLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSeedButtonLoading || isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      await signInUser(formData.email, formData.password);
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
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

  if (isSeedingGlobal) {
      return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, color: 'text.secondary' }}>Database Seeding in Progress... Please Wait.</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>(The page will reload automatically when done)</Typography>
          </Box>
      );
  }

  if (authIsLoading && !currentUser) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Authenticating...</Typography>
          </Box>
      );
  }

  if (currentUser && !authIsLoading && !isSeedingGlobal) {
       return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="calc(100vh - 120px)" sx={{pt: {xs:1, sm:2}, pb: {xs:1, sm:2}}}>
      <Paper elevation={4} sx={{ padding: { xs: 2, sm: 4 }, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }} component="form" onSubmit={handleLogin} noValidate >
        
        {/* ✨ 2. הוספת ה-LinearProgress כאן. הוא יופיע רק כאשר isLoading=true */}
        {isLoading && <LinearProgress sx={{ width: '110%', mb: 2 }} />} 
        
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
    </Box>
  );
}