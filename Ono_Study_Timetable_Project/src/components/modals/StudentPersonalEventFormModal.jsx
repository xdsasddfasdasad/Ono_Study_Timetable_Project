import React, { useState } from "react";
import { TextField, Stack, Button } from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CustomButton from "../UI/CustomButton";
import { validatePersonalEventForm } from "../../utils/validateForm";

const StudentPersonalEventFormModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const validationErrors = validatePersonalEventForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (onSave) onSave(formData);
    onClose();
    setFormData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
    });
    setErrors({});
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title="Add Personal Event"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <CustomButton onClick={handleSubmit}>Save</CustomButton>
        </>
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
