import React, { useState } from "react";
import {
  TextField,
  Stack,
  Button,
  Alert,
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import { hashPassword } from "../../utils/hash";
import { validateStudentForm } from "../../utils/validateForm";

const AddStudentFormModal = ({ open, onClose, onSave, existingStudents = [] }) => {
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateStudentForm(formData, existingStudents);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setGeneralError("Please fix the errors before submitting.");
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.password);
      const studentToSave = {
        ...formData,
        password: hashedPassword,
      };
      delete studentToSave.confirmPassword;

      if (onSave) onSave(studentToSave);

      setFormData({
        id: "",
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        phone: "",
      });
      setErrors({});
      setGeneralError("");
      onClose();
    } catch (error) {
      setGeneralError("An error occurred while processing the form.");
    }
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title="Add New Student"
      actions={<Button variant="contained" onClick={handleSubmit}>Save</Button>}
    >
      <Stack spacing={2} mt={1}>
        {generalError && <Alert severity="error">{generalError}</Alert>}

        <TextField label="Student ID" name="id" value={formData.id}
          InputProps={{ readOnly: true }} fullWidth />

        <TextField label="First Name" name="firstName" value={formData.firstName}
          onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName} fullWidth />

        <TextField label="Last Name" name="lastName" value={formData.lastName}
          onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName} fullWidth />

        <TextField label="Email" name="email" value={formData.email}
          onChange={handleChange} error={!!errors.email} helperText={errors.email} fullWidth />

        <TextField label="Phone" name="phone" value={formData.phone}
          onChange={handleChange} fullWidth />

        <TextField label="Username" name="username" value={formData.username}
          onChange={handleChange} error={!!errors.username} helperText={errors.username} fullWidth />

        <TextField label="Password" name="password" type="password" value={formData.password}
          onChange={handleChange} error={!!errors.password} helperText={errors.password} fullWidth />

        <TextField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword}
          onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword} fullWidth />
      </Stack>
    </PopupModal>
  );
};

export default AddStudentFormModal;
