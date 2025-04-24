import React, { useEffect, useState } from "react";
import { TextField, Stack, Button, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CustomButton from "../UI/CustomButton";
import { validateEventForm } from "../../utils/validateForm";

export default function TimeTableCalendarManageModal({
  open,
  onClose,
  onSave,
  onDelete,
  selectedEvent,
  defaultDate,
}) {
  const [formData, setFormData] = useState({
    eventCode: "",
    eventName: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    type: "event", // could be event/holiday/vacation etc.
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedEvent) {
      const date = selectedEvent.start?.toISOString().split("T")[0];
      const startTime = selectedEvent.start?.toTimeString().slice(0, 5);
      const endTime = selectedEvent.end?.toTimeString().slice(0, 5);
      setFormData({
        ...selectedEvent,
        date,
        startTime,
        endTime,
      });
    } else if (defaultDate) {
      setFormData((prev) => ({
        ...prev,
        date: defaultDate.toISOString().split("T")[0],
      }));
    }
  }, [selectedEvent, defaultDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const validationErrors = validateEventForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const normalized = {
      ...formData,
      start: new Date(`${formData.date}T${formData.startTime}`),
      end: new Date(`${formData.date}T${formData.endTime}`),
    };

    onSave(normalized);
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title={selectedEvent ? "Edit Event" : "Add New Event"}
      actions={
        <>
          {selectedEvent && (
            <Button color="error" onClick={() => onDelete(selectedEvent)}>
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <CustomButton onClick={handleSubmit}>Save</CustomButton>
        </>
      }
    >
      <Stack spacing={2}>
        <TextField
          label="Event Code"
          name="eventCode"
          value={formData.eventCode}
          onChange={handleChange}
          error={!!errors.eventCode}
          helperText={errors.eventCode}
          fullWidth
        />
        <TextField
          label="Event Name"
          name="eventName"
          value={formData.eventName}
          onChange={handleChange}
          error={!!errors.eventName}
          helperText={errors.eventName}
          fullWidth
        />
        <TextField
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          error={!!errors.date}
          helperText={errors.date}
          fullWidth
        />
        <Stack direction="row" spacing={2}>
          <TextField
            label="Start Time"
            name="startTime"
            type="time"
            value={formData.startTime}
            onChange={handleChange}
            error={!!errors.startTime}
            helperText={errors.startTime}
            fullWidth
          />
          <TextField
            label="End Time"
            name="endTime"
            type="time"
            value={formData.endTime}
            onChange={handleChange}
            error={!!errors.endTime}
            helperText={errors.endTime}
            fullWidth
          />
        </Stack>
        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={2}
        />
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            name="type"
            value={formData.type}
            label="Type"
            onChange={handleChange}
          >
            <MenuItem value="event">Event</MenuItem>
            <MenuItem value="holiday">Holiday</MenuItem>
            <MenuItem value="vacation">Vacation</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </PopupModal>
  );
}
