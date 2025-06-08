// src/components/modals/forms/StudentPersonalEventFormModal.jsx

import React, { useEffect, useState } from "react";
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
  // State uses Firestore-compatible field names
  const [formData, setFormData] = useState({
    eventCode: '',
    eventName: '',
    notes: '',
    startDate: '',
    allDay: false,
    startHour: '09:00',
    endHour: '10:00',
  });

  useEffect(() => {
    if (open) {
      if (initialData) { // For editing
        setFormData({
          eventCode: initialData.eventCode || '',
          eventName: initialData.eventName || '',
          notes: initialData.notes || '',
          startDate: initialData.startDate || '',
          allDay: initialData.allDay || false,
          startHour: initialData.allDay ? '' : (initialData.startHour || '09:00'),
          endHour: initialData.allDay ? '' : (initialData.endHour || '10:00'),
        });
      } else { // For adding
        setFormData({
          eventCode: '',
          eventName: '',
          notes: '',
          startDate: defaultDate || new Date().toISOString().split('T')[0],
          allDay: false,
          startHour: '09:00',
          endHour: '10:00',
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
      ...(name === 'allDay' && val === true && { startHour: '', endHour: '' }),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave(formData);
  };

  const handleDeleteClick = () => {
    if (onDelete && formData.eventCode) onDelete(formData.eventCode);
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
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField name="eventName" label="Event Name" value={formData.eventName} onChange={handleChange} error={!!getFieldError('eventName')} helperText={getFieldError('eventName') || ' '} fullWidth required autoFocus />
              <TextField name="startDate" label="Date" type="date" value={formData.startDate} onChange={handleChange} error={!!getFieldError('startDate')} helperText={getFieldError('startDate') || ' '} fullWidth required InputLabelProps={{ shrink: true }} />
              <FormControlLabel control={<Checkbox checked={formData.allDay} onChange={handleChange} name="allDay" />} label="All Day Event" />
              {!formData.allDay && (
                  <Stack direction="row" spacing={2}>
                      <TextField name="startHour" label="Start Time" type="time" value={formData.startHour} onChange={handleChange} error={!!getFieldError('startHour')} helperText={getFieldError('startHour') || ' '} fullWidth required={!formData.allDay} InputLabelProps={{ shrink: true }} />
                      <TextField name="endHour" label="End Time" type="time" value={formData.endHour} onChange={handleChange} error={!!getFieldError('endHour')} helperText={getFieldError('endHour') || ' '} fullWidth required={!formData.allDay} InputLabelProps={{ shrink: true }} />
                  </Stack>
              )}
              <TextField name="notes" label="Notes" value={formData.notes} onChange={handleChange} multiline rows={3} fullWidth helperText={' '} />
            </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
            {initialData?.eventCode && (<Button color="error" onClick={handleDeleteClick} variant="outlined">Delete</Button>)}
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={onClose} variant="text">Cancel</Button>
            <Button type="submit" variant="contained">{initialData?.eventCode ? "Update Event" : "Save Event"}</Button>
        </DialogActions>
      </form>
    </PopupModal>
  );
};

export default StudentPersonalEventFormModal;