import React from "react";
import { TextField, Stack } from "@mui/material";
import { validateVacationForm } from "../../../utils/validateForm";
import { getRecords, saveRecords } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function VacationForm({ formData, onChange, errors, onClose, onSave }) {
  const handleSubmit = () => {
    const validationErrors = validateVacationForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    const vacationCode = formData.vacationCode || `V${Date.now()}`;

    const newVacation = {
      ...formData,
      vacationCode,
    };

    // 1. Save into "vacations"
    const vacations = getRecords("vacations");
    const updatedVacations = vacations.filter((v) => v.vacationCode !== vacationCode);
    saveRecords("vacations", [...updatedVacations, newVacation]);

    // 2. Save into "allEvents"
    const allEvents = getRecords("allEvents");
    const newVacationEvent = {
      id: vacationCode,
      title: formData.vacationName,
      type: "vacation",
      start: `${formData.startDate}T00:00`,
      end: `${formData.endDate}T23:59`,
      allDay: true,
    };
    const updatedEvents = allEvents.filter((e) => e.id !== vacationCode);
    saveRecords("allEvents", [...updatedEvents, newVacationEvent]);

    if (onSave) onSave();  // Notify calendar
    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Vacation Name"
        name="vacationName"
        value={formData.vacationName || ""}
        onChange={onChange}
        error={!!errors.vacationName}
        helperText={errors.vacationName}
        fullWidth
      />
      <TextField
        label="Start Date"
        name="startDate"
        type="date"
        value={formData.startDate || ""}
        onChange={onChange}
        error={!!errors.startDate}
        helperText={errors.startDate}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        label="End Date"
        name="endDate"
        type="date"
        value={formData.endDate || ""}
        onChange={onChange}
        error={!!errors.endDate}
        helperText={errors.endDate}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <CustomButton onClick={handleSubmit}>Save Vacation</CustomButton>
    </Stack>
  );
}
