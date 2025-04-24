import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { hashPassword } from "../utils/hash"; // ✅ Make sure this path is correct

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    const students = JSON.parse(localStorage.getItem("students")) || [];

    const hashedInputPassword = await hashPassword(formData.password);

    const matched = students.find(
      (student) =>
        student.username === formData.username &&
        student.password === hashedInputPassword
    );

    if (matched) {
      localStorage.setItem("loggedInStudent", JSON.stringify(matched));
      navigate("/home");
    } else {
      setError("Invalid username or password.");
    }
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
    >
      <Typography variant="h5" mb={2}>
        Login
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button variant="contained" fullWidth onClick={handleLogin}>
          Login
        </Button>
      </Stack>
    </Box>
  );
}
