// src/components/modals/forms/CourseMeetingInstanceForm.jsx

import React from 'react';
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Box
} from '@mui/material';

const formatDateTimeForInput = (dateValue) => {
    if (!dateValue) return '';

    try {
        // ✨ התיקון: בדיקה אם זה Timestamp של Firestore
        const dateObj = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);

        if (isNaN(dateObj.getTime())) return '';
    
        // התאמה לאזור הזמן המקומי כדי שהשעה שתוצג תהיה נכונה
        const offset = dateObj.getTimezoneOffset();
        const adjustedDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().slice(0, 16);
    } catch (error) {
        console.error("Failed to format date:", dateValue, error);
        return ""; // החזר מחרוזת ריקה במקרה של שגיאה
    }
};

const CourseMeetingInstanceForm = React.memo(({
    formData,
    errors,
    onChange,
    mode,
    selectOptions
}) => {
    const { lecturers = [], rooms = [] } = selectOptions || {};

    return (
        <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={3}>
                {/* שדה כותרת הפגישה (כבר קיים) */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        required
                        id="title"
                        name="title"
                        label="Meeting Title"
                        value={formData.title || ''}
                        onChange={onChange}
                        error={!!errors.title}
                        helperText={errors.title || 'Example: "Introduction to React Hooks"'}
                    />
                </Grid>

                {/* שדות התחלה וסיום (קיימים) */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth required id="start" name="start" label="Start Time" type="datetime-local"
                        value={formatDateTimeForInput(formData.start)} onChange={onChange} error={!!errors.start}
                        helperText={errors.start} InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth required id="end" name="end" label="End Time" type="datetime-local"
                        value={formatDateTimeForInput(formData.end)} onChange={onChange} error={!!errors.end}
                        helperText={errors.end} InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                {/* בחירת מרצה וחדר (קיימים) */}
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.lecturerId}>
                        <InputLabel id="lecturer-select-label">Lecturer</InputLabel>
                        <Select
                            labelId="lecturer-select-label" id="lecturerId" name="lecturerId"
                            value={formData.lecturerId || ''} label="Lecturer" onChange={onChange}
                        >
                            <MenuItem value="" disabled><em>Select a lecturer...</em></MenuItem>
                            {lecturers.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                        {errors.lecturerId && <FormHelperText>{errors.lecturerId}</FormHelperText>}
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.roomCode}>
                        <InputLabel id="room-select-label">Room</InputLabel>
                        <Select
                            labelId="room-select-label" id="roomCode" name="roomCode"
                            value={formData.roomCode || ''} label="Room" onChange={onChange}
                        >
                            <MenuItem value="" disabled><em>Select a room...</em></MenuItem>
                            {rooms.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                        {errors.roomCode && <FormHelperText>{errors.roomCode}</FormHelperText>}
                    </FormControl>
                </Grid>

                {/* --- ✨ הוספת שדה קישור ל-Zoom ✨ --- */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="zoomMeetinglink"
                        name="zoomMeetinglink"
                        label="Zoom Meeting Link"
                        value={formData.zoomMeetinglink || ''}
                        onChange={onChange}
                        error={!!errors.zoomMeetinglink}
                        helperText={errors.zoomMeetinglink}
                        placeholder="https://example.zoom.us/j/1234567890"
                    />
                </Grid>

                {/* --- ✨ הוספת שדה הערות (Notes) ✨ --- */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="notes"
                        name="notes"
                        label="Notes"
                        multiline // מאפשר מספר שורות
                        rows={3}   // גובה התחלתי של 3 שורות
                        value={formData.notes || ''}
                        onChange={onChange}
                        error={!!errors.notes}
                        helperText={errors.notes}
                        placeholder="Add any relevant notes for this specific meeting."
                    />
                </Grid>

                {/* שדות לקריאה בלבד (קיימים) */}
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth disabled id="courseCode" name="courseCode" label="Parent Course Code"
                        value={formData.courseCode || 'N/A'} variant="filled"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth disabled id="semesterCode" name="semesterCode" label="Parent Semester Code"
                        value={formData.semesterCode || 'N/A'} variant="filled"
                    />
                </Grid>
            </Grid>
        </Box>
    );
});

export default CourseMeetingInstanceForm;