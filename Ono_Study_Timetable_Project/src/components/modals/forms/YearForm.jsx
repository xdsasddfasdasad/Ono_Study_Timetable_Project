import React from "react";
import { TextField, Stack } from "@mui/material";
import { validateYearForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function YearForm({ formData, onChange, errors, onClose, onSave }) {
  const handleSubmit = () => {
    const validationErrors = validateYearForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("years", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Year Code"
        name="yearCode"
        value={formData.yearCode}
        onChange={onChange}
        error={!!errors.yearCode}
        helperText={errors.yearCode}
        fullWidth
      />
      <TextField
        label="Year Number"
        name="yearNumber"
        value={formData.yearNumber}
        onChange={onChange}
        error={!!errors.yearNumber}
        helperText={errors.yearNumber}
        fullWidth
      />
      <CustomButton onClick={handleSubmit}>Save Year</CustomButton>
    </Stack>
  );
}
