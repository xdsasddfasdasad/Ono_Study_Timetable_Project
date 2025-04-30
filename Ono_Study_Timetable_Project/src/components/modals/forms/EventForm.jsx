import React, { useEffect, useState } from "react";
import {TextField, Stack, FormControlLabel, Checkbox,} from "@mui/material";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";

export default function EventForm({
  formData = {},
  onChange,
  errors = {},
  mode = "add",
}) {
  const [local, setLocal] = useState({
    eventName: "",
    startDate: "",
    endDate: "",
    allDay: true,
    startHour: "00:00",
    endHour: "23:59",
  });

  useEffect(() => {
    setLocal({
      eventName: formData.eventName || "",
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      allDay:
        formData.allDay === true ||
        formData.allDay === "true" ||
        formData.allDay === "True",
      startHour: formData.startHour || "00:00",
      endHour: formData.endHour || "23:59",
    });
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setLocal((prev) => ({ ...prev, [name]: newValue }));
    onChange?.({ target: { name, value: newValue } });
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Event Name"
        name="eventName"
        value={local.eventName}
        onChange={handleChange}
        error={!!errors.eventName}
        helperText={errors.eventName}
        fullWidth
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={local.allDay}
            onChange={handleChange}
            name="allDay"
          />
        }
        label="All Day Event"
      />

      <TextField
        label="Start Date"
        name="startDate"
        type="date"
        value={local.startDate}
        onChange={handleChange}
        error={!!errors.startDate}
        helperText={errors.startDate}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />

      <TextField
        label="End Date"
        name="endDate"
        type="date"
        value={local.endDate}
        onChange={handleChange}
        error={!!errors.endDate}
        helperText={errors.endDate}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />

      {!local.allDay && (
        <>
          <TextField
            label="Start Hour"
            name="startHour"
            type="time"
            value={local.startHour}
            onChange={handleChange}
            error={!!errors.startHour}
            helperText={errors.startHour}
            fullWidth
          />
          <TextField
            label="End Hour"
            name="endHour"
            type="time"
            value={local.endHour}
            onChange={handleChange}
            error={!!errors.endHour}
            helperText={errors.endHour}
            fullWidth
          />
        </>
      )}
    </Stack>
  );
}
