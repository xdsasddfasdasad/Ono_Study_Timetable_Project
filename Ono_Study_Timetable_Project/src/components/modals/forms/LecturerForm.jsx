// src/components/modals/forms/LecturerForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography
} from "@mui/material";
export default function LecturerForm({
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
          Lecturer Details
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Lecturer Name"
            name="name"
            value={formData.name || ""}
            onChange={onChange} 
            error={!!getError('name')}
            helperText={getError('name') || ' '}
            fullWidth
            required
            autoFocus
            variant="outlined"
            size="small"
          />
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
        </Stack>
      </Box>
    </Stack>
  );
}