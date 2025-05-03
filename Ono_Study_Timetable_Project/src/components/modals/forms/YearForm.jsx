// src/components/modals/forms/YearForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography
  // No Select needed here, so no FormControl/MenuItem etc.
} from "@mui/material";

// Simple presentation component for Year data
export default function YearForm({
  formData = {},   // Current year data (passed from parent modal)
  errors = {},     // Validation errors (passed from parent modal)
  onChange,      // Callback function to notify parent of changes
  mode = "add",    // 'add' or 'edit' - not currently used here, but kept for consistency
  // selectOptions prop is accepted for consistency, even if not used in this specific form
  selectOptions = {}
}) {

  // Helper function to get error message for a field
  const getError = (fieldName) => errors[fieldName];

  return (
    <Stack spacing={3}>
      {/* --- Year Information --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Year Information
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Year Number */}
          <TextField
            label="Year Number"
            name="yearNumber"
            value={formData.yearNumber || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('yearNumber')}
            helperText={getError('yearNumber') || ' '} // Add space for consistent layout
            fullWidth
            required // Mark visually as required
            variant="outlined"
            size="small" // Consistent size
          />

           {/* Year Code Display (Read-only for context if editing, usually hidden) */}
           {/* Avoid showing internal codes unless specifically required */}
           {/* {mode === 'edit' && formData.yearCode && (
                <TextField
                    label="Year Code (Read Only)"
                    value={formData.yearCode}
                    fullWidth
                    disabled
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}
                />
           )} */}

        </Stack>
      </Box>

      {/* --- Year Dates --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Year Dates
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Start Date */}
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('startDate')}
            helperText={getError('startDate') || ' '}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
          {/* End Date */}
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
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

      {/* NO SUBMIT BUTTON HERE - Parent modal handles submission */}
    </Stack>
  );
}