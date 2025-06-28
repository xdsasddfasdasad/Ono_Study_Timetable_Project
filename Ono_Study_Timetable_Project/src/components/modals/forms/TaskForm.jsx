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
  Grid
} from "@mui/material";

export default function TaskForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = { courses: [] } 
}) {
  const getError = (fieldName) => errors[fieldName];
  const courseOptions = Array.isArray(selectOptions?.courses) ? selectOptions.courses : [];

  return (
    <Stack spacing={3}>
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
            autoFocus
            variant="outlined"
            size="small"
          />
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
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Submission Deadline
        </Typography>
        <Grid container spacing={2} mt={0.5}>
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
           <Grid item xs={12} sm={6}>
                <TextField
                    label="Submission Time"
                    name="submissionHour" 
                    type="time"
                    value={formData.submissionHour || "23:59"}
                    onChange={onChange}
                    error={!!getError('submissionHour')}
                    helperText={getError('submissionHour') || ' '}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    inputProps={{ step: 300 }}
                />
           </Grid>
        </Grid>
      </Box>
    </Stack>
  );
}