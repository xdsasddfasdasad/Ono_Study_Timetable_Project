import React, { useState, useEffect } from "react";
import {
  TextField,
  Stack,
  Button,
} from "@mui/material";
import PopupModal from "../UI/PopupModal";

const EditStudentFormModal = ({ open, onClose, student, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // טען את הנתונים לתוך הטופס כשנפתח
  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        email: student.email || "",
        phone: student.phone || "",
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (onSave) onSave({ ...formData, id: student?.id });
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
        <TextField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
        />
      </Stack>
    </PopupModal>
  );
};

export default EditStudentFormModal;
