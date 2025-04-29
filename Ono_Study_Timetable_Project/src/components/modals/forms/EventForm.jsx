import React, { useState, useEffect } from "react";
import { TextField, Stack, FormControlLabel, Checkbox, Box, Typography } from "@mui/material";
import { validateEventForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function EventForm({ formData, onChange, errors, onClose, onSave }) {
  const [localForm, setLocalForm] = useState({
    eventCode: "",
    eventName: "",
    startDate: "",
    endDate: "",
    allDay: true,
    startHour: "00:00",
    endHour: "23:59",
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (formData) {
      setLocalForm((prev) => ({
        ...prev,
        ...formData,
        allDay: formData.allDay === true || formData.allDay === "True" || formData.allDay === "true", // Normalize
        startHour: formData.startHour || "00:00",
        endHour: formData.endHour || "23:59",
      }));
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setLocalForm((prev) => ({ ...prev, [name]: newValue }));
    if (onChange) onChange(e);
  };

  const handleSubmit = () => {
    const validationErrors = validateEventForm(localForm);
    setLocalErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("events", localForm);

    if (onSave) onSave(localForm);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Event Code"
        name="eventCode"
        value={localForm.eventCode}
        onChange={handleChange}
        error={!!localErrors.eventCode}
        helperText={localErrors.eventCode}
        fullWidth
      />
      <TextField
        label="Event Name"
        name="eventName"
        value={localForm.eventName}
        onChange={handleChange}
        error={!!localErrors.eventName}
        helperText={localErrors.eventName}
        fullWidth
      />

      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={localForm.allDay}
              onChange={handleChange}
              name="allDay"
            />
          }
          label="All Day Event"
        />
      </Box>

      <TextField
        label="Start Date"
        name="startDate"
        type="date"
        value={localForm.startDate}
        onChange={handleChange}
        error={!!localErrors.startDate}
        helperText={localErrors.startDate}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        label="End Date"
        name="endDate"
        type="date"
        value={localForm.endDate}
        onChange={handleChange}
        error={!!localErrors.endDate}
        helperText={localErrors.endDate}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />

      {!localForm.allDay && (
        <>
          <TextField
            label="Start Hour"
            name="startHour"
            type="time"
            value={localForm.startHour}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="End Hour"
            name="endHour"
            type="time"
            value={localForm.endHour}
            onChange={handleChange}
            fullWidth
          />
        </>
      )}

      <CustomButton onClick={handleSubmit}>Save Event</CustomButton>
    </Stack>
  );
}
