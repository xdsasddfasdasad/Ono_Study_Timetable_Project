// src/components/modals/forms/SemesterForm.jsx

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
  FormHelperText // Import FormHelperText for Select errors
} from "@mui/material";

// This is now a presentation component
export default function SemesterForm({
  formData = {},   // Current form data (passed from parent modal)
  errors = {},     // Validation errors (passed from parent modal)
  onChange,      // Callback function to notify parent of changes (passed from parent)
  mode = "add",    // 'add' or 'edit' (passed from parent) - can be used for conditional logic if needed
  selectOptions = { years: [] } // Options for dropdowns (passed from parent)
}) {

  // Helper function to get error message for a field
  const getError = (fieldName) => errors[fieldName];

  // Extract the list of years from selectOptions
  // Ensure it's always an array
  const yearOptions = Array.isArray(selectOptions?.years) ? selectOptions.years : [];

  return (
    <Stack spacing={3}>
      {/* --- Semester Info --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Semester Information
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Semester Number */}
          <TextField
            label="Semester Number"
            name="semesterNumber"
            value={formData.semesterNumber || ""}
            onChange={onChange} // Call parent's change handler
            error={!!getError('semesterNumber')}
            helperText={getError('semesterNumber') || ' '} // Add space to prevent layout shift
            fullWidth
            required // Mark as required visually
            variant="outlined"
            size="small"
          />

          {/* Parent Year Selection */}
          <FormControl fullWidth error={!!getError('yearCode')} required size="small">
            <InputLabel id="semester-year-select-label">Parent Year</InputLabel>
            <Select
              labelId="semester-year-select-label"
              name="yearCode" // Ensure name matches formData key
              value={formData.yearCode || ""}
              onChange={onChange} // Call parent's change handler
              label="Parent Year"
              // Disable if editing? Often you don't change the parent year of an existing semester.
              // disabled={mode === 'edit'}
            >
               {/* Optional: Add a "Please Select" option */}
               <MenuItem value="" disabled><em>Select year...</em></MenuItem>
              {yearOptions.length > 0 ? (
                yearOptions.map((year) => (
                  // Use year.value and year.label as defined in the modal's selectOptions creation
                  <MenuItem key={year.value} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))
              ) : (
                 <MenuItem value="" disabled>No years available</MenuItem>
              )}
            </Select>
             {/* Display error message for Select using FormHelperText */}
            {getError('yearCode') && <FormHelperText>{getError('yearCode')}</FormHelperText>}
          </FormControl>

           {/* Semester Code Display (Read-only for context if editing, hidden otherwise) */}
           {/* We generally avoid showing generated/internal codes directly in forms */}
           {/* {mode === 'edit' && formData.semesterCode && (
                <TextField
                    label="Semester Code (Read Only)"
                    value={formData.semesterCode}
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

      {/* --- Semester Dates --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Semester Dates
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Start Date */}
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate || ""}
            onChange={onChange} // Call parent's change handler
            error={!!getError('startDate')}
            helperText={getError('startDate') || ' '}
            InputLabelProps={{ shrink: true }} // Keep label shrunk for date type
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
            value={formData.endDate || ""}
            onChange={onChange} // Call parent's change handler
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