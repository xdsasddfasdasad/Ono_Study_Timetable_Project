import React from "react";
import { TextField, Stack } from "@mui/material";
import { validateVacationForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function VacationForm({ formData, onChange, errors, onClose, onSave }) {
  const handleSubmit = () => {
    const validationErrors = validateVacationForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("vacations", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Vacation Code"
        name="vacationCode"
        value={formData.vacationCode}
        onChange={onChange}
        error={!!errors.vacationCode}
        helperText={errors.vacationCode}
        fullWidth
      />
      <TextField
        label="Vacation Name"
        name="vacationName"
        value={formData.vacationName}
        onChange={onChange}
        error={!!errors.vacationName}
        helperText={errors.vacationName}
        fullWidth
      />
      <TextField
        label="Start Date"
        name="startDate"
        type="date"
        value={formData.startDate}
        onChange={onChange}
        error={!!errors.startDate}
        helperText={errors.startDate}
        fullWidth
      />
      <TextField
        label="End Date"
        name="endDate"
        type="date"
        value={formData.endDate}
        onChange={onChange}
        error={!!errors.endDate}
        helperText={errors.endDate}
        fullWidth
      />
      <CustomButton onClick={handleSubmit}>Save Vacation</CustomButton>
    </Stack>
  );
}
