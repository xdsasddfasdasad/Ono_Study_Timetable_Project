// src/components/modals/forms/RoomForm.jsx

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

// This is a controlled component for creating or editing a Room. A key feature is that
// a room must be associated with a "Parent Site" via a dropdown menu.
// Like the other forms, it is stateless and receives all data and handlers via props.
// Props:
// - formData: An object containing the current values for the room's fields (siteCode, roomName, notes).
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit').
// - selectOptions: An object containing arrays for populating dropdowns, in this case, the `sites` array.
export default function RoomForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = { sites: [] } // Expects an array of site options.
}) {
  // A helper function to retrieve an error message for a specific field.
  const getError = (fieldName) => errors[fieldName];

  // Defensively get the site options. This ensures that if `selectOptions` or `selectOptions.sites`
  // is null, undefined, or not an array, the component will not crash and will use an empty array instead.
  const siteOptions = Array.isArray(selectOptions?.sites) ? selectOptions.sites : [];

  return (
    // The Stack component arranges the main sections of the form vertically.
    <Stack spacing={3}>
      {/* A styled Box provides the fieldset-like container for the form fields. */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Room Information
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* A required dropdown to select the parent site for this room. */}
          <FormControl fullWidth error={!!getError('siteCode')} required size="small">
            <InputLabel id="room-site-select-label">Parent Site</InputLabel>
            <Select
              labelId="room-site-select-label"
              name="siteCode" // This name should correspond to a key in the formData object.
              value={formData.siteCode || ""}
              onChange={onChange}
              label="Parent Site"
            >
              <MenuItem value="" disabled><em>Select site...</em></MenuItem>
              {/* Ternary operator to handle the case where no sites are available. */}
              {siteOptions.length > 0 ? (
                siteOptions.map((site) => (
                  <MenuItem key={site.value} value={site.value}>
                    {site.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No sites available</MenuItem>
              )}
            </Select>
            {/* Display a helper text with the error message if one exists. */}
            {getError('siteCode') && <FormHelperText>{getError('siteCode')}</FormHelperText>}
          </FormControl>
          
          {/* Text field for the room's name. This field is required. */}
          <TextField
            label="Room Name"
            name="roomName"
            value={formData.roomName || ""}
            onChange={onChange}
            error={!!getError('roomName')}
            helperText={getError('roomName') || ' '}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
          
          {/* An optional, multi-line text field for any notes about the room. */}
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