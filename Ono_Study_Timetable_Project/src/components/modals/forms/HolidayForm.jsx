// src/components/modals/forms/EventForm.jsx

import React from "react";
import {
  TextField,
  Stack,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid
} from "@mui/material";
export default function EventForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add",
  selectOptions = {}
}) {

d
  const getError = (fieldName) => errors[fieldName];
  const isAllDay = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';

  return (
    <Stack spacing={3}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Event Details
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Holiday Name"
            name="holidayName"
            value={formData.holidayName || ""}
            onChange={onChange}
            error={!!getError('holidayName')}
            helperText={getError('holidayName') || ' '}
            fullWidth
            required
            autoFocus
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
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 }}>
          Date & Time
        </Typography>
        <Grid container spacing={2} mt={0.5}>
           <Grid item xs={12} sm={isAllDay ? 6 : 4}>
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
                        inputProps={{ step: 300 }}
                    />
                </Grid>
            )}
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