// /components/modals/forms/StudentPersonalEventFormModal.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  TextField, Stack, Button, FormControlLabel, Checkbox, Alert, Box, 
  DialogActions, DialogContent,
} from "@mui/material";
import PopupModal from "../../UI/PopupModal";

const StudentPersonalEventFormModal = ({
  open,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaultDate,
  errorMessage,
  validationErrors,
}) => {
  const [formData, setFormData] = useState({
    eventCode: '',
    eventName: '',
    notes: '',
    date: '',
    allDay: false,
    startTime: '09:00',
    endTime: '10:00',
  });
  useEffect(() => {
    if (open) {
      if (initialData) {
        console.log("Populating modal for EDIT:", initialData);
        setFormData({
          eventCode: initialData.eventCode || initialData.id || '',
          eventName: initialData.eventName || '',
          notes: initialData.notes || '',
          date: initialData.startDate || '',
          allDay: initialData.allDay || false,
          startTime: initialData.allDay ? '' : (initialData.startHour || '09:00'),
          endTime: initialData.allDay ? '' : (initialData.endHour || '10:00'),
        });
      } else {
        console.log("Populating modal for ADD with default date:", defaultDate);
        setFormData({
          eventCode: '',
          eventName: '',
          notes: '',
          date: defaultDate || new Date().toISOString().split('T')[0],
          allDay: false,
          startTime: '09:00',
          endTime: '10:00',
        });
      }
    }
  }, [open, initialData, defaultDate]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: val,
      ...(name === 'allDay' && val === true && { startTime: '', endTime: '' }),
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault(); 
    console.log("Modal handleSubmit triggered");
    if (onSave) {
      onSave(formData);
    } else {
        console.error("onSave prop is missing from StudentPersonalEventFormModal");
    }
  };
  const handleDeleteClick = () => {
    console.log("Modal handleDelete triggered");
    if (onDelete && formData.eventCode) {
      onDelete(formData.eventCode);
    } else {
       console.error("onDelete prop or eventCode is missing");
    }
  };

  const getFieldError = (fieldName) => validationErrors?.[fieldName];
  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title={initialData?.eventCode ? "Edit Personal Event" : "Add Personal Event"}
    >
      <form onSubmit={handleSubmit}>
        <DialogContent> 
            {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
            <Stack spacing={2}>
            <TextField
                label="Event Name"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                error={!!getFieldError('eventName')}
                helperText={getFieldError('eventName') || ' '}
                fullWidth
                required
                autoFocus
            />
            <TextField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                error={!!getFieldError('date')}
                helperText={getFieldError('date') || ' '}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
            />
             <FormControlLabel
                control={
                    <Checkbox
                        checked={formData.allDay}
                        onChange={handleChange}
                        name="allDay"
                    />
                }
                label="All Day Event"
            />
            {!formData.allDay && (
                <Stack direction="row" spacing={2}>
                    <TextField
                        label="Start Time"
                        name="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={handleChange}
                        error={!!getFieldError('startTime')}
                        helperText={getFieldError('startTime') || ' '}
                        fullWidth
                        required={!formData.allDay}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="End Time"
                        name="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={handleChange}
                        error={!!getFieldError('endTime')}
                        helperText={getFieldError('endTime') || ' '}
                        fullWidth
                        required={!formData.allDay}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            )}
            <TextField
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth

                helperText={' '}
            />
            </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
            {initialData?.eventCode && (
                <Button color="error" onClick={handleDeleteClick} variant="outlined">
                Delete
                </Button>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={onClose} variant="text">Cancel</Button>
            <Button type="submit" variant="contained">
                {initialData?.eventCode ? "Update Event" : "Save Event"}
            </Button>
        </DialogActions>
      </form>
    </PopupModal>
  );
};

export default StudentPersonalEventFormModal;