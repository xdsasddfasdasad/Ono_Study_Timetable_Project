// src/components/modals/forms/LecturerForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

// Simple presentation component for Lecturer data
export default function LecturerForm({
  formData = {},   // Current lecturer data (passed from parent modal)
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
      {/* --- Lecturer Details --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Lecturer Details
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Lecturer Name */}
          <TextField
            label="Lecturer Name"
            name="name"
            value={formData.name || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('name')}
            helperText={getError('name') || ' '} // Add space for consistent layout
            fullWidth
            required // Mark visually as required
            autoFocus // Focus on this field when form opens
            variant="outlined"
            size="small" // Consistent size
          />

          {/* Optional: Email */}
          <TextField
            label="Email (Optional)"
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={onChange}
            error={!!getError('email')}
            helperText={getError('email') || ' '}
            fullWidth
            variant="outlined"
            size="small"
          />

           {/* Optional: Phone */}
           <TextField
             label="Phone (Optional)"
             name="phone"
             type="tel"
             value={formData.phone || ""}
             onChange={onChange}
             error={!!getError('phone')}
             helperText={getError('phone') || ' '}
             fullWidth
             variant="outlined"
             size="small"
           />

          {/* Lecturer ID Display (Read-only for context if editing, usually hidden) */}
          {/* Avoid showing internal IDs unless necessary */}
           {/* {mode === 'edit' && formData.id && (
                <TextField
                    label="Lecturer ID (Read Only)"
                    value={formData.id}
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

      {/* NO SUBMIT BUTTON HERE - Parent modal handles submission */}
    </Stack>
  );
}