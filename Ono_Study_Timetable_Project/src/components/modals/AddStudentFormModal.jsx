import React, { useState } from "react";
import {
  TextField,
  Stack,
  Button,
} from "@mui/material";
import PopupModal from "../UI/PopupModal";

const AddStudentFormModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // בעתיד: הוספה ל־firebase או context
    if (onSave) onSave(formData);
    onClose();
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title="Add New Student"
      actions={
        <Button variant="contained" onClick={handleSubmit}>
          Save
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

export default AddStudentFormModal;
