// src/components/modals/forms/RoomForm.jsx

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
  FormHelperText
} from "@mui/material";

// Simple presentation component for Room data
export default function RoomForm({
  formData = {},         // Current room data (passed from parent modal)
  errors = {},           // Validation errors (passed from parent modal)
  onChange,            // Callback function to notify parent of changes
  mode = "add",          // 'add' or 'edit'
  selectOptions = { sites: [] } // Available sites (passed from parent modal)
}) {

  // Helper function to get error message for a field
  const getError = (fieldName) => errors[fieldName];

  // Extract the list of sites from selectOptions
  // Ensure it's always an array
  const siteOptions = Array.isArray(selectOptions?.sites) ? selectOptions.sites : [];

  return (
    <Stack spacing={3}>
      {/* --- Room Information --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Room Information
        </Typography>
        <Stack spacing={2} mt={1}>

          {/* Parent Site Selection */}
          <FormControl fullWidth error={!!getError('siteCode')} required size="small">
            <InputLabel id="room-site-select-label">Parent Site</InputLabel>
            <Select
              labelId="room-site-select-label"
              name="siteCode" // Ensure name matches formData key
              value={formData.siteCode || ""} // Controlled by formData prop
              onChange={onChange} // Notify parent of change
              label="Parent Site"
              // Disable changing the parent site when editing an existing room
              disabled={mode === 'edit'}
            >
              <MenuItem value="" disabled><em>Select site...</em></MenuItem>
              {siteOptions.length > 0 ? (
                siteOptions.map((site) => (
                  // Use site.value and site.label as defined in the modal's selectOptions creation
                  <MenuItem key={site.value} value={site.value}>
                    {site.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No sites available</MenuItem>
              )}
            </Select>
            {getError('siteCode') && <FormHelperText>{getError('siteCode')}</FormHelperText>}
          </FormControl>

          {/* Room Name */}
          <TextField
            label="Room Name"
            name="roomName"
            value={formData.roomName || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('roomName')}
            helperText={getError('roomName') || ' '}
            fullWidth
            required
            variant="outlined"
            size="small"
          />

          {/* Room Code Display (Read-only for context if editing, hidden otherwise) */}
          {/* Avoid showing internal codes unless necessary */}
           {/* {mode === 'edit' && formData.roomCode && (
                <TextField
                    label="Room Code (Read Only)"
                    value={formData.roomCode}
                    fullWidth
                    disabled
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}
                />
           )} */}

          {/* Notes */}
          <TextField
            label="Notes"
            name="notes"
            value={formData.notes || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('notes')}
            helperText={getError('notes') || ' '}
            fullWidth
            multiline
            rows={3} // Adjust rows as needed
            variant="outlined"
            size="small"
          />

        </Stack>
      </Box>
      {/* NO SUBMIT BUTTON HERE */}
    </Stack>
  );
}