// src/components/modals/forms/CourseForm.jsx

import React from "react";
import {
  TextField, Stack, Box, Typography, FormControl, InputLabel, Select,
  MenuItem, FormHelperText, Grid, IconButton, Button as MuiButton
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
const daysOfWeek = [
  { value: 'Sun', label: 'Sunday' }, { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' }, { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' }, { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
];

export default function CourseForm({
  formData = { hours: [{ day: '', start: '', end: '' }] },
  errors = {},
  onChange,
  mode = "add",
  selectOptions = { semesters: [], lecturers: [], rooms: [] }
}) {

  const getError = (fieldName, index = null) => {
    const key = index !== null ? `hours[${index}].${fieldName}` : fieldName;
    return errors[key];
  };

  const semesterOptions = selectOptions?.semesters || [];
  const lecturerOptions = selectOptions?.lecturers || [];
  const roomOptions = selectOptions?.rooms || [];
  const handleHourChange = (index, field, value) => {
    const newHours = JSON.parse(JSON.stringify(formData.hours || []));
    if (!newHours[index]) newHours[index] = {};
    newHours[index][field] = value;
    onChange({ target: { name: 'hours', value: newHours } });
  };

  const addHourSlot = () => {
    const newHours = [...(formData.hours || []), { day: '', start: '', end: '' }];
    onChange({ target: { name: 'hours', value: newHours } });
  };

  const removeHourSlot = (index) => {
    const newHours = (formData.hours || []).filter((_, i) => i !== index);
    if (newHours.length === 0) {
        newHours.push({ day: '', start: '', end: '' });
    }
    onChange({ target: { name: 'hours', value: newHours } });
  };

  return (
    <Stack spacing={3}>
      <Box sx={boxStyle}>
        <Typography variant="overline" component="legend" sx={legendStyle}>
          Course Details
        </Typography>
        <Grid container spacing={2} mt={0.5}>
           <Grid item xs={12} sm={6}>
                <TextField label="Course Code" name="courseCode" value={formData.courseCode || ""} onChange={onChange}
                    error={!!getError('courseCode')} helperText={getError('courseCode') || ' '}
                    fullWidth required disabled={mode === 'edit'} variant="outlined" size="small"
                    InputProps={{ readOnly: mode === 'edit' }}
                />
           </Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="Course Name" name="courseName" value={formData.courseName || ""} onChange={onChange}
                    error={!!getError('courseName')} helperText={getError('courseName') || ' '}
                    fullWidth required autoFocus={mode === 'add'} variant="outlined" size="small"
                />
           </Grid>
            <Grid item xs={12} sm={6}>
                 <FormControl fullWidth error={!!getError('semesterCode')} required size="small">
                     <InputLabel id="course-semester-select-label">Semester</InputLabel>
                     <Select labelId="course-semester-select-label" name="semesterCode" value={formData.semesterCode || ""} onChange={onChange} label="Semester">
                         <MenuItem value="" disabled><em>Select semester...</em></MenuItem>
                         {semesterOptions.map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                         {semesterOptions.length === 0 && <MenuItem value="" disabled>No semesters available</MenuItem>}
                     </Select>
                     {getError('semesterCode') && <FormHelperText>{getError('semesterCode')}</FormHelperText>}
                 </FormControl>
            </Grid>
           <Grid item xs={12} sm={6}>
                 <FormControl fullWidth error={!!getError('lecturerId')} required size="small">
                     <InputLabel id="course-lecturer-select-label">Lecturer</InputLabel>
                     <Select labelId="course-lecturer-select-label" name="lecturerId" value={formData.lecturerId || ""} onChange={onChange} label="Lecturer">
                          <MenuItem value="" disabled><em>Select lecturer...</em></MenuItem>
                         {lecturerOptions.map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                         {lecturerOptions.length === 0 && <MenuItem value="" disabled>No lecturers available</MenuItem>}
                     </Select>
                     {getError('lecturerId') && <FormHelperText>{getError('lecturerId')}</FormHelperText>}
                 </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
                 <FormControl fullWidth error={!!getError('roomCode')} size="small">
                     <InputLabel id="course-room-select-label">Default Room (Optional)</InputLabel>
                     <Select labelId="course-room-select-label" name="roomCode" value={formData.roomCode || ""} onChange={onChange} label="Default Room (Optional)">
                         <MenuItem value=""><em>None / Varies</em></MenuItem>
                         {roomOptions.map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                         {roomOptions.length === 0 && <MenuItem value="" disabled>No rooms available</MenuItem>}
                     </Select>
                     {getError('roomCode') && <FormHelperText>{getError('roomCode')}</FormHelperText>}
                 </FormControl>
            </Grid>
             <Grid item xs={12} sm={6}>
                 <TextField label="Zoom Link (Optional)" name="zoomMeetinglink" type="url" value={formData.zoomMeetinglink || ""} onChange={onChange}
                    error={!!getError('zoomMeetinglink')} helperText={getError('zoomMeetinglink') || ' '}
                    fullWidth variant="outlined" size="small"
                 />
            </Grid>
            <Grid item xs={12}>
                <TextField label="Course Notes (Optional)" name="notes" value={formData.notes || ""} onChange={onChange}
                   error={!!getError('notes')} helperText={getError('notes') || ' '}
                   fullWidth multiline rows={2} variant="outlined" size="small"
                />
           </Grid>
        </Grid>
      </Box>

      <Box sx={boxStyle}>
        <Typography variant="overline" component="legend" sx={legendStyle}>
          Weekly Schedule Slots *
        </Typography>
        {getError('hours') && <Alert severity="error" sx={{ mt: 1, mb: 1 }} size="small">{getError('hours')}</Alert>}
        <Stack spacing={1.5} mt={1}>
            {(formData.hours || []).map((hourSlot, index) => (
                 <Grid container spacing={1} key={index} alignItems="center">
                    <Grid item xs={12} sm={4} md={3}>
                         <FormControl fullWidth error={!!getError('day', index)} size="small" required>
                             <InputLabel id={`hour-day-label-${index}`} shrink={!!hourSlot.day}>Day</InputLabel>
                             <Select labelId={`hour-day-label-${index}`} label="Day" name="day" value={hourSlot.day || ""} onChange={(e) => handleHourChange(index, 'day', e.target.value)} >
                                 <MenuItem value="" disabled><em>Select Day</em></MenuItem>
                                 {daysOfWeek.map(d => (<MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>))}
                             </Select>
                              {getError('day', index) && <FormHelperText>{getError('day', index)}</FormHelperText>}
                         </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3.5} md={3}>
                         <TextField label="Start" name="start" type="time" value={hourSlot.start || ""} onChange={(e) => handleHourChange(index, 'start', e.target.value)}
                            error={!!getError('start', index)} helperText={getError('start', index) || ' '}
                            fullWidth required variant="outlined" size="small" InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }}
                         />
                    </Grid>
                    <Grid item xs={6} sm={3.5} md={3}>
                        <TextField label="End" name="end" type="time" value={hourSlot.end || ""} onChange={(e) => handleHourChange(index, 'end', e.target.value)}
                            error={!!getError('end', index)} helperText={getError('end', index) || ' '}
                            fullWidth required variant="outlined" size="small" InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }}
                         />
                    </Grid>
                     <Grid item xs={12} sm={1} md={3} sx={{ textAlign: { xs: 'right', md: 'left'} }}>
                         <IconButton onClick={() => removeHourSlot(index)} color="error" size="small" aria-label={`remove slot ${index + 1}`} disabled={(formData.hours || []).length <= 1} title="Remove Time Slot">
                             <RemoveCircleOutline />
                         </IconButton>
                    </Grid>
                 </Grid>
            ))}
             <Box sx={{ mt: 1 }}>
                 <MuiButton startIcon={<AddCircleOutline />} onClick={addHourSlot} size="small">
                     Add Time Slot
                 </MuiButton>
             </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

const boxStyle = { border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' };
const legendStyle = { position: 'absolute', top: -10, left: 10, bgcolor: 'background.paper', px: 0.5 };