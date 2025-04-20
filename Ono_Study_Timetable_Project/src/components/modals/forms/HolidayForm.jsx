import React from "react";
import { TextField, Stack } from "@mui/material";
import { validateHolidayForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function HolidayForm({ formData, onChange, errors, onClose, onSave }) {
  const handleSubmit = () => {
    const validationErrors = validateHolidayForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("holidays", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Holiday Code"
        name="holidayCode"
        value={formData.holidayCode}
        onChange={onChange}
        error={!!errors.holidayCode}
        helperText={errors.holidayCode}
        fullWidth
      />
      <TextField
        label="Holiday Name"
        name="holidayName"
        value={formData.holidayName}
        onChange={onChange}
        error={!!errors.holidayName}
        helperText={errors.holidayName}
        fullWidth
      />
      <TextField
        label="Date"
        name="date"
        type="date"
        value={formData.date}
        onChange={onChange}
        error={!!errors.date}
        helperText={errors.date}
        fullWidth
      />
      <CustomButton onClick={handleSubmit}>Save Holiday</CustomButton>
    </Stack>
  );
}
