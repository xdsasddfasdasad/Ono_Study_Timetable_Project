// src/components/modals/forms/SiteForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";

export default function SiteForm({
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
          Site Information
        </Typography>
        <Stack spacing={2} mt={1}>
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
          <TextField
            label="Notes"
            name="notes"
            value={formData.notes || ""}
            onChange={onChange}
            error={!!getError('notes')}
            helperText={getError('notes') || ' '}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>
    </Stack>
  );
}