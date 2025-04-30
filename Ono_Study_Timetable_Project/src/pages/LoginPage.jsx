// /src/pages/LoginPage.jsx
import React, { useState } from "react";
import {
  Box, Button, TextField, Typography, Stack, Alert, CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { hashPassword } from "../utils/hash";
import { useAuth } from "../context/AuthContext.jsx"; // ודא נתיב
import { getRecords } from "../utils/storage"; // ודא נתיב

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //  הוספת לוגים לפונקציית הלוגין
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("[LoginPage] handleLogin START"); // <-- לוג 1: האם הפונקציה נקראת?
    setError("");
    setIsLoading(true);

    try {
      console.log("[LoginPage] Getting students records..."); // <-- לוג 2
      const students = getRecords("students");
      console.log(`[LoginPage] Found ${students ? students.length : 0} students.`); // <-- לוג 3

      if (!students || students.length === 0) {
         console.error("[LoginPage] No student data found."); // <-- לוג שגיאה 1
         throw new Error("No student data found. Please seed the data.");
      }

      console.log(`[LoginPage] Hashing password for user: ${formData.username}`); // <-- לוג 4
      const hashedInputPassword = await hashPassword(formData.password);
      console.log("[LoginPage] Password hashed."); // <-- לוג 5

      console.log("[LoginPage] Finding matching student..."); // <-- לוג 6
      const matchedStudent = students.find(
        (student) =>
          student.username === formData.username &&
          student.password === hashedInputPassword
      );
      console.log("[LoginPage] Matched student:", matchedStudent); // <-- לוג 7: האם נמצא סטודנט?

      if (matchedStudent) {
        console.log("[LoginPage] Student matched! Calling login function from context..."); // <-- לוג 8
        // --- קריאה לקונטקסט ---
        login(matchedStudent); // הפונקציה הזו צריכה להדפיס לוגים משלה
        // ----------------------
        console.log("[LoginPage] Context login function called. Navigating to /home..."); // <-- לוג 9
        navigate("/home");
      } else {
        console.warn("[LoginPage] Invalid username or password."); // <-- לוג אזהרה
        setError("Invalid username or password.");
      }
    } catch (err) {
        console.error("[LoginPage] ERROR in handleLogin:", err); // <-- לוג שגיאה 2
        setError(err.message || "An error occurred during login.");
    } finally {
      console.log("[LoginPage] handleLogin FINALLY block."); // <-- לוג 10
      setIsLoading(false);
    }
    console.log("[LoginPage] handleLogin END"); // <-- לוג 11
  };

  return (
    <Box
      maxWidth={400}
      mx="auto"
      mt={10}
      p={4}
      border="1px solid #ccc"
      borderRadius={2}
      boxShadow={3}
      component="form" // Make it a form element for accessibility
      onSubmit={handleLogin} // Handle submission via onSubmit
    >
      <Typography variant="h5" mb={2} textAlign="center">
        Login
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          fullWidth
          required // Add basic HTML validation
          disabled={isLoading} // Disable input while loading
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          required // Add basic HTML validation
          disabled={isLoading} // Disable input while loading
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          variant="contained"
          fullWidth
          type="submit" // Use type="submit"
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? <CircularProgress size={24} /> : "Login"}
        </Button>
      </Stack>
    </Box>
  );
}