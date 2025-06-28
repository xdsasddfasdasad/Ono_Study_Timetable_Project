// src/components/modals/forms/EventForm.jsx

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

// This is a controlled component for creating or editing a user's personal event.
// It receives all its data and behavior via props, making it reusable and easy to manage from a parent.
// The form's layout dynamically changes based on whether the "All Day Event" checkbox is ticked.
// Props:
// - formData: An object containing the current values for all form fields.
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit'), though not heavily used here, it's good practice for form components.
// - selectOptions: Included for consistency, but not used in this specific form.
export default function EventForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = {}
}) {

  // A helper function to retrieve an error message for a specific field from the errors object.
  const getError = (fieldName) => errors[fieldName];

  // A robust boolean check for the 'allDay' status.
  // It handles both a strict boolean `true` and a string 'true' (which can occur with HTML form elements),
  // ensuring the logic works consistently.
  const isAllDay = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';

  return (
    <Stack spacing={3}>
      {/* "Event Details" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Event Details
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Event Name"
            name="eventName"
            value={formData.eventName || ""}
            onChange={onChange}
            error={!!getError('eventName')}
            helperText={getError('eventName') || ' '}
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
          {/* The checkbox that controls the form's dynamic layout. */}
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
          {/* The grid item for the Start Date. Its width changes based on whether it's an all-day event. */}
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
                // `step: 300` sets the time picker's step increment to 300 seconds (5 minutes).
                inputProps={{ step: 300 }}
              />
            </Grid>
          )}
          {/* The grid item for the End Date. Its width also changes. */}
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