import React, { useState } from "react";
import { TextField, Box, Stack } from "@mui/material";
import CustomButton from "../../UI/CustomButton";
import FormWrapper from "../../UI/FormWrapper";
import { validateStudentForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";

export default function AddStudentFormModal({ onClose, onSave, existingStudents }) {
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    const validationErrors = validateStudentForm(formData, existingStudents);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const { confirmPassword, ...studentData } = formData; // remove confirmPassword field

    saveRecord("students", studentData);
    onSave();
    onClose();
  };

  return (
    <FormWrapper title="Add Student">
      <Stack spacing={2}>
        <TextField
          label="ID"
          name="id"
          value={formData.id}
          onChange={handleChange}
          error={!!errors.id}
          helperText={errors.id}
        />
        <TextField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={!!errors.firstName}
          helperText={errors.firstName}
        />
        <TextField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={!!errors.lastName}
          helperText={errors.lastName}
        />
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
        />
        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
        />

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <CustomButton onClick={onClose}>Cancel</CustomButton>
          <CustomButton onClick={handleSubmit}>Save</CustomButton>
        </Box>
      </Stack>
    </FormWrapper>
  );
}
