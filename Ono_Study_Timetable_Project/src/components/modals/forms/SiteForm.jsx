// src/components/modals/forms/SiteForm.jsx

import React from "react";
// Imports Material-UI components for building the form's structure and layout.
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

// This is a controlled component for creating or editing a Site or Campus location.
// It is designed to be stateless and reusable, receiving all its data and handlers via props.
// This simple form collects a name and optional notes for a site.
// Props:
// - formData: An object containing the current values for the site's fields (siteName, notes).
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit').
export default function SiteForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = {} // Included for consistency, not used in this form.
}) {
  // A helper function to retrieve an error message for a specific field from the errors object.
  const getError = (fieldName) => errors[fieldName];

  return (
    // The Stack component arranges the main sections of the form vertically.
    <Stack spacing={3}>
      {/* A styled Box provides the fieldset-like container for the form fields. */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Site Information
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Text field for the site's name (e.g., "Main Campus", "North Building"). This field is required. */}
          <TextField
            label="Site Name"
            name="siteName"
            value={formData.siteName || ""}
            onChange={onChange}
            error={!!getError('siteName')}
            helperText={getError('siteName') || ' '}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
          {/* An optional, multi-line text field for any notes about the site. */}
          <TextField
            label="Notes"
            name="notes"
            value={formData.notes || ""}
            onChange={onChange}
            error={!!getError('notes')}
            helperText={getError('notes') || ' '}
            fullWidth
            multiline
            rows={3} // Sets the initial height of the text area.
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>
    </Stack>
  );
}