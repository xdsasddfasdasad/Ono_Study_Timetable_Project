import React, { useState, useCallback } from "react";
import {
  Box, Button, TextField, Typography, Stack, Alert, CircularProgress, Link as MuiLink
} from "@mui/material";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
// Import the specific sign-in function from your authService
import { signInUser } from "../firebase/authService"; // Adjust path as needed
// We still use useAuth to check if user is already logged in (for redirection) and for isLoading
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  // Assume the 'username' field in the form will actually take the user's email for Firebase Auth
  const [formData, setFormData] = useState({ email: "", password: "" }); // Changed username to email
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoading: authIsLoading } = useAuth(); // Get auth loading state too

  // Redirect if user is already logged in and auth is not loading
  useEffect(() => {
      if (!authIsLoading && currentUser) {
          console.log("[LoginPage] User already logged in, redirecting...");
          navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
      }
  }, [currentUser, authIsLoading, navigate, location.state]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error on change
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log("[LoginPage] Attempting Firebase login with email:", formData.email);

    try {
      // Call the Firebase sign-in function from authService
      // Pass email and password directly
      const userCredential = await signInUser(formData.email, formData.password);
      console.log("[LoginPage] Firebase login successful. UserCredential:", userCredential);
      // AuthContext listener (onAuthStateChanged) will pick up the new user state
      // and update currentUser globally. The ProtectedRoute will then allow access.
      // Navigate to the intended page or a default one (e.g., dashboard)
      // The listener in AuthContext will eventually update currentUser and isLoading
      // which will trigger a re-render and ProtectedRoute will handle redirection.
      // For immediate feedback, we can navigate here.
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });

    } catch (err) {
      console.error("[LoginPage] Firebase login error:", err.code, err.message);
      // Handle specific Firebase Auth errors
      let errorMessage = "Login failed. Please check your credentials or try again.";
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

  // Do not render the form if auth is still loading and user might be logged in
  if (authIsLoading) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading...</Typography>
          </Box>
      );
  }
  // If user becomes available after loading (e.g. navigated back here while logged in), redirect
  // This is an additional check to the useEffect, for cases where navigation might bring user here
  if (currentUser) {
       return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;
  }


  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="calc(100vh - 120px)" // Adjust based on header/footer height
      sx={{pt: 2, pb: 2}}
    >
      <Paper
        elevation={4}
        sx={{
          padding: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        component="form"
        onSubmit={handleLogin}
        noValidate // Disable browser validation, rely on our own
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          {/* <LockOutlinedIcon /> */}
        </Avatar>
        <Typography component="h1" variant="h5" mb={2}>
          Sign in
        </Typography>
        <Stack spacing={2} sx={{ width: '100%' }}>
          <TextField
            label="Email Address" // Changed label
            name="email" // Changed name to email
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
            disabled={isLoading}
            error={!!error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('user'))} // Highlight if error related
            helperText={error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('user')) ? error : ' '}
            autoComplete="email"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
            disabled={isLoading}
            error={!!error && error.toLowerCase().includes('password')} // Highlight if error related
            helperText={error && error.toLowerCase().includes('password') ? error : ' '}
            autoComplete="current-password"
          />
          {error && !(error.toLowerCase().includes('email') || error.toLowerCase().includes('user') || error.toLowerCase().includes('password')) && (
                <Alert severity="error" sx={{width: '100%'}}>{error}</Alert>
          )}
          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={isLoading}
            sx={{ mt: 2, mb: 1 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}