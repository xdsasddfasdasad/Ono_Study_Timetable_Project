// src/components/modals/forms/SiteForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

// Simple presentation component for Site data
export default function SiteForm({
  formData = {},   // Current site data (passed from parent modal)
  errors = {},     // Validation errors (passed from parent modal)
  onChange,      // Callback function to notify parent of changes
  mode = "add",    // 'add' or 'edit' - not currently used here
  // selectOptions prop is accepted for consistency
  selectOptions = {}
}) {

  // Helper function to get error message for a field
  const getError = (fieldName) => errors[fieldName];

  return (
    <Stack spacing={3}>
      {/* --- Site Information --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Site Information
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Site Name */}
          <TextField
            label="Site Name"
            name="siteName"
            value={formData.siteName || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('siteName')}
            helperText={getError('siteName') || ' '} // Add space for consistent layout
            fullWidth
            required // Mark visually as required
            variant="outlined"
            size="small" // Consistent size
          />

          {/* Site Code Display (Read-only for context if editing, usually hidden) */}
          {/* Avoid showing internal codes unless specifically required */}
           {/* {mode === 'edit' && formData.siteCode && (
                <TextField
                    label="Site Code (Read Only)"
                    value={formData.siteCode}
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

      {/* NO SUBMIT BUTTON HERE - Parent modal handles submission */}
    </Stack>
  );
}