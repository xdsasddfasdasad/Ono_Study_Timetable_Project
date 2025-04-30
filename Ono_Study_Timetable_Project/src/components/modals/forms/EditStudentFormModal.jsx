import React, { useState, useEffect } from "react";
import { TextField, Box, Stack } from "@mui/material";
import CustomButton from "../../UI/CustomButton";
import FormWrapper from "../../UI/FormWrapper";
import { validateStudentForm } from "../../../utils/validateForm";
import { updateRecord } from "../../../utils/storage";

export default function EditStudentFormModal({ studentData, onClose, onSave, existingStudents }) {
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (studentData) {
      setFormData({
        ...studentData,
        password: "", // user must input a new password if they want to change it
      });
    }
  }, [studentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    const validationErrors = validateStudentForm(formData, existingStudents, { skipPassword: !formData.password });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedStudent = { ...formData };
    if (!formData.password) {
      delete updatedStudent.password; // do not overwrite existing password if not changing
    }

    updateRecord("students", updatedStudent);
    onSave();
    onClose();
  };

  return (
    <FormWrapper title="Edit Student">
      <Stack spacing={2}>
        <TextField
          label="ID"
          name="id"
          value={formData.id}
          disabled
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
          label="New Password (optional)"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
        />

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <CustomButton onClick={onClose}>Cancel</CustomButton>
          <CustomButton onClick={handleSubmit}>Save Changes</CustomButton>
        </Box>
      </Stack>
    </FormWrapper>
  );
}
