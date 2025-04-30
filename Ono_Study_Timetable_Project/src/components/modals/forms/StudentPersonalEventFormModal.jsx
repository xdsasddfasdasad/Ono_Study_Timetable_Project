// /components/modals/forms/StudentPersonalEventFormModal.jsx

import React, { useEffect, useState } from "react";
import { TextField, Stack, Button } from "@mui/material";
import PopupModal from "../../UI/PopupModal";
import CustomButton from "../../UI/CustomButton";
import { validatePersonalEventForm } from "../../../utils/validateForm";
import { getRecords, saveRecord } from "../../../utils/storage";

const EVENT_STORAGE_KEY = "studentEvents";

const StudentPersonalEventFormModal = ({
  open,
  onClose,
  onSave,
  defaultDate,
  selectedEvent,
}) => {
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedEvent) {
      const start = new Date(selectedEvent.start);
      const end = new Date(selectedEvent.end);

      setFormData({
        id: selectedEvent.id || "",
        title: selectedEvent.title || "",
        date: start.toISOString().split("T")[0],
        startTime: start.toISOString().substring(11, 16),
        endTime: end.toISOString().substring(11, 16),
        description: selectedEvent.description || "",
      });
    } else if (defaultDate) {
      const dateStr = new Date(defaultDate).toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, date: dateStr }));
    }
  }, [defaultDate, selectedEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = () => {
    const validationErrors = validatePersonalEventForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);

    const updatedEvent = {
      ...formData,
      title: formData.title.trim(),
      start,
      end,
      type: "studentEvent", // mark explicitly for rendering logic
      allDay: false,
    };

    const existing = getRecords(EVENT_STORAGE_KEY) || [];

    if (formData.id) {
      // Edit mode
      const updated = existing.map((ev) =>
        ev.id === formData.id ? updatedEvent : ev
      );
      localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(updated));
    } else {
      // Add mode
      updatedEvent.id = `SE${Date.now()}`;
      localStorage.setItem(
        EVENT_STORAGE_KEY,
        JSON.stringify([...existing, updatedEvent])
      );
    }

    onSave?.();
    onClose?.();
  };

  const handleDelete = () => {
    if (!formData.id) return;
    const existing = getRecords(EVENT_STORAGE_KEY) || [];
    const updated = existing.filter((ev) => ev.id !== formData.id);
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(updated));
    onSave?.();
    onClose?.();
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title={formData.id ? "Edit Personal Event" : "Add Personal Event"}
      actions={
        <Stack direction="row" spacing={2}>
          {formData.id && (
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <CustomButton onClick={handleSubmit}>
            {formData.id ? "Update" : "Save"}
          </CustomButton>
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
