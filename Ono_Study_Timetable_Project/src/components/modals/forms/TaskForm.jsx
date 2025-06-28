// src/components/modals/forms/TaskForm.jsx

import React from "react";
// Imports Material-UI components for building the form's structure and layout.
import {
  TextField,
  Stack,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid
} from "@mui/material";

// This is a controlled component for creating or editing a Task or Assignment.
// A key feature is that a task must be associated with a specific course via a dropdown.
// It is a stateless component, receiving all its data and handlers via props from a parent.
// Props:
// - formData: An object containing the current values for the task's fields.
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit').
// - selectOptions: An object containing arrays for populating dropdowns, in this case, `courses`.
export default function TaskForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = { courses: [] } // Expects an array of course options.
}) {
  // A helper function to retrieve an error message for a specific field.
  const getError = (fieldName) => errors[fieldName];

  // Defensively get the course options. This ensures that if `selectOptions` or `selectOptions.courses`
  // is null, undefined, or not an array, the component will use an empty array and not crash.
  const courseOptions = Array.isArray(selectOptions?.courses) ? selectOptions.courses : [];

  return (
    <Stack spacing={3}>
      {/* "Task Details" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Task Details
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Assignment Name"
            name="assignmentName"
            value={formData.assignmentName || ""}
            onChange={onChange}
            error={!!getError('assignmentName')}
            helperText={getError('assignmentName') || ' '}
            fullWidth
            required
            autoFocus // Automatically focuses this field when the form opens.
            variant="outlined"
            size="small"
          />
          {/* A required dropdown to associate this task with a course. */}
          <FormControl fullWidth error={!!getError('courseCode')} required size="small">
            <InputLabel id="task-course-select-label">Associated Course</InputLabel>
            <Select
              labelId="task-course-select-label"
              name="courseCode"
              value={formData.courseCode || ""}
              onChange={onChange}
              label="Associated Course"
            >
              <MenuItem value="" disabled><em>Select course...</em></MenuItem>
              {courseOptions.length > 0 ? (
                courseOptions.map((course) => (
                  <MenuItem key={course.value} value={course.value}>
                    {course.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No courses available</MenuItem>
              )}
            </Select>
            {getError('courseCode') && <FormHelperText>{getError('courseCode')}</FormHelperText>}
          </FormControl>
          <TextField
            label="Notes (Optional)"
            name="notes"
            value={formData.notes || ""}
            onChange={onChange}
            error={!!getError('notes')}
            helperText={getError('notes') || ' '}
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>

      {/* "Submission Deadline" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Submission Deadline
        </Typography>
        <Grid container spacing={2} mt={0.5}>
          {/* A required date picker for the submission deadline date. */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Submission Date"
              name="submissionDate"
              type="date"
              value={formData.submissionDate || ""}
              onChange={onChange}
              error={!!getError('submissionDate')}
              helperText={getError('submissionDate') || ' '}
              // `shrink: true` is necessary for date/time inputs to prevent the label from overlapping the value.
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              variant="outlined"
              size="small"
            />
          </Grid>
          {/* A time picker for the submission deadline time, with a sensible default. */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Submission Time"
              name="submissionHour"
              type="time"
              // The default value is set to the end of the day, a common deadline time.
              value={formData.submissionHour || "23:59"}
              onChange={onChange}
              error={!!getError('submissionHour')}
              helperText={getError('submissionHour') || ' '}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
              size="small"
              // `step: 300` sets the time picker's increment to 300 seconds (5 minutes).
              inputProps={{ step: 300 }}
            />
          </Grid>
        </Grid>
      </Box>
    </Stack>
  );
}