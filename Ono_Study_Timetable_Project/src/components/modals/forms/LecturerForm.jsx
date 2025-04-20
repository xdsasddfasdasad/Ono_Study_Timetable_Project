import React from "react";
import { TextField, Stack } from "@mui/material";
import { validateLecturerForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function LecturerForm({ formData, onChange, errors, onClose, onSave }) {
  const handleSubmit = () => {
    const validationErrors = validateLecturerForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("lecturers", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Lecturer ID"
        name="id"
        value={formData.id}
        onChange={onChange}
        error={!!errors.id}
        helperText={errors.id}
        fullWidth
      />
      <TextField
        label="Lecturer Name"
        name="name"
        value={formData.name}
        onChange={onChange}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
      />
      <CustomButton onClick={handleSubmit}>Save Lecturer</CustomButton>
    </Stack>
  );
}
