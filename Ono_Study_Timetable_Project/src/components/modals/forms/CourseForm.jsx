// src/components/modals/forms/CourseForm.jsx

import React from "react";
// Imports Material-UI components for building a structured and responsive form.
import {
  TextField, Stack, Box, Typography, FormControl, InputLabel, Select,
  MenuItem, FormHelperText, Grid, IconButton, Button as MuiButton
} from "@mui/material";
// Imports icons for adding and removing dynamic form fields.
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';

// A static array defining the options for the days of the week dropdown.
const daysOfWeek = [
  { value: 'Sun', label: 'Sunday' }, { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' }, { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' }, { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
];

// This is a "controlled component" for creating or editing a course.
// It does not manage its own state. Instead, it receives all its data and behavior via props,
// making it highly reusable and easy to manage from a parent component (like a modal or a page).
// Props:
// - formData: An object containing the current values for all form fields.
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit') that controls form behavior (e.g., disabling the course code field).
// - selectOptions: An object containing arrays for populating dropdowns (semesters, lecturers, rooms).
export default function CourseForm({
  formData = { hours: [{ day: '', start: '', end: '' }] }, // Default structure for a new form.
  errors = {},
  onChange,
  mode = "add",
  selectOptions = { semesters: [], lecturers: [], rooms: [] }
}) {

  // A helper function to retrieve an error message for a specific field from the errors object.
  // It can handle both top-level fields (e.g., 'courseCode') and nested fields within the 'hours' array.
  const getError = (fieldName, index = null) => {
    const key = index !== null ? `hours[${index}].${fieldName}` : fieldName;
    return errors[key];
  };

  // Destructure select options from props with a fallback to empty arrays to prevent errors.
  const semesterOptions = selectOptions?.semesters || [];
  const lecturerOptions = selectOptions?.lecturers || [];
  const roomOptions = selectOptions?.rooms || [];

  // Handles changes for fields within the dynamic 'hours' array.
  // This is a key pattern for managing nested state in React.
  const handleHourChange = (index, field, value) => {
    // Create a deep copy of the hours array to avoid direct state mutation.
    const newHours = JSON.parse(JSON.stringify(formData.hours || []));
    if (!newHours[index]) newHours[index] = {};
    // Update the specific field in the specific hour slot.
    newHours[index][field] = value;
    // Call the parent's onChange handler with the entire updated hours array.
    onChange({ target: { name: 'hours', value: newHours } });
  };

  // Adds a new, empty time slot object to the 'hours' array.
  const addHourSlot = () => {
    // Adding a unique '_key' helps React efficiently re-render the list of dynamic inputs.
    const newHours = [...(formData.hours || []), { day: '', start: '', end: '', _key: `slot_${Date.now()}` }];
    onChange({ target: { name: 'hours', value: newHours } });
  };

  // Removes a time slot from the 'hours' array at a given index.
  const removeHourSlot = (index) => {
    const newHours = (formData.hours || []).filter((_, i) => i !== index);
    // As a safeguard, if all slots are removed, add one empty slot back.
    if (newHours.length === 0) {
      newHours.push({ day: '', start: '', end: '' });
    }
    onChange({ target: { name: 'hours', value: newHours } });
  };

  // The main render output of the form.
  return (
    <Stack spacing={3}>
      {/* "Course Details" Section */}
      <Box sx={boxStyle}>
        <Typography variant="overline" component="legend" sx={legendStyle}>Course Details</Typography>
        <Grid container spacing={2} mt={0.5}>
          <Grid item xs={12} sm={6}>
            <TextField label="Course Code" name="courseCode" value={formData.courseCode || ""} onChange={onChange}
              error={!!getError('courseCode')} helperText={getError('courseCode') || ' '}
              fullWidth required
              // The course code is a unique identifier and should not be editable after creation.
              disabled={mode === 'edit'}
              variant="outlined" size="small"
              InputProps={{ readOnly: mode === 'edit' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Course Name" name="courseName" value={formData.courseName || ""} onChange={onChange}
              error={!!getError('courseName')} helperText={getError('courseName') || ' '}
              fullWidth required autoFocus={mode === 'add'} variant="outlined" size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!getError('semesterCode')} required size="small">
              <InputLabel>Semester</InputLabel>
              <Select name="semesterCode" value={formData.semesterCode || ""} onChange={onChange} label="Semester">
                <MenuItem value="" disabled><em>Select semester...</em></MenuItem>
                {semesterOptions.map((opt, index) => (<MenuItem key={`${opt.value}-${index}`} value={opt.value}>{opt.label}</MenuItem>))}
                {semesterOptions.length === 0 && <MenuItem value="" disabled>No semesters available</MenuItem>}
              </Select>
              {getError('semesterCode') && <FormHelperText>{getError('semesterCode')}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!getError('lecturerId')} required size="small">
              <InputLabel>Lecturer</InputLabel>
              <Select name="lecturerId" value={formData.lecturerId || ""} onChange={onChange} label="Lecturer">
                <MenuItem value="" disabled><em>Select lecturer...</em></MenuItem>
                {lecturerOptions.map((opt, index) => (<MenuItem key={`${opt.value}-${index}`} value={opt.value}>{opt.label}</MenuItem>))}
                {lecturerOptions.length === 0 && <MenuItem value="" disabled>No lecturers available</MenuItem>}
              </Select>
              {getError('lecturerId') && <FormHelperText>{getError('lecturerId')}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!getError('roomCode')} size="small">
              <InputLabel>Default Room (Optional)</InputLabel>
              <Select name="roomCode" value={formData.roomCode || ""} onChange={onChange} label="Default Room (Optional)">
                <MenuItem value=""><em>None / Varies</em></MenuItem>
                {roomOptions.map((opt, index) => (<MenuItem key={`${opt.value}-${index}`} value={opt.value}>{opt.label}</MenuItem>))}
                {roomOptions.length === 0 && <MenuItem value="" disabled>No rooms available</MenuItem>}
              </Select>
              {getError('roomCode') && <FormHelperText>{getError('roomCode')}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Zoom Link (Optional)" name="zoomMeetinglink" type="url" value={formData.zoomMeetinglink || ""} onChange={onChange}
              error={!!getError('zoomMeetinglink')} helperText={getError('zoomMeetinglink') || ' '}
              fullWidth variant="outlined" size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Course Notes (Optional)" name="notes" value={formData.notes || ""} onChange={onChange}
              error={!!getError('notes')} helperText={getError('notes') || ' '}
              fullWidth multiline rows={2} variant="outlined" size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {/* "Weekly Schedule Slots" Section - a dynamic list of inputs */}
      <Box sx={boxStyle}>
        <Typography variant="overline" component="legend" sx={legendStyle}>Weekly Schedule Slots *</Typography>
        {/* Display a general error for the hours array if one exists. */}
        {getError('hours') && <Typography color="error" variant="caption" sx={{ mt: 1, mb: 1 }}>{getError('hours')}</Typography>}
        <Stack spacing={1.5} mt={1}>
          {(formData.hours || []).map((hourSlot, index) => (
            <Grid container spacing={1} key={hourSlot._key || index} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth error={!!getError('day', index)} size="small" required>
                  <InputLabel>Day</InputLabel>
                  <Select label="Day" value={hourSlot.day || ""} onChange={(e) => handleHourChange(index, 'day', e.target.value)} >
                    <MenuItem value="" disabled><em>Select Day</em></MenuItem>
                    {daysOfWeek.map(d => (<MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>))}
                  </Select>
                  {getError('day', index) && <FormHelperText>{getError('day', index)}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3.5} md={3}>
                <TextField label="Start" type="time" value={hourSlot.start || ""} onChange={(e) => handleHourChange(index, 'start', e.target.value)}
                  error={!!getError('start', index)} helperText={getError('start', index) || ' '}
                  fullWidth required variant="outlined" size="small"
                  // 'shrink: true' ensures the label is always in the "shrunken" state, which is necessary for time inputs.
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3.5} md={3}>
                <TextField label="End" type="time" value={hourSlot.end || ""} onChange={(e) => handleHourChange(index, 'end', e.target.value)}
                  error={!!getError('end', index)} helperText={getError('end', index) || ' '}
                  fullWidth required variant="outlined" size="small" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={1} md={3} sx={{ textAlign: { xs: 'right', md: 'left' } }}>
                <IconButton onClick={() => removeHourSlot(index)} color="error" size="small"
                  // The remove button is disabled if there is only one time slot remaining.
                  disabled={(formData.hours || []).length <= 1} title="Remove Time Slot">
                  <RemoveCircleOutline />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Box sx={{ mt: 1 }}>
            <MuiButton startIcon={<AddCircleOutline />} onClick={addHourSlot} size="small">
              Add Time Slot
            </MuiButton>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

// These are reusable style objects for the fieldset-like container boxes.
const boxStyle = { border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' };
const legendStyle = { position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 };