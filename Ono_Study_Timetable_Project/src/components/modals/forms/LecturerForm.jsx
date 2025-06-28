// src/components/modals/forms/LecturerForm.jsx

import React from "react";
// Imports Material-UI components for building the form's structure and layout.
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

// This is a controlled component for creating or editing a lecturer's information.
// Like the other forms in this directory, it's designed to be stateless and reusable,
// receiving all its data and behavior via props from a parent component.
// Props:
// - formData: An object containing the current values for the lecturer's fields (name, email, phone).
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit'), though not used here for conditional logic, it's a standard prop for these forms.
export default function LecturerForm({
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
      {/* A styled Box provides the fieldset-like container for the form fields. */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Lecturer Details
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Text field for the lecturer's full name. This field is required. */}
          <TextField
            label="Lecturer Name"
            name="name"
            value={formData.name || ""}
            onChange={onChange}
            error={!!getError('name')}
            helperText={getError('name') || ' '}
            fullWidth
            required
            autoFocus // Automatically focuses this field when the form opens.
            variant="outlined"
            size="small"
          />
          {/* Text field for the lecturer's email address. Marked as optional. */}
          <TextField
            label="Email (Optional)"
            name="email"
            type="email" // Using type="email" provides basic browser-level validation.
            value={formData.email || ""}
            onChange={onChange}
            error={!!getError('email')}
            helperText={getError('email') || ' '}
            fullWidth
            variant="outlined"
            size="small"
          />
          {/* Text field for the lecturer's phone number. Marked as optional. */}
          <TextField
            label="Phone (Optional)"
            name="phone"
            type="tel" // Using type="tel" can bring up a numeric keypad on mobile devices.
            value={formData.phone || ""}
            onChange={onChange}
            error={!!getError('phone')}
            helperText={getError('phone') || ' '}
            fullWidth
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>
    </Stack>
  );
}