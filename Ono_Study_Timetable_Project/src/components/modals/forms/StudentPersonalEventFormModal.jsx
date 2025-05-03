// /components/modals/forms/StudentPersonalEventFormModal.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  TextField, Stack, Button, FormControlLabel, Checkbox, Alert, Box, 
  DialogActions, DialogContent, DialogTitle // Use standard Dialog components
} from "@mui/material";
import PopupModal from "../../UI/PopupModal"; // Assuming this is a Dialog wrapper
import CustomButton from "../../UI/CustomButton"; // Use this or standard Button
// Removed direct import of validation/handlers/storage - parent component handles this

const StudentPersonalEventFormModal = ({
  open,
  onClose,
  onSave, // Expects function that takes formData
  onDelete, // Expects function that takes eventCode
  initialData, // Data for editing (or null for adding) - uses eventName, notes, startDate, etc.
  defaultDate, // Default date string for adding (YYYY-MM-DD)
  errorMessage, // General error message from parent
  validationErrors, // Validation errors object from parent { fieldName: 'error message' }
}) => {

  // State for form data - align field names with our main data structure
  const [formData, setFormData] = useState({
    eventCode: '', // Use eventCode as the ID
    eventName: '',
    notes: '',
    date: '', // Single date field (YYYY-MM-DD)
    allDay: false,
    startTime: '09:00', // Default start time
    endTime: '10:00',   // Default end time
  });

  // State for local errors (maybe redundant if parent passes validationErrors)
  // const [errors, setErrors] = useState({}); // Can remove if validationErrors prop is used

  // Populate form when modal opens or initialData/defaultDate changes
  useEffect(() => {
    if (open) { // Only update when modal is open
      if (initialData) {
        // EDIT MODE
        console.log("Populating modal for EDIT:", initialData);
        setFormData({
          eventCode: initialData.eventCode || initialData.id || '', // Get the correct ID
          eventName: initialData.eventName || '',
          notes: initialData.notes || '',
          date: initialData.startDate || '', // Use startDate
          allDay: initialData.allDay || false,
          startTime: initialData.allDay ? '' : (initialData.startHour || '09:00'), // Use startHour
          endTime: initialData.allDay ? '' : (initialData.endHour || '10:00'),     // Use endHour
        });
      } else {
        // ADD MODE
        console.log("Populating modal for ADD with default date:", defaultDate);
        setFormData({ // Reset form for adding
          eventCode: '',
          eventName: '',
          notes: '',
          date: defaultDate || new Date().toISOString().split('T')[0], // Use defaultDate or today
          allDay: false,
          startTime: '09:00',
          endTime: '10:00',
        });
      }
    }
  }, [open, initialData, defaultDate]); // Rerun effect when these change while open

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
      // Reset times if allDay is checked
      ...(name === 'allDay' && val === true && { startTime: '', endTime: '' }),
    }));

    // Clear validation error for this field if parent passes validationErrors
    // if (validationErrors && validationErrors[name]) {
    //   // Logic to clear parent errors might be complex, maybe just rely on next submit
    // }
  };

  // Call the onSave prop passed from the parent
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    console.log("Modal handleSubmit triggered");
    // The parent component's handleSave will perform validation and saving
    if (onSave) {
      // Pass the current formData, parent will enrich and validate
      onSave(formData);
    } else {
        console.error("onSave prop is missing from StudentPersonalEventFormModal");
    }
  };

  // Call the onDelete prop passed from the parent
  const handleDeleteClick = () => {
    console.log("Modal handleDelete triggered");
    if (onDelete && formData.eventCode) {
      onDelete(formData.eventCode); // Pass the eventCode to the parent's delete handler
    } else {
       console.error("onDelete prop or eventCode is missing");
       // Maybe show an alert here?
    }
  };

  // Helper to get error message for a field
  const getFieldError = (fieldName) => validationErrors?.[fieldName];

  return (
    // Assuming PopupModal is a wrapper around MUI Dialog or similar
    <PopupModal
      open={open}
      onClose={onClose}
      title={initialData?.eventCode ? "Edit Personal Event" : "Add Personal Event"}
    >
      {/* Use form tag for better accessibility and potential native validation */}
      <form onSubmit={handleSubmit}>
        <DialogContent> {/* Use DialogContent for standard padding */}
            {/* Display general error message */}
            {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

            <Stack spacing={2}>
            {/* Use field names matching the state: eventName, notes, date, etc. */}
            <TextField
                label="Event Name"
                name="eventName" // Changed name
                value={formData.eventName}
                onChange={handleChange}
                error={!!getFieldError('eventName')} // Use helper for validation error
                helperText={getFieldError('eventName') || ' '} // Show error or space
                fullWidth
                required // Basic required validation
                autoFocus // Focus on first field when modal opens
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
                InputLabelProps={{ shrink: true }} // Keep label shrunk for date type
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
            {/* Show time fields only if not an all-day event */}
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
                        required={!formData.allDay} // Required only if not all-day
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
                name="notes" // Changed name
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
                // No specific validation error assumed for notes for now
                helperText={' '}
            />
            </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}> {/* Standard MUI Dialog Actions padding */}
            {/* Conditionally render Delete button only in edit mode */}
            {initialData?.eventCode && (
                // Added error color and confirmation (moved confirmation to parent)
                <Button color="error" onClick={handleDeleteClick} variant="outlined">
                Delete
                </Button>
            )}
            <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
            <Button onClick={onClose} variant="text">Cancel</Button>
            {/* Use standard Button, type="submit" triggers form onSubmit */}
            <Button type="submit" variant="contained">
                {initialData?.eventCode ? "Update Event" : "Save Event"}
            </Button>
        </DialogActions>
      </form>
    </PopupModal>
  );
};

export default StudentPersonalEventFormModal;