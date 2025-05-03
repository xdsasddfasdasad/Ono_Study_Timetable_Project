// src/components/modals/forms/CourseMeetingForm.jsx (Recommended Filename)

import React, { useCallback } from "react"; // Import useCallback
import {
  TextField,
  Stack,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid
} from "@mui/material";

export default function CourseMeetingForm({
  formData = {},
  errors = {},
  onChange, // Must be stable (useCallback in parent) or memoize this component
  mode = "add",
  // Expecting fully formatted options from parent modal
  selectOptions = { courses: [], lecturers: [], rooms: [] }
}) {

  const getError = (fieldName) => errors[fieldName];

  // Extract options for easier use, expecting them to be pre-formatted
  const courseOptions = Array.isArray(selectOptions?.courses) ? selectOptions.courses : [];
  const lecturerOptions = Array.isArray(selectOptions?.lecturers) ? selectOptions.lecturers : [];
  // ✅ Assume rooms are pre-formatted by parent (value, label)
  const roomOptions = Array.isArray(selectOptions?.rooms) ? selectOptions.rooms : [];

  // Find the course name for display in edit mode
  const courseNameDisplay = mode === 'edit'
                            ? (courseOptions.find(c => c.value === formData.courseCode)?.label || formData.courseCode || 'N/A')
                            : '';

  // --- ✅ Handler to update both courseCode and courseName on selection (for Add mode) ---
  const handleCourseChange = useCallback((event) => {
      const newCourseCode = event.target.value;
      const selectedCourse = courseOptions.find(c => c.value === newCourseCode);
      // Attempt to extract just the name from the label (assuming format "Name (Code)")
      const newCourseName = selectedCourse ? selectedCourse.label?.split(' (')[0] : '';

      // Trigger onChange for both fields
      onChange({ target: { name: 'courseCode', value: newCourseCode } });
      onChange({ target: { name: 'courseName', value: newCourseName } });
  }, [onChange, courseOptions]); // Dependencies: onChange callback and the options list


  return (
    <Stack spacing={3}>
      {/* --- Meeting Details --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" /* ... */ >Course Meeting Details</Typography>
        <Stack spacing={2} mt={1}>
          {/* Conditional Course Display/Selection */}
          {mode === 'edit' ? (
             <TextField label="Associated Course" value={courseNameDisplay} /* ... read-only props ... */ />
          ) : (
             <FormControl fullWidth error={!!getError('courseCode')} required size="small">
                <InputLabel id="meeting-course-select-label">Associated Course</InputLabel>
                <Select
                    labelId="meeting-course-select-label"
                    name="courseCode"
                    value={formData.courseCode || ""}
                    onChange={handleCourseChange}
                    label="Associated Course"
                >
                    <MenuItem value="" disabled><em>Select course...</em></MenuItem>
                    {courseOptions.map((course) => ( <MenuItem key={course.value} value={course.value}>{course.label}</MenuItem> ))}
                    {courseOptions.length === 0 && <MenuItem value="" disabled>No courses available</MenuItem>}
                </Select>
                {getError('courseCode') && <FormHelperText>{getError('courseCode')}</FormHelperText>}
             </FormControl>
          )}
          {/* Lecturer Selection */}
          <FormControl fullWidth error={!!getError('lecturerId')} size="small">
             <InputLabel id="meeting-lecturer-select-label">Lecturer</InputLabel>
             <Select labelId="meeting-lecturer-select-label" name="lecturerId" value={formData.lecturerId || ""} onChange={onChange} label="Lecturer">
                 {/* ... menu items using lecturerOptions ... */}
                 <MenuItem value="" disabled><em>Select lecturer...</em></MenuItem>
                 {lecturerOptions.map((lecturer) => ( <MenuItem key={lecturer.value} value={lecturer.value}>{lecturer.label}</MenuItem> ))}
                 {lecturerOptions.length === 0 && <MenuItem value="" disabled>No lecturers available</MenuItem>}
             </Select>
             {getError('lecturerId') && <FormHelperText>{getError('lecturerId')}</FormHelperText>}
          </FormControl>
          {/* Room Selection */}
           <FormControl fullWidth error={!!getError('roomCode')} size="small">
              <InputLabel id="meeting-room-select-label">Room</InputLabel>
              <Select labelId="meeting-room-select-label" name="roomCode" value={formData.roomCode || ""} onChange={onChange} label="Room">
                   {/* ✅ Expecting pre-formatted roomOptions */}
                   <MenuItem value="" disabled><em>Select room...</em></MenuItem>
                   {roomOptions.map((room) => ( <MenuItem key={room.value} value={room.value}>{room.label}</MenuItem> ))}
                   {roomOptions.length === 0 && <MenuItem value="" disabled>No rooms available</MenuItem>}
              </Select>
              {getError('roomCode') && <FormHelperText>{getError('roomCode')}</FormHelperText>}
           </FormControl>
           <TextField label="Zoom Meeting Link (Optional)" name="zoomMeetinglink" value={formData.zoomMeetinglink || ""} onChange={onChange} error={!!getError('zoomMeetinglink')}
                     helperText={getError('zoomMeetinglink') || ' '}
                     fullWidth
                     variant="outlined"
                     size="small"
                     type="url"
                 />
           {/* Notes */}
           <TextField label="Notes for this specific meeting (Optional)" name="notes" /* ... */ value={formData.notes || ""} onChange={onChange} error={!!getError('notes')} helperText={getError('notes') || ' '} multiline rows={2} size="small" />
        </Stack>
      </Box>
      {/* --- Date & Time --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
         <Typography variant="overline" /* ... */ >Date & Time</Typography>
         <Grid container spacing={2} mt={0.5}>
             {/* ... Date/Time fields using onChange ... */}
              <Grid item xs={12} sm={4}><TextField label="Date" name="date" type="date" value={formData.date || ""} onChange={onChange} error={!!getError('date')} helperText={getError('date') || ' '} required size="small" InputLabelProps={{ shrink: true }}/></Grid>
              <Grid item xs={12} sm={4}><TextField label="Start Time" name="startHour" type="time" value={formData.startHour || ""} onChange={onChange} error={!!getError('startHour')} helperText={getError('startHour') || ' '} required size="small" InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} /></Grid>
              <Grid item xs={12} sm={4}><TextField label="End Time" name="endHour" type="time" value={formData.endHour || ""} onChange={onChange} error={!!getError('endHour')} helperText={getError('endHour') || ' '} required size="small" InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} /></Grid>
         </Grid>
      </Box>
      {/* NO SUBMIT BUTTON HERE */}
    </Stack>
  );
}