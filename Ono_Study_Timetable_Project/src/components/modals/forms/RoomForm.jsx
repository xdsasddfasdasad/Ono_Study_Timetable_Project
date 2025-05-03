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

export default function RoomForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = { sites: [] }
}) {
  const getError = (fieldName) => errors[fieldName];
  const siteOptions = Array.isArray(selectOptions?.sites) ? selectOptions.sites : [];
  return (
    <Stack spacing={3}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Room Information
        </Typography>
        <Stack spacing={2} mt={1}>
          <FormControl fullWidth error={!!getError('siteCode')} required size="small">
            <InputLabel id="room-site-select-label">Parent Site</InputLabel>
            <Select
              labelId="room-site-select-label"
              name="siteCode"
              value={formData.siteCode || ""}
              onChange={onChange}
              label="Parent Site"
              disabled={mode === 'edit'}
            >
              <MenuItem value="" disabled><em>Select site...</em></MenuItem>
              {siteOptions.length > 0 ? (
                siteOptions.map((site) => (
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
          <TextField
            label="Room Name"
            name="roomName"
            value={formData.roomName || ""}
            onChange={onChange}
            error={!!getError('roomName')}
            helperText={getError('roomName') || ' '}
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