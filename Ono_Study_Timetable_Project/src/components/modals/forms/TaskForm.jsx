// src/components/modals/forms/TaskForm.jsx

import React from "react";
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
  Grid // For layout
} from "@mui/material";

// Simple presentation component for Task data
export default function TaskForm({
  formData = {},   // Current task data (passed from parent modal)
  errors = {},     // Validation errors (passed from parent modal)
  onChange,      // Callback function to notify parent of changes
  mode = "add",    // 'add' or 'edit'
  selectOptions = { courses: [] } // Available courses (passed from parent modal)
}) {

  // Helper function to get error message for a field
  const getError = (fieldName) => errors[fieldName];

  // Extract the list of courses from selectOptions
  const courseOptions = Array.isArray(selectOptions?.courses) ? selectOptions.courses : [];

  return (
    <Stack spacing={3}>
      {/* --- Task Details --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Task Details
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Assignment Name */}
          <TextField
            label="Assignment Name"
            name="assignmentName"
            value={formData.assignmentName || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('assignmentName')}
            helperText={getError('assignmentName') || ' '}
            fullWidth
            required
            autoFocus
            variant="outlined"
            size="small"
          />

          {/* Course Selection */}
          <FormControl fullWidth error={!!getError('courseCode')} required size="small">
            <InputLabel id="task-course-select-label">Associated Course</InputLabel>
            <Select
              labelId="task-course-select-label"
              name="courseCode"
              value={formData.courseCode || ""} // Controlled by formData prop
              onChange={onChange} // Notify parent of change
              label="Associated Course"
            >
              <MenuItem value="" disabled><em>Select course...</em></MenuItem>
              {courseOptions.length > 0 ? (
                courseOptions.map((course) => (
                  // Use course.value and course.label as defined in the modal's selectOptions creation
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

           {/* Assignment Code Display (Read-only for context if editing, usually hidden) */}
           {/* {mode === 'edit' && formData.assignmentCode && ( <TextField label="Assignment Code (Read Only)" ... /> )} */}

          {/* Notes */}
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

      {/* --- Submission Deadline --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Submission Deadline
        </Typography>
        <Grid container spacing={2} mt={0.5}>
           {/* Submission Date */}
           <Grid item xs={12} sm={6}>
                <TextField
                    label="Submission Date"
                    name="submissionDate"
                    type="date"
                    value={formData.submissionDate || ""}
                    onChange={onChange}
                    error={!!getError('submissionDate')}
                    helperText={getError('submissionDate') || ' '}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                    variant="outlined"
                    size="small"
                />
           </Grid>
           {/* Submission Time */}
           <Grid item xs={12} sm={6}>
                <TextField
                    label="Submission Time"
                    name="submissionHour" // Consistent name
                    type="time"
                    value={formData.submissionHour || "23:59"} // Default to end of day?
                    onChange={onChange}
                    error={!!getError('submissionHour')}
                    helperText={getError('submissionHour') || ' '}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    // Might not be strictly required, could default
                    // required
                    variant="outlined"
                    size="small"
                    inputProps={{ step: 300 }} // 5 minute steps
                />
           </Grid>
        </Grid>
      </Box>

      {/* NO SUBMIT BUTTON HERE */}
    </Stack>
  );
}