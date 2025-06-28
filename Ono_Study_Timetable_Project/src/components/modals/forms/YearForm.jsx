// src/components/modals/forms/YearForm.jsx

import React from "react";
// Imports Material-UI components for building the form's structure and layout.
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

// This is a controlled component for creating or editing an academic Year.
// It is designed to be stateless and reusable, receiving all its data and handlers via props.
// The form collects a year number and its official start and end dates.
// Props:
// - formData: An object containing the current values for the year's fields (yearNumber, startDate, endDate).
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit').
export default function YearForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = {} // Included for consistency, not used in this form.
}) {

  // A helper function to retrieve an error message for a specific field from the errors object.
  const getError = (fieldName) => errors[fieldName];

  return (
    // The Stack component arranges the main sections of the form vertically with consistent spacing.
    <Stack spacing={3}>
      {/* "Year Information" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Year Information
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Text field for the year number (e.g., "1", "2024"). This is required. */}
          <TextField
            label="Year Number"
            name="yearNumber"
            value={formData.yearNumber || ""}
            onChange={onChange}
            error={!!getError('yearNumber')}
            helperText={getError('yearNumber') || ' '}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>

      {/* "Year Dates" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Year Dates
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* A required date picker for the academic year's start date. */}
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate || ""}
            onChange={onChange}
            error={!!getError('startDate')}
            helperText={getError('startDate') || ' '}
            // `shrink: true` is necessary for date inputs to prevent the label from overlapping the value.
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
          {/* A required date picker for the academic year's end date. */}
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