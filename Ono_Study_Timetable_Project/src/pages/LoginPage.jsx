import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, TextField, Typography, Stack, Paper, Avatar, Alert, CircularProgress, Link as MuiLink
} from "@mui/material";
import { useNavigate, Navigate, Link as RouterLink, useLocation } from "react-router-dom";
import { signInUser } from "../firebase/authService"; // Adjust path as needed
import { useAuth } from '../context/AuthContext.jsx';
import { runAllSeedsNow } from '../utils/runInitialSeed'; // Adjust path if needed
// import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Optional icon for Avatar

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For login process
  const [isSeeding, setIsSeeding] = useState(false); // For seeding process
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoading: authIsLoading } = useAuth();

  useEffect(() => {
      if (!authIsLoading && currentUser) {
          console.log("[LoginPage] User already logged in, redirecting...");
          navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
      }
  }, [currentUser, authIsLoading, navigate, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSeedDatabase = async () => {
    if (isSeeding) return; // Prevent multiple clicks
    setIsSeeding(true);
    setError("");
    if (window.confirm("Run database seed? This may overwrite data. (DEV ONLY)")) {
        try {
            await runAllSeedsNow(true); // force=true if you want to re-seed past the flag
        } catch (seedError) {
             alert(`Seeding failed: ${seedError.message}`);
             setError(`Seeding failed: ${seedError.message}`);
        }
    }
    setIsSeeding(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSeeding) return; // Don't allow login while seeding
    setError("");
    setIsLoading(true);
    console.log("[LoginPage] Attempting Firebase login with email:", formData.email);
    try {
      const userCredential = await signInUser(formData.email, formData.password);
      console.log("[LoginPage] Firebase login successful. UserCredential:", userCredential?.user?.uid);
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("[LoginPage] Firebase login error:", err.code, err.message);
      let errorMessage = "Login failed. Please check credentials or try again.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (err.code === 'auth/too-many-requests') {
         errorMessage = "Too many login attempts. Try again later.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authIsLoading && !currentUser) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Authenticating...</Typography>
          </Box>
      );
  }
  // If redirect didn't happen in useEffect (e.g., edge case), this is a final check.
  if (currentUser && !authIsLoading) {
       return <Navigate to={location.state?.from?.pathname || "/login"} replace />;
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="calc(100vh - 120px)" sx={{pt: 2, pb: 2}}>
      <Paper elevation={4} sx={{ padding: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', }} component="form" onSubmit={handleLogin} noValidate >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          {/* <LockOutlinedIcon /> */}
        </Avatar>
        <Typography component="h1" variant="h5" mb={2}> Sign in </Typography>
        <Stack spacing={2} sx={{ width: '100%' }}>
          <TextField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth required autoFocus disabled={isLoading || isSeeding} error={!!error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('user'))} helperText={error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('user')) ? error : ' '} autoComplete="email" />
          <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth required disabled={isLoading || isSeeding} error={!!error && error.toLowerCase().includes('password')} helperText={error && error.toLowerCase().includes('password') ? error : ' '} autoComplete="current-password" />
          {error && !(error.toLowerCase().includes('email') || error.toLowerCase().includes('user') || error.toLowerCase().includes('password')) && ( <Alert severity="error" sx={{width: '100%'}}>{error}</Alert> )}
          <Button variant="contained" fullWidth type="submit" disabled={isLoading || isSeeding} sx={{ mt: 2, mb: 1 }} > {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"} </Button>
        </Stack>
      </Paper>

      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 4, p: 2, border: '1px dashed grey', borderRadius: 1, textAlign: 'center', width: '100%', maxWidth: 420 }}>
          <Typography variant="body2" display="block" color="text.secondary" gutterBottom> Developer Tools </Typography>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleSeedDatabase}
            // ✅ Corrected conditions
            disabled={isSeeding || isLoading}
            startIcon={isSeeding ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {/* ✅ Corrected conditions */}
            {isSeeding ? "Seeding Database..." : "Initialize/Seed Database"}
          </Button>
          <Typography variant="caption" display="block" sx={{mt:1, fontSize: '0.7rem'}}> (Run once for Firestore. Check console.) </Typography>
        </Box>
      )}
    </Box>
  );
}