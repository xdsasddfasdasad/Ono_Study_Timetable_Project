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
  FormHelperText
} from "@mui/material";

export default function SemesterForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = { years: [] }
}) {
  const getError = (fieldName) => errors[fieldName];
  const yearOptions = Array.isArray(selectOptions?.years) ? selectOptions.years : [];

  return (
    <Stack spacing={3}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Semester Information
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Semester Number"
            name="semesterNumber"
            value={formData.semesterNumber || ""}
            onChange={onChange}
            error={!!getError('semesterNumber')}
            helperText={getError('semesterNumber') || ' '}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
          <FormControl fullWidth error={!!getError('yearCode')} required size="small">
            <InputLabel id="semester-year-select-label">Parent Year</InputLabel>
            <Select
              labelId="semester-year-select-label"
              name="yearCode"
              value={formData.yearCode || ""}
              onChange={onChange}
              label="Parent Year"
            >
               <MenuItem value="" disabled><em>Select year...</em></MenuItem>
              {yearOptions.length > 0 ? (
                yearOptions.map((year) => (
                  <MenuItem key={year.value} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))
              ) : (
                 <MenuItem value="" disabled>No years available</MenuItem>
              )}
            </Select>
            {getError('yearCode') && <FormHelperText>{getError('yearCode')}</FormHelperText>}
          </FormControl>
        </Stack>
      </Box>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Semester Dates
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate || ""}
            onChange={onChange}
            error={!!getError('startDate')}
            helperText={getError('startDate') || ' '}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
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