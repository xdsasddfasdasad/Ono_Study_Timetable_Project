import React, { useState, useEffect } from "react";
import {
  TextField,
  Stack,
  Button,
  Alert,
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import { hashPassword } from "../../utils/hash";
import { validateStudentForm } from "../../utils/validateForm";

const EditStudentFormModal = ({ open, onClose, student, onSave, existingStudents = [] }) => {
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    password: "", // סיסמה חדשה אופציונלית
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    if (student) {
      setFormData({
        id: student.id || "",
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        email: student.email || "",
        username: student.username || "",
        phone: student.phone || "",
        password: "", // שדה ריק עד שהמשתמש מזין
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const others = existingStudents.filter((s) => s.id !== student.id);
    const validationErrors = validateStudentForm(formData, others, { skipPassword: true });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setGeneralError("Please fix the errors before saving.");
      return;
    }

    const updatedStudent = {
      ...student,
      ...formData,
    };

    if (formData.password?.trim()) {
      updatedStudent.password = await hashPassword(formData.password);
    } else {
      delete updatedStudent.password;
    }

    if (onSave) onSave(updatedStudent);

    setErrors({});
    setGeneralError("");
    onClose();
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title="Edit Student"
      actions={
        <Button variant="contained" onClick={handleSubmit}>
          Save Changes
        </Button>
      }
    >
      <Stack spacing={2} mt={1}>
        {generalError && <Alert severity="error">{generalError}</Alert>}

        <TextField label="Student ID" name="id" value={formData.id}
          onChange={handleChange} error={!!errors.id} helperText={errors.id} fullWidth />

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

        <TextField label="New Password" name="password" type="password" value={formData.password} 
          onChange={handleChange} fullWidth />
      </Stack>
    </PopupModal>
  );
};

export default EditStudentFormModal;
