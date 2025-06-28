// src/components/modals/forms/SemesterForm.jsx

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
  FormHelperText
} from "@mui/material";

// This is a controlled component for creating or editing an academic Semester.
// A semester must be associated with a "Parent Year" and has defined start and end dates.
// It is a stateless component, receiving all its data and handlers via props.
// Props:
// - formData: An object containing the current values for the semester's fields.
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit').
// - selectOptions: An object containing arrays for populating dropdowns, in this case, the `years` array.
export default function SemesterForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = { years: [] } // Expects an array of academic year options.
}) {
  // A helper function to retrieve an error message for a specific field.
  const getError = (fieldName) => errors[fieldName];

  // Defensively get the year options. This ensures that if `selectOptions` or `selectOptions.years`
  // is null, undefined, or not an array, the component will use an empty array and not crash.
  const yearOptions = Array.isArray(selectOptions?.years) ? selectOptions.years : [];

  return (
    // The Stack component arranges the main sections of the form vertically with consistent spacing.
    <Stack spacing={3}>
      {/* "Semester Information" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Semester Information
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Text field for the semester number (e.g., "1", "2", "Summer"). */}
          <TextField
            label="Semester Number"
            name="semesterNumber"
            value={formData.semesterNumber || ""}
            onChange={onChange}
            error={!!getError('semesterNumber')}
            helperText={getError('semesterNumber') || ' '}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
          {/* A required dropdown to select the parent academic year for this semester. */}
          <FormControl fullWidth error={!!getError('yearCode')} required size="small">
            <InputLabel id="semester-year-select-label">Parent Year</InputLabel>
            <Select
              labelId="semester-year-select-label"
              name="yearCode"
              value={formData.yearCode || ""}
              onChange={onChange}
              label="Parent Year"
            >
              <MenuItem value="" disabled><em>Select year...</em></MenuItem>
              {/* Ternary operator to handle the case where no year options are available. */}
              {yearOptions.length > 0 ? (
                yearOptions.map((year) => (
                  <MenuItem key={year.value} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No years available</MenuItem>
              )}
            </Select>
            {getError('yearCode') && <FormHelperText>{getError('yearCode')}</FormHelperText>}
          </FormControl>
        </Stack>
      </Box>

      {/* "Semester Dates" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Semester Dates
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* A required date picker for the semester's start date. */}
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate || ""}
            onChange={onChange}
            error={!!getError('startDate')}
            helperText={getError('startDate') || ' '}
            // `shrink: true` is necessary for date inputs to prevent the label from overlapping the pre-filled value.
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
          {/* A required date picker for the semester's end date. */}
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate || ""}
            onChange={onChange}
            error={!!getError('endDate')}
            helperText={getError('endDate') || ' '}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>
    </Stack>
  );
}