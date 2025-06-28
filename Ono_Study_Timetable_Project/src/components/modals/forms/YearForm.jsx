// src/components/modals/forms/YearForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

export default function YearForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = {}
}) {

  const getError = (fieldName) => errors[fieldName];
  return (
    <Stack spacing={3}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Year Information
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Year Number"
            name="yearNumber"
            value={formData.yearNumber || ""}
            onChange={onChange}
            error={!!getError('yearNumber')}
            helperText={getError('yearNumber') || ' '}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Year Dates
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