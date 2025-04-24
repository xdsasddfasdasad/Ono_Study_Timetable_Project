import React, { useEffect, useState } from "react";
import { TextField, Stack, Button } from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CustomButton from "../UI/CustomButton";
import { validatePersonalEventForm } from "../../utils/validateForm";

const StudentPersonalEventFormModal = ({
  open,
  onClose,
  onSave,
  onDelete,
  defaultDate,
  selectedEvent,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedEvent) {
      setFormData({
        title: selectedEvent.title || "",
        date: selectedEvent.date || selectedEvent.start?.toISOString().split("T")[0] || "",
        startTime: selectedEvent.start?.toTimeString().slice(0, 5) || "",
        endTime: selectedEvent.end?.toTimeString().slice(0, 5) || "",
        description: selectedEvent.description || "",
      });
    } else if (defaultDate) {
      setFormData((prev) => ({
        ...prev,
        date: defaultDate.toISOString().split("T")[0],
      }));
    } else {
      setFormData({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        description: "",
      });
    }
    setErrors({});
  }, [selectedEvent, defaultDate, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const validationErrors = validatePersonalEventForm(formData, existingEvents);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
  
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
  
    const eventToSave = {
      ...formData,
      start,
      end,
    };
  
    onSave?.(eventToSave);  // Pass Date objects to calendar
    onClose?.();
  };
  
  const formatted = {
    ...eventToSave,
    startTime: eventToSave.start.toTimeString().slice(0, 5),
    endTime: eventToSave.end.toTimeString().slice(0, 5),
    date: eventToSave.start.toISOString().split("T")[0],
  };
  saveRecord("personalEvents", formatted);

  const handleDelete = () => {
    if (onDelete) onDelete(selectedEvent);
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title={selectedEvent ? "Edit Personal Event" : "Add Personal Event"}
      actions={
        <Stack direction="row" spacing={1}>
          {selectedEvent && (
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <CustomButton onClick={handleSubmit}>Save</CustomButton>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <TextField
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={!!errors.title}
          helperText={errors.title}
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
        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          multiline
          rows={3}
          fullWidth
        />
      </Stack>
    </PopupModal>
  );
};

export default StudentPersonalEventFormModal;
