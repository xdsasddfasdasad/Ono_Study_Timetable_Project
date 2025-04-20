import React from "react";
import { TextField, Stack } from "@mui/material";
import { validateEventForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function EventForm({ formData, onChange, errors, onClose, onSave }) {
  const handleSubmit = () => {
    const validationErrors = validateEventForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("events", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Event Code"
        name="eventCode"
        value={formData.eventCode}
        onChange={onChange}
        error={!!errors.eventCode}
        helperText={errors.eventCode}
        fullWidth
      />
      <TextField
        label="Event Name"
        name="eventName"
        value={formData.eventName}
        onChange={onChange}
        error={!!errors.eventName}
        helperText={errors.eventName}
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
      <CustomButton onClick={handleSubmit}>Save Event</CustomButton>
    </Stack>
  );
}
