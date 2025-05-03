// /src/pages/LoginPage.jsx
import React, { useState } from "react";
import {
  Box, Button, TextField, Typography, Stack, Alert, CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { hashPassword } from "../utils/hash";
import { useAuth } from "../context/AuthContext.jsx";
import { getRecords } from "../utils/storage";

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
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("[LoginPage] handleLogin START");
    setError("");
    setIsLoading(true);
    try {
      console.log("[LoginPage] Getting students records...");
      const students = getRecords("students");
      console.log(`[LoginPage] Found ${students ? students.length : 0} students.`);
      if (!students || students.length === 0) {
         console.error("[LoginPage] No student data found.");
         throw new Error("No student data found. Please seed the data.");
      }
      console.log(`[LoginPage] Hashing password for user: ${formData.username}`);
      const hashedInputPassword = await hashPassword(formData.password);
      console.log("[LoginPage] Password hashed.");
      console.log("[LoginPage] Finding matching student...");
      const matchedStudent = students.find(
        (student) =>
          student.username === formData.username &&
          student.password === hashedInputPassword
      );
      console.log("[LoginPage] Matched student:", matchedStudent);
      if (matchedStudent) {
        console.log("[LoginPage] Student matched! Calling login function from context...");
        login(matchedStudent);
        console.log("[LoginPage] Context login function called. Navigating to /home...");
        navigate("/home");
      } else {
        console.warn("[LoginPage] Invalid username or password.");
        setError("Invalid username or password.");
      }
    } catch (err) {
        console.error("[LoginPage] ERROR in handleLogin:", err);
        setError(err.message || "An error occurred during login.");
    } finally {
      console.log("[LoginPage] handleLogin FINALLY block.");
      setIsLoading(false);
    }
    console.log("[LoginPage] handleLogin END");
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
      component="form"
      onSubmit={handleLogin}
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
          required
          disabled={isLoading}
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
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Login"}
        </Button>
      </Stack>
    </Box>
  );
}