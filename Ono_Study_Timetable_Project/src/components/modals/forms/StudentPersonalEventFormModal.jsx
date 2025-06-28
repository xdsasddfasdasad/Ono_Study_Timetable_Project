// src/components/modals/StudentPersonalEventFormModal.jsx
// NOTE: The filename includes "Modal" which is accurate, as this is a complete modal component,
// not just a reusable form part.

import React, { useEffect, useState } from "react";
// Imports Material-UI components for building the form inside the modal.
import {
  TextField, Stack, Button, FormControlLabel, Checkbox, Alert, Box,
  DialogActions, DialogContent,
} from "@mui/material";
// Imports a generic, reusable modal wrapper component.
import PopupModal from "../../UI/PopupModal";

// This is a "smart" component that encapsulates the entire logic for a modal
// used to add or edit a student's personal event. It manages its own form state.
// Props:
// - open: A boolean that controls the visibility of the modal.
// - onClose: A callback function to close the modal.
// - onSave: A callback function that is triggered on form submission, passing the form data.
// - onDelete: A callback for deleting an event (only visible in edit mode).
// - initialData: An object with existing event data. If present, the modal is in "edit" mode.
// - defaultDate: A default date to populate the form with when adding a new event.
// - errorMessage: A general error message string to display at the top of the modal.
// - validationErrors: An object containing field-specific validation errors.
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
  // This component manages its own state for the form fields.
  const [formData, setFormData] = useState({
    eventCode: '',
    eventName: '',
    notes: '',
    startDate: '',
    allDay: false,
    startHour: '09:00',
    endHour: '10:00',
  });

  // The useEffect hook is used to initialize or reset the form state whenever the modal is opened.
  // This is a critical pattern for modal forms.
  useEffect(() => {
    // Only run the logic when the modal is opened.
    if (open) {
      if (initialData) { // This condition means we are in "edit" mode.
        // Populate the form with the existing data from the event being edited.
        setFormData({
          eventCode: initialData.eventCode || '',
          eventName: initialData.eventName || '',
          notes: initialData.notes || '',
          startDate: initialData.startDate || '',
          allDay: initialData.allDay || false,
          // Conditionally set time fields to avoid showing "09:00" for all-day events.
          startHour: initialData.allDay ? '' : (initialData.startHour || '09:00'),
          endHour: initialData.allDay ? '' : (initialData.endHour || '10:00'),
        });
      } else { // This means we are in "add" mode.
        // Reset the form to its default state.
        setFormData({
          eventCode: '',
          eventName: '',
          notes: '',
          // Use the provided default date, or fallback to today's date.
          startDate: defaultDate || new Date().toISOString().split('T')[0],
          allDay: false,
          startHour: '09:00',
          endHour: '10:00',
        });
      }
    }
    // This hook depends on these props to re-initialize correctly if they change while the modal is open.
  }, [open, initialData, defaultDate]);

  // A single, generic change handler for all form inputs.
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Determine the new value based on the input type (checkbox vs. others).
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: val,
      // A special case: if the 'allDay' checkbox is ticked, immediately clear the time fields.
      ...(name === 'allDay' && val === true && { startHour: '', endHour: '' }),
    }));
  };

  // The submit handler for the form.
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default browser form submission.
    // Call the parent's onSave function, passing the current form state.
    if (onSave) onSave(formData);
  };

  // The click handler for the delete button.
  const handleDeleteClick = () => {
    // Call the parent's onDelete function, passing the event's unique identifier.
    if (onDelete && formData.eventCode) onDelete(formData.eventCode);
  };

  // Helper function to get a specific field's validation error.
  const getFieldError = (fieldName) => validationErrors?.[fieldName];

  return (
    // The PopupModal component provides the generic modal structure (dialog box, title, close button).
    <PopupModal
      open={open}
      onClose={onClose}
      title={initialData?.eventCode ? "Edit Personal Event" : "Add Personal Event"}
    >
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* Display a general error message if one is provided. */}
          {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField name="eventName" label="Event Name" value={formData.eventName} onChange={handleChange} error={!!getFieldError('eventName')} helperText={getFieldError('eventName') || ' '} fullWidth required autoFocus />
            <TextField name="startDate" label="Date" type="date" value={formData.startDate} onChange={handleChange} error={!!getFieldError('startDate')} helperText={getFieldError('startDate') || ' '} fullWidth required InputLabelProps={{ shrink: true }} />
            <FormControlLabel control={<Checkbox checked={formData.allDay} onChange={handleChange} name="allDay" />} label="All Day Event" />
            
            {/* The time input fields are only rendered if 'allDay' is false. */}
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
          {/* The Delete button is only shown in edit mode. */}
          {initialData?.eventCode && (<Button color="error" onClick={handleDeleteClick} variant="outlined">Delete</Button>)}
          {/* This empty Box is a spacer to push the other buttons to the right. */}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} variant="text">Cancel</Button>
          <Button type="submit" variant="contained">{initialData?.eventCode ? "Update Event" : "Save Event"}</Button>
        </DialogActions>
      </form>
    </PopupModal>
  );
};

export default StudentPersonalEventFormModal;