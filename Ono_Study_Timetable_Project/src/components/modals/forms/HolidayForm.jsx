// src/components/modals/forms/HolidayForm.jsx
// NOTE: The original filename was EventForm.jsx, but the component is clearly for holidays.
// It's recommended to rename the file to HolidayForm.jsx for clarity.

import React from "react";
// Imports Material-UI components for building the form structure.
import {
  TextField,
  Stack,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid
} from "@mui/material";

// This is a controlled component for creating or editing a Holiday or Vacation entry.
// It's a specialized version of a generic event form.
// It receives all its data and behavior via props, making it reusable.
// The form's layout dynamically changes based on whether the "All Day" checkbox is ticked.
// Props:
// - formData: An object containing the current values for all form fields (e.g., holidayName, startDate).
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
export default function HolidayForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = {} // Included for consistency, but not used.
}) {

  // Helper function to retrieve an error message for a specific field.
  const getError = (fieldName) => errors[fieldName];

  // A robust boolean check for the 'allDay' status. It correctly handles
  // both a strict boolean `true` and a string 'true' from form state.
  const isAllDay = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';

  return (
    <Stack spacing={3}>
      {/* "Holiday Details" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Holiday Details
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Holiday Name"
            name="holidayName" // The key field identifying this as a holiday form.
            value={formData.holidayName || ""}
            onChange={onChange}
            error={!!getError('holidayName')}
            helperText={getError('holidayName') || ' '}
            fullWidth
            required
            autoFocus // Automatically focuses this field when the form opens.
            variant="outlined"
            size="small"
          />
          <TextField
            label="Notes (Optional)"
            name="notes"
            value={formData.notes || ""}
            onChange={onChange}
            error={!!getError('notes')}
            helperText={getError('notes') || ' '}
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            size="small"
          />
          {/* This checkbox controls whether the time input fields are shown or hidden. */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isAllDay}
                onChange={onChange}
                name="allDay"
                size="small"
              />
            }
            label="All Day Event"
            sx={{ pt: 1 }}
          />
        </Stack>
      </Box>

      {/* "Date & Time" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Date & Time
        </Typography>
        <Grid container spacing={2} mt={0.5}>
          {/* The grid item for the Start Date. Its width is dynamic based on the 'isAllDay' state. */}
          <Grid item xs={12} sm={isAllDay ? 6 : 4}>
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate || ""}
              onChange={onChange}
              error={!!getError('startDate')}
              helperText={getError('startDate') || ' '}
              // `shrink: true` is necessary for date/time inputs to prevent the label from overlapping the value.
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              variant="outlined"
              size="small"
            />
          </Grid>
          {/* --- Conditional Rendering --- */}
          {/* The Start Time field is only rendered if `isAllDay` is false. */}
          {!isAllDay && (
            <Grid item xs={12} sm={4}>
              <TextField
                label="Start Time"
                name="startHour"
                type="time"
                value={formData.startHour || ""}
                onChange={onChange}
                error={!!getError('startHour')}
                helperText={getError('startHour') || ' '}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required={!isAllDay}
                variant="outlined"
                size="small"
                // `step: 300` sets the time picker's increment to 300 seconds (5 minutes).
                inputProps={{ step: 300 }}
              />
            </Grid>
          )}
          {/* The grid item for the End Date. */}
          <Grid item xs={12} sm={isAllDay ? 6 : 4}>
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
              variant="outlined"
              size="small"
            />
          </Grid>
          {/* --- Conditional Rendering --- */}
          {/* The End Time field is only rendered if `isAllDay` is false. */}
          {!isAllDay && (
            <Grid item xs={12} sm={4}>
              <TextField
                label="End Time"
                name="endHour"
                type="time"
                value={formData.endHour || ""}
                onChange={onChange}
                error={!!getError('endHour')}
                helperText={getError('endHour') || ' '}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required={!isAllDay}
                variant="outlined"
                size="small"
                inputProps={{ step: 300 }}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </Stack>
  );
}