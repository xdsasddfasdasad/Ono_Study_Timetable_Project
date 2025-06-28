// src/components/modals/ManageCourseMeetingsModal.jsx

import React, { useState, useEffect, useCallback } from "react";
// Imports Material-UI components for building the modal's UI.
import {
  Stack, Alert, CircularProgress, Typography, Button,
  FormControl, InputLabel, Select, MenuItem, Divider, Box
} from "@mui/material";
// Imports a generic, reusable modal wrapper and the specific form for course meetings.
import PopupModal from "../UI/PopupModal";
import CourseMeetingInstanceForm from "./forms/CourseMeetingInstanceForm";
// Imports utility and handler functions for data mapping, database operations, and querying.
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection, fetchCollectionWithQuery } from "../../firebase/firestoreService";
import { where } from "firebase/firestore";

// A helper function to load and format data for the form's dropdowns (Selects).
const loadSelectOptions = async () => {
    try {
        // Fetch all necessary collections in parallel for efficiency.
        const [lecturers, sites] = await Promise.all([
            fetchCollection("lecturers"), 
            fetchCollection("sites")
        ]);
        // Flatten the nested room data into a single, sorted array for the dropdown.
        const allRooms = (sites || []).flatMap(site =>
            (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName} @ ${site.siteName}` }))
        );
        if (allRooms.length === 0) {
            console.warn("[CourseMeetingsModal] loadSelectOptions: No rooms found. Check that 'sites' documents in Firestore have a 'rooms' array.");
        }
        const formattedLecturers = (lecturers || []).map(l => ({ value: l.id, label: `${l.name} (${l.id})` }));
        return { lecturers: formattedLecturers, rooms: allRooms };
    } catch (error) {
        console.error("[CourseMeetingsModal] Error loading select options:", error);
        return { lecturers: [], rooms: [] }; // Return empty arrays on failure.
    }
};

// A robust helper function to format a meeting's start date for display in the dropdown.
// It handles Firestore Timestamps, standard JS Dates, and potential errors gracefully.
const getMeetingDisplayDate = (meeting) => {
    if (!meeting || !meeting.start) return "Date N/A";
    
    try {
        // Check if `start` is a Firestore Timestamp and convert it; otherwise, treat it as a standard date.
        const dateObj = meeting.start.toDate ? meeting.start.toDate() : new Date(meeting.start);
        if (isNaN(dateObj.getTime())) return "Invalid Date";
        
        return dateObj.toLocaleString(); // Format to the user's local date and time.
    } catch (e) {
        console.error("getMeetingDisplayDate failed:", e);
        return "Date Error";
    }
};

// Constants for unique values in the UI.
const ADD_NEW_MEETING_OPTION = "__addNewMeeting__";
const MEETING_RECORD_TYPE = 'courseMeeting';

// This is a "smart" component that encapsulates all logic for managing individual course meetings.
// It can be opened directly to edit a meeting or used to browse courses and then select a meeting.
export default function ManageCourseMeetingsModal({
    open, onClose, onSaveSuccess,
    existingCourses, isLoadingCourses,
    initialCourseCode, initialMeetingId,
}) {
    // === STATE MANAGEMENT ===
    // The `status` state acts as a finite state machine, controlling the modal's UI flow.
    const [status, setStatus] = useState('loading'); // Can be 'loading', 'selecting', 'adding', or 'editing'.
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const [selectedMeetingId, setSelectedMeetingId] = useState("");
    const [courseMeetings, setCourseMeetings] = useState([]); // A list of meetings for the selected course.
    const [formData, setFormData] = useState(null); // The data for the CourseMeetingInstanceForm.
    const [selectOptions, setSelectOptions] = useState({ lecturers: [], rooms: [] });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // This effect is the main entry point, run when the modal is opened.
    // It resets state, loads dropdown data, and determines the initial status.
    useEffect(() => {
        if (!open) {
            // Reset all state on close to ensure a clean slate.
            setStatus('loading'); setSelectedCourseCode(""); setSelectedMeetingId("");
            setFormData(null); setCourseMeetings([]); setErrors({}); setApiError("");
            return;
        }
        setStatus('loading');
        loadSelectOptions().then(setSelectOptions);
        
        // If the modal was opened with specific IDs, jump directly to editing mode.
        if (initialMeetingId && initialCourseCode) {
            setSelectedCourseCode(initialCourseCode);
            setSelectedMeetingId(initialMeetingId);
            setStatus('editing');
        } else {
            // Otherwise, start in the 'selecting' state for the user to choose a course.
            setStatus('selecting');
        }
    }, [open, initialCourseCode, initialMeetingId]);

    // This effect is the core logic driver. It runs whenever the `status` or user selections change.
    // It fetches the relevant meetings and prepares the `formData` for the form.
    useEffect(() => {
        if (!open || status === 'loading' || !selectedCourseCode) {
            setCourseMeetings([]); return;
        }
        const fetchDataForMode = async () => {
            setIsLoading(true); setApiError('');
            try {
                // Fetch all meetings that belong to the currently selected course.
                const meetings = await fetchCollectionWithQuery('coursesMeetings', [where('courseCode', '==', selectedCourseCode)]);
                const safeMeetings = meetings || [];
                setCourseMeetings(safeMeetings);
                
                if (status === 'editing') {
                    // In edit mode, find the specific meeting and set it as the form data.
                    const meetingToEdit = safeMeetings.find(m => m.id === selectedMeetingId);
                    setFormData(meetingToEdit || null);
                } else if (status === 'adding') {
                    // In add mode, prepare a blank form.
                    const mapping = formMappings[MEETING_RECORD_TYPE];
                    const parentCourse = (existingCourses || []).find(c => c.courseCode === selectedCourseCode);
                    
                    // This correctly initializes a new meeting form.
                    // It uses the generic `initialData()` to reset all fields (lecturer, room, notes, etc.)
                    // while pre-filling contextual information like the course code and a default title.
                    setFormData({
                        ...mapping.initialData(),
                        courseCode: selectedCourseCode, 
                        semesterCode: parentCourse?.semesterCode || null,
                        title: parentCourse ? `${parentCourse.courseName} - New Meeting` : "New Meeting",
                    });
                } else { // status === 'selecting'
                    setFormData(null); // In selection mode, there is no form.
                }
            } catch (error) { setApiError("Could not load meeting data. Please try again.");
            } finally { setIsLoading(false); }
        };
        fetchDataForMode();
    }, [open, status, selectedCourseCode, selectedMeetingId, existingCourses]);

    // Handlers for the two main dropdowns.
    const handleCourseChange = (e) => {
        setSelectedCourseCode(e.target.value);
        setSelectedMeetingId(""); // Reset meeting selection.
        setFormData(null);
        setStatus('selecting'); // Go back to the selecting meetings state.
    };

    const handleMeetingSelectionChange = (e) => {
        const newMeetingId = e.target.value;
        setSelectedMeetingId(newMeetingId);
        setFormData(null); // Clear old form data before the useEffect runs.
        
        // Update the status based on the user's choice.
        if (newMeetingId === ADD_NEW_MEETING_OPTION) {
            setStatus('adding');
        } else if (newMeetingId) {
            setStatus('editing');
        } else {
            setStatus('selecting');
        }
    };
    
    // Generic form change handler, memoized for performance.
    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: finalValue }));
        if (errors[name]) { // Clear validation error on change.
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    // Save/Update handler, memoized for performance.
    const handleSave = useCallback(async () => {
        if (!formData) return;
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

    // Delete handler, memoized for performance.
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

    // Derived state for disabling UI elements during any loading process.
    const isActionDisabled = status === 'loading' || isLoadingCourses || isLoading;
    // The main selection UI is hidden if the modal was opened directly for editing.
    const showSelectionUI = !initialMeetingId;

    return (
        <PopupModal open={open} onClose={() => !isActionDisabled && onClose()} title="Manage Course Meetings" maxWidth="md">
            <Stack spacing={3} sx={{ p: 3, minHeight: '400px' }}>
                {apiError && <Alert severity="error" onClose={() => setApiError("")}>{apiError}</Alert>}
                
                {/* Step 1 & 2: Course and Meeting Selection */}
                {showSelectionUI && (
                    <>
                        <FormControl fullWidth disabled={isActionDisabled}>
                            <InputLabel id="course-select-label">1. Select Course</InputLabel>
                            <Select labelId="course-select-label" label="1. Select Course" value={selectedCourseCode} onChange={handleCourseChange}>
                                <MenuItem value="" disabled><em>Select a course...</em></MenuItem>
                                {(existingCourses || []).map(course => (
                                    <MenuItem key={course.courseCode} value={course.courseCode}>{`${course.courseName} (${course.courseCode})`}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selectedCourseCode && (
                            <FormControl fullWidth disabled={isActionDisabled}>
                                <InputLabel id="meeting-select-label">2. Select Action or Meeting</InputLabel>
                                <Select labelId="meeting-select-label" label="2. Select Action or Meeting" value={selectedMeetingId} onChange={handleMeetingSelectionChange} displayEmpty>
                                    <MenuItem value="" disabled><em>Select action or meeting...</em></MenuItem>
                                    <MenuItem value={ADD_NEW_MEETING_OPTION}>--- Add New Meeting Instance ---</MenuItem>
                                    <Divider />
                                    {isLoading && !courseMeetings.length ? (
                                        <MenuItem disabled><CircularProgress size={20} sx={{mr: 1}}/> Loading...</MenuItem>
                                    ) : (courseMeetings.length === 0 ? (
                                        <MenuItem disabled><em>No existing meetings.</em></MenuItem>
                                    ) : (
                                        courseMeetings.map(meeting => (
                                            <MenuItem key={meeting.id} value={meeting.id}>{`${meeting.title || 'Untitled'} - ${getMeetingDisplayDate(meeting)}`}</MenuItem>
                                        ))
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </>
                )}
                
                {/* Step 3: Render the form if the status is 'editing' or 'adding' */}
                {(status === 'editing' || status === 'adding') && (
                    formData ? (
                        <>
                            <Divider sx={{ my: showSelectionUI ? 2 : 0 }} />
                            <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                                {status === 'editing' ? `Editing: ${formData.title || ''}` : 'Add New Meeting Details'}
                            </Typography>
                            {/* The actual form component is rendered here. */}
                            <CourseMeetingInstanceForm
                                formData={formData} errors={errors} onChange={handleFormChange}
                                mode={status === 'adding' ? 'add' : 'edit'} selectOptions={selectOptions}
                            />
                            {/* Action Buttons */}
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
                        // Show a spinner if the form data is being prepared.
                        <Box sx={{textAlign: 'center', p: 4}}><CircularProgress /></Box>
                    )
                )}
            </Stack>
        </PopupModal>
    );
}