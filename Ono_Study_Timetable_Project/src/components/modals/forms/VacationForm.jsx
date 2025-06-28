// src/components/modals/forms/VacationForm.jsx

import React from "react";
// Imports Material-UI components for building the form's structure and layout.
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

// This is a controlled component for creating or editing a system-wide Vacation period.
// It is designed to be stateless and reusable, receiving all its data and handlers via props.
// The form collects a name for the vacation and its start and end dates.
// Props:
// - formData: An object containing the current values for the vacation's fields (vacationName, startDate, endDate).
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit').
export default function VacationForm({
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
      {/* "Vacation Details" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Vacation Details
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Text field for the vacation's name (e.g., "Summer Break", "Semester Break"). This is required. */}
          <TextField
            label="Vacation Name"
            name="vacationName"
            value={formData.vacationName || ""}
            onChange={onChange}
            error={!!getError('vacationName')}
            helperText={getError('vacationName') || ' '}
            fullWidth
            required
            autoFocus // Automatically focuses this field when the form opens.
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>

      {/* "Vacation Dates" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Vacation Dates
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* A required date picker for the vacation's start date. */}
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
          {/* A required date picker for the vacation's end date. */}
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