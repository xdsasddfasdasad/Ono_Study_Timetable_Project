// src/components/modals/forms/VacationForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

// Simple presentation component for Vacation data
export default function VacationForm({
  formData = {},   // Current vacation data (passed from parent modal)
  errors = {},     // Validation errors (passed from parent modal)
  onChange,      // Callback function to notify parent of changes
  mode = "add",    // 'add' or 'edit'
  // selectOptions prop is accepted for consistency
  selectOptions = {}
}) {

  // Helper function to get error message for a field
  const getError = (fieldName) => errors[fieldName];

  return (
    <Stack spacing={3}>
      {/* --- Vacation Details --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Vacation Details
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Vacation Name */}
          <TextField
            label="Vacation Name"
            name="vacationName"
            value={formData.vacationName || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('vacationName')}
            helperText={getError('vacationName') || ' '} // Add space for consistent layout
            fullWidth
            required // Mark visually as required
            autoFocus // Focus on this field when form opens
            variant="outlined"
            size="small" // Consistent size
          />

           {/* Vacation Code Display (Read-only for context if editing, usually hidden) */}
           {/* Avoid showing internal codes unless specifically required */}
           {/* {mode === 'edit' && formData.vacationCode && (
                <TextField
                    label="Vacation Code (Read Only)"
                    value={formData.vacationCode}
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

      {/* --- Vacation Dates --- */}
       <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Vacation Dates
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