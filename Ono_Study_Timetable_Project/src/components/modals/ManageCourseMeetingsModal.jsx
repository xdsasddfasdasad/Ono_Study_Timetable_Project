import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, CircularProgress, Typography, Button,
  FormControl, InputLabel, Select, MenuItem, Divider, Box
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CourseMeetingInstanceForm from "./forms/CourseMeetingInstanceForm";
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection, fetchCollectionWithQuery } from "../../firebase/firestoreService";
import { where } from "firebase/firestore";

// פונקציית עזר לטעינת אופציות ל-Dropdowns
const loadSelectOptions = async () => {
    try {
        const [lecturers, sites] = await Promise.all([
            fetchCollection("lecturers"), 
            fetchCollection("sites")
        ]);
        const allRooms = (sites || []).flatMap(site =>
            (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName} @ ${site.siteName}` }))
        );
        if (allRooms.length === 0) {
            console.warn("[CourseMeetingsModal] loadSelectOptions: No rooms found. Check your 'sites' collection in Firestore. Each site document must have a 'rooms' array.");
        }
        const formattedLecturers = (lecturers || []).map(l => ({ value: l.id, label: `${l.name} (${l.id})` }));
        return { lecturers: formattedLecturers, rooms: allRooms };
    } catch (error) {
        console.error("[CourseMeetingsModal] Error loading select options:", error);
        return { lecturers: [], rooms: [] };
    }
};

// פונקציית תאריך חסינה ומשוריינת
const getMeetingDisplayDate = (meeting) => {
    if (!meeting || !meeting.start) {
        return "Date N/A";
    }
    try {
        const dateObj = meeting.start.toDate ? meeting.start.toDate() : new Date(meeting.start);
        if (isNaN(dateObj.getTime())) {
            return "Invalid Date";
        }
        return dateObj.toLocaleString();
    } catch (e) {
        console.error("getMeetingDisplayDate failed:", e);
        return "Date Error";
    }
};

const ADD_NEW_MEETING_OPTION = "__addNewMeeting__";
const MEETING_RECORD_TYPE = 'courseMeeting';

export default function ManageCourseMeetingsModal({
    open, onClose, onSaveSuccess,
    existingCourses, isLoadingCourses,
    initialCourseCode, initialMeetingId,
}) {
    const [status, setStatus] = useState('loading');
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const [selectedMeetingId, setSelectedMeetingId] = useState("");
    const [courseMeetings, setCourseMeetings] = useState([]);
    const [formData, setFormData] = useState(null);
    const [selectOptions, setSelectOptions] = useState({ lecturers: [], rooms: [] });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setStatus('loading'); setSelectedCourseCode(""); setSelectedMeetingId("");
            setFormData(null); setCourseMeetings([]); setErrors({}); setApiError("");
            return;
        }
        setStatus('loading');
        loadSelectOptions().then(setSelectOptions);
        if (initialMeetingId && initialCourseCode) {
            setSelectedCourseCode(initialCourseCode);
            setSelectedMeetingId(initialMeetingId);
            setStatus('editing');
        } else {
            setStatus('selecting');
        }
    }, [open, initialCourseCode, initialMeetingId]);

    useEffect(() => {
        if (!open || status === 'loading' || !selectedCourseCode) {
            setCourseMeetings([]); return;
        }
        const fetchDataForMode = async () => {
            setIsLoading(true); setApiError('');
            try {
                const meetings = await fetchCollectionWithQuery('coursesMeetings', [where('courseCode', '==', selectedCourseCode)]);
                const safeMeetings = meetings || [];
                setCourseMeetings(safeMeetings);
                
                if (status === 'editing') {
                    const meetingToEdit = safeMeetings.find(m => m.id === selectedMeetingId);
                    setFormData(meetingToEdit || null);
                } else if (status === 'adding') {
                    const mapping = formMappings[MEETING_RECORD_TYPE];
                    const parentCourse = (existingCourses || []).find(c => c.courseCode === selectedCourseCode);
                    
                    // ✨ --- התיקון הסופי והמרכזי נמצא כאן --- ✨
                    setFormData({
                        ...mapping.initialData(), // זה יאפס את כל השדות לערכי ברירת מחדל (כולל מרצה, חדר, הערות, וקישור זום)
                        courseCode: selectedCourseCode, 
                        semesterCode: parentCourse?.semesterCode || null,
                        title: parentCourse ? `${parentCourse.courseName} - New Meeting` : "New Meeting",
                        // אנחנו בכוונה *לא* דורסים את lecturerId, roomCode, וכו'.
                        // הם יקבלו את הערכים הריקים מ-initialData(), והמשתמש יבחר אותם מחדש.
                    });
                } else { // status === 'selecting'
                    setFormData(null); 
                }
            } catch (error) { setApiError("Could not load meeting data. Please try again.");
            } finally { setIsLoading(false); }
        };
        fetchDataForMode();
    }, [open, status, selectedCourseCode, selectedMeetingId, existingCourses]);

    const handleCourseChange = (e) => {
        const newCourseCode = e.target.value;
        setSelectedCourseCode(newCourseCode);
        setSelectedMeetingId(""); 
        setFormData(null);
        setStatus('selecting');
    };

    const handleMeetingSelectionChange = (e) => {
        const newMeetingId = e.target.value;
        setSelectedMeetingId(newMeetingId);
        setFormData(null); // נקה את הטופס הישן לפני קביעת הסטטוס החדש
        if (newMeetingId === ADD_NEW_MEETING_OPTION) {
            setStatus('adding');
        } else if (newMeetingId) {
            setStatus('editing');
        } else {
            setStatus('selecting');
        }
    };
    
    const handleFormChange = useCallback((event) => {
        if (!event.target) {
            console.warn("handleFormChange received an event without a target", event);
            return;
        }
        const { name, value, type, checked } = event.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: finalValue }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    const handleSave = useCallback(async () => {
        if (!formData) {
            console.error("handleSave called but formData is null.");
            return;
        }
        setIsLoading(true); setApiError(""); setErrors({});
        const currentMode = status === 'adding' ? 'add' : 'edit';
        const result = await handleSaveOrUpdateRecord(
            'coursesMeetings', formData, currentMode,
            { recordType: MEETING_RECORD_TYPE, editingId: selectedMeetingId }
        );
        setIsLoading(false);
        if (result.success) {
            onSaveSuccess?.();
            onClose();
        } else {
            setErrors(result.errors || {});
            setApiError(result.message || `Failed to ${currentMode} meeting.`);
        }
    }, [formData, status, selectedMeetingId, onSaveSuccess, onClose]);

    const handleDelete = useCallback(async () => {
        if (status !== 'editing' || !selectedMeetingId) return;
        if (!window.confirm(`Are you sure you want to DELETE the meeting: "${formData?.title || selectedMeetingId}"?`)) return;
        setIsLoading(true); setApiError("");
        const result = await handleDeleteEntity('coursesMeetings', selectedMeetingId);
        setIsLoading(false);
        if (result.success) {
            onSaveSuccess?.();
            onClose();
        } else {
            setApiError(result.message || "Deletion failed.");
        }
    }, [status, selectedMeetingId, formData, onSaveSuccess, onClose]);

    const isActionDisabled = status === 'loading' || isLoadingCourses || isLoading;
    const showSelectionUI = !initialMeetingId;

    return (
        <PopupModal open={open} onClose={() => !isActionDisabled && onClose()} title="Manage Course Meetings" maxWidth="md">
            <Stack spacing={3} sx={{ p: 3, minHeight: '400px' }}>
                {apiError && <Alert severity="error" onClose={() => setApiError("")}>{apiError}</Alert>}
                {showSelectionUI && (
                    <>
                        <FormControl fullWidth disabled={isActionDisabled}>
                            <InputLabel id="course-select-label">1. Select Course</InputLabel>
                            <Select
                                labelId="course-select-label" label="1. Select Course"
                                value={selectedCourseCode} onChange={handleCourseChange}
                            >
                                <MenuItem value="" disabled><em>Select a course...</em></MenuItem>
                                {(existingCourses || []).map(course => (
                                    <MenuItem key={course.courseCode} value={course.courseCode}>
                                        {`${course.courseName} (${course.courseCode})`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selectedCourseCode && (
                            <FormControl fullWidth disabled={isActionDisabled}>
                                <InputLabel id="meeting-select-label">2. Select Action or Meeting</InputLabel>
                                <Select
                                    labelId="meeting-select-label" label="2. Select Action or Meeting"
                                    value={selectedMeetingId} onChange={handleMeetingSelectionChange} displayEmpty
                                >
                                    <MenuItem value="" disabled><em>Select action or meeting...</em></MenuItem>
                                    <MenuItem value={ADD_NEW_MEETING_OPTION}>--- Add New Meeting Instance ---</MenuItem>
                                    <Divider />
                                    {isLoading && !courseMeetings.length ? (
                                        <MenuItem disabled><CircularProgress size={20} sx={{mr: 1}}/> Loading...</MenuItem>
                                    ) : (courseMeetings.length === 0 ? (
                                        <MenuItem disabled><em>No existing meetings.</em></MenuItem>
                                    ) : (
                                        courseMeetings.map(meeting => (
                                            <MenuItem key={meeting.id} value={meeting.id}>
                                                {`${meeting.title || 'Untitled'} - ${getMeetingDisplayDate(meeting)}`}
                                            </MenuItem>
                                        ))
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </>
                )}
                {(status === 'editing' || status === 'adding') && (
                    formData ? (
                        <>
                            <Divider sx={{ my: showSelectionUI ? 2 : 0 }} />
                            <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                                {status === 'editing' ? `Editing: ${formData.title || ''}` : 'Add New Meeting Details'}
                            </Typography>
                            <CourseMeetingInstanceForm
                                formData={formData} errors={errors} onChange={handleFormChange}
                                mode={status === 'adding' ? 'add' : 'edit'} selectOptions={selectOptions}
                            />
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
                                <Box>
                                    {status === 'editing' && (
                                        <Button color="error" variant="outlined" onClick={handleDelete} disabled={isActionDisabled}>
                                            {isLoading ? <CircularProgress size={24} /> : "Delete Meeting"}
                                        </Button>
                                    )}
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    <Button onClick={onClose} disabled={isActionDisabled}>Cancel</Button>
                                    <Button variant="contained" onClick={handleSave} disabled={isActionDisabled}>
                                        {isLoading ? <CircularProgress size={24} /> : (status === 'editing' ? "Update Meeting" : "Save Meeting")}
                                    </Button>
                                </Stack>
                            </Stack>
                        </>
                    ) : (
                        <Box sx={{textAlign: 'center', p: 4}}><CircularProgress /></Box>
                    )
                )}
            </Stack>
        </PopupModal>
    );
}