// src/components/modals/forms/CourseMeetingInstanceForm.jsx

import React from 'react';
// Imports Material-UI components for building the form layout.
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Box
} from '@mui/material';

// This is a crucial helper function to format a date value for a native HTML 'datetime-local' input.
// These inputs are notoriously tricky because they require a specific string format (YYYY-MM-DDTHH:mm)
// and operate in the user's local timezone, while data from a server (like Firestore) is usually in UTC.
const formatDateTimeForInput = (dateValue) => {
    // If the initial value is empty, return an empty string.
    if (!dateValue) return '';

    try {
        // First, convert the input value to a standard JavaScript Date object.
        // The key part is checking for `.toDate`, which is the method used to convert
        // a Firestore Timestamp object into a JS Date. Otherwise, we assume it's a string or other date format.
        const dateObj = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);

        // If the resulting date is invalid, return an empty string to prevent errors.
        if (isNaN(dateObj.getTime())) return '';

        // This is the timezone correction. `toISOString()` returns a UTC string. A 'datetime-local' input
        // needs a string representing the user's *local* time. We calculate the user's timezone offset
        // in minutes, convert it to milliseconds, and adjust the date object's time value accordingly
        // before converting it to an ISO string. This ensures the time displayed in the input matches the actual local time.
        const offset = dateObj.getTimezoneOffset();
        const adjustedDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
        
        // Finally, convert the adjusted date to an ISO string and slice it to the format
        // required by the 'datetime-local' input (YYYY-MM-DDTHH:mm).
        return adjustedDate.toISOString().slice(0, 16);
    } catch (error) {
        // Log any unexpected errors and return an empty string as a fallback.
        console.error("Failed to format date:", dateValue, error);
        return "";
    }
};

// This is a controlled form component for editing the details of a single course meeting instance.
// It's wrapped in `React.memo` as a performance optimization. This prevents the component from re-rendering
// if its props (formData, errors, etc.) have not changed.
const CourseMeetingInstanceForm = React.memo(({
    formData,
    errors,
    onChange,
    mode, // 'add' or 'edit'
    selectOptions
}) => {
    // Destructure the dropdown options from props with a fallback to empty arrays.
    const { lecturers = [], rooms = [] } = selectOptions || {};

    return (
        <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={3}>
                {/* Meeting Title Field */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        required
                        name="title"
                        label="Meeting Title"
                        value={formData.title || ''}
                        onChange={onChange}
                        error={!!errors.title}
                        helperText={errors.title || 'Example: "Introduction to React Hooks"'}
                    />
                </Grid>

                {/* Start and End Time Fields */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth required name="start" label="Start Time" type="datetime-local"
                        value={formatDateTimeForInput(formData.start)} onChange={onChange} error={!!errors.start}
                        helperText={errors.start} InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth required name="end" label="End Time" type="datetime-local"
                        value={formatDateTimeForInput(formData.end)} onChange={onChange} error={!!errors.end}
                        helperText={errors.end} InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                {/* Lecturer and Room Selection */}
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.lecturerId}>
                        <InputLabel>Lecturer</InputLabel>
                        <Select
                            name="lecturerId"
                            value={formData.lecturerId || ''} label="Lecturer" onChange={onChange}
                        >
                            <MenuItem value="" disabled><em>Select a lecturer...</em></MenuItem>
                            {lecturers.map((option, index) => (
                                <MenuItem key={`${option.value}-${index}`} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                        {errors.lecturerId && <FormHelperText>{errors.lecturerId}</FormHelperText>}
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.roomCode}>
                        <InputLabel>Room</InputLabel>
                        <Select
                            name="roomCode"
                            value={formData.roomCode || ''} label="Room" onChange={onChange}
                        >
                            <MenuItem value="" disabled><em>Select a room...</em></MenuItem>
                            {rooms.map((option, index) => (
                                <MenuItem key={`${option.value}-${index}`} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                        {errors.roomCode && <FormHelperText>{errors.roomCode}</FormHelperText>}
                    </FormControl>
                </Grid>

                {/* Optional Zoom Meeting Link Field */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        name="zoomMeetinglink"
                        label="Zoom Meeting Link"
                        value={formData.zoomMeetinglink || ''}
                        onChange={onChange}
                        error={!!errors.zoomMeetinglink}
                        helperText={errors.zoomMeetinglink}
                        placeholder="https://example.zoom.us/j/1234567890"
                    />
                </Grid>

                {/* Optional Notes Field */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        name="notes"
                        label="Notes"
                        multiline // Allows for multiple lines of text.
                        rows={3}   // Sets the initial height.
                        value={formData.notes || ''}
                        onChange={onChange}
                        error={!!errors.notes}
                        helperText={errors.notes}
                        placeholder="Add any relevant notes for this specific meeting."
                    />
                </Grid>

                {/* Read-only fields to provide context about the parent course */}
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth disabled name="courseCode" label="Parent Course Code"
                        value={formData.courseCode || 'N/A'} variant="filled"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth disabled name="semesterCode" label="Parent Semester Code"
                        value={formData.semesterCode || 'N/A'} variant="filled"
                    />
                </Grid>
            </Grid>
        </Box>
    );
});

export default CourseMeetingInstanceForm;