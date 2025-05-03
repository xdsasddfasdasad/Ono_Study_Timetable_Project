// src/components/modals/forms/EventForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid // Use Grid for better layout of date/time fields
} from "@mui/material";

// Simple presentation component for general Event data
export default function EventForm({
  formData = {},   // Current event data (passed from parent modal)
  errors = {},     // Validation errors (passed from parent modal)
  onChange,      // Callback function to notify parent of changes
  mode = "add",    // 'add' or 'edit'
  // selectOptions prop is accepted for consistency
  selectOptions = {}
}) {

  // Helper function to get error message for a field
  const getError = (fieldName) => errors[fieldName];

  // Determine if the event is 'allDay' based on formData
  // Handle boolean true/false and string 'true'/'false'/'True'
  const isAllDay = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';

  return (
    <Stack spacing={3}>
      {/* --- Event Details --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Event Details
        </Typography>
        <Stack spacing={2} mt={1}>
          {/* Event Name */}
          <TextField
            label="Event Name"
            name="eventName"
            value={formData.eventName || ""} // Controlled by formData prop
            onChange={onChange} // Notify parent of change
            error={!!getError('eventName')}
            helperText={getError('eventName') || ' '} // Add space for consistent layout
            fullWidth
            required
            autoFocus
            variant="outlined"
            size="small"
          />

          {/* Event Code Display (Read-only for context if editing, usually hidden) */}
          {/* {mode === 'edit' && formData.eventCode && ( <TextField label="Event Code (Read Only)" ... /> )} */}

           {/* Notes */}
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

            {/* All Day Checkbox */}
            <FormControlLabel
                control={
                <Checkbox
                    // Use the derived isAllDay boolean for checked state
                    checked={isAllDay}
                    onChange={onChange} // Notify parent of change
                    name="allDay"
                    size="small"
                />
                }
                label="All Day Event"
                sx={{ pt: 1 }} // Add some padding top
            />
        </Stack>
      </Box>

      {/* --- Event Dates & Times --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Date & Time
        </Typography>
        <Grid container spacing={2} mt={0.5}> {/* Use Grid for layout */}
           {/* Start Date */}
           <Grid item xs={12} sm={isAllDay ? 6 : 4}> {/* Adjust width based on allDay */}
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
           </Grid>

           {/* Start Time (Only if NOT All Day) */}
           {!isAllDay && (
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Start Time"
                        name="startHour" // Correct name matching validation/data
                        type="time"
                        value={formData.startHour || ""} // Default might be needed if validation requires it
                        onChange={onChange}
                        error={!!getError('startHour')}
                        helperText={getError('startHour') || ' '}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required={!isAllDay} // Required only if not all day
                        variant="outlined"
                        size="small"
                        inputProps={{ step: 300 }} // Optional: 5 minute steps
                    />
                </Grid>
            )}

           {/* End Date */}
           {/* Required if All Day, might be optional for timed if duration set by time */}
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
                    // Conditionally required based on allDay? Validation handles this.
                    // required={isAllDay}
                    variant="outlined"
                    size="small"
                />
           </Grid>


           {/* End Time (Only if NOT All Day) */}
            {!isAllDay && (
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="End Time"
                        name="endHour" // Correct name matching validation/data
                        type="time"
                        value={formData.endHour || ""} // Default might be needed
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

      {/* NO SUBMIT BUTTON HERE */}
    </Stack>
  );
}