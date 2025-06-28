// src/components/modals/ManageCourseDefinitionModal.jsx

import React, { useState, useEffect, useCallback } from "react";
// Imports Material-UI components for building the modal's UI.
import {
  Stack, Alert, CircularProgress, Typography, Button,
  FormControl, InputLabel, Select, MenuItem, Divider, Box
} from "@mui/material";
// Imports a generic, reusable modal wrapper and the specific form for courses.
import PopupModal from "../UI/PopupModal";
import CourseForm from "./forms/CourseForm";
// Imports utility and handler functions for data mapping and database operations.
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// This is a robust, asynchronous function to load and format all the data
// needed for the various dropdowns (Selects) in the CourseForm.
const loadSelectOptions = async (allCourses = []) => {
    try {
        // Fetch all necessary collections in parallel for maximum efficiency.
        const [years, lecturers, sites] = await Promise.all([
            fetchCollection("years"), 
            fetchCollection("lecturers"), 
            fetchCollection("sites")
        ]);

        const semesterMap = new Map();

        // 1. Primary Method: Build the semester list from the canonical 'years' collection.
        // This ensures semesters are correctly associated with their parent year.
        (years || []).forEach(y => {
            (y.semesters || []).forEach(s => {
                if (s.semesterCode && !semesterMap.has(s.semesterCode)) {
                    semesterMap.set(s.semesterCode, { 
                        value: s.semesterCode, 
                        label: `Sem ${s.semesterNumber} / Y${y.yearNumber}` 
                    });
                }
            });
        });

        // 2. Data Integrity Fallback: Check all existing courses for any "orphaned" semester codes.
        // An orphaned semester is one that exists on a course but not in any year's semester list.
        // This prevents the app from crashing if data is inconsistent and provides a clear UI indicator.
        (allCourses || []).forEach(course => {
            if (course.semesterCode && !semesterMap.has(course.semesterCode)) {
                semesterMap.set(course.semesterCode, {
                    value: course.semesterCode,
                    label: `Orphaned Semester (${course.semesterCode})` // Label makes data issue obvious.
                });
            }
        });
        
        // 3. Convert the final map to a sorted array for the dropdown.
        const allSemesters = Array.from(semesterMap.values()).sort((a, b) => a.label.localeCompare(b.label));

        // Format and sort the remaining dropdown options.
        const allRooms = (sites || []).flatMap(site => (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName} @ ${site.siteName}` }))).sort((a, b) => a.label.localeCompare(b.label));
        const formattedLecturers = (lecturers || []).map(l => ({ value: l.id, label: `${l.name} (${l.id})` })).sort((a, b) => a.label.localeCompare(b.label));

        return { semesters: allSemesters, lecturers: formattedLecturers, rooms: allRooms };
    } catch (error) {
        console.error("[CourseModal] Error loading select options:", error);
        return { semesters: [], lecturers: [], rooms: [] }; // Return empty arrays on failure.
    }
};

// Constants for unique values in the UI.
const ADD_NEW_COURSE_OPTION = "__addNewCourse__";
const COURSE_RECORD_TYPE = 'course';

// This is a "smart" component that encapsulates all the logic for managing course definitions.
// It handles data fetching, state management for the UI, and orchestrates calls to save/delete handlers.
export default function ManageCourseDefinitionModal({ open, onClose, onSaveSuccess }) {
    // === STATE MANAGEMENT ===
    const [selectedCourseCode, setSelectedCourseCode] = useState(""); // The course selected from the dropdown.
    const [formData, setFormData] = useState(null); // The data object for the CourseForm.
    const [mode, setMode] = useState("select"); // The current mode: 'select', 'add', or 'edit'.
    const [errors, setErrors] = useState({}); // Field-specific validation errors.
    const [apiError, setApiError] = useState(""); // General API error messages.
    const [isLoading, setIsLoading] = useState(false); // Controls loading state for save/delete actions.
    const [selectOptions, setSelectOptions] = useState({ semesters: [], lecturers: [], rooms: [] }); // Data for form dropdowns.
    const [internalCourses, setInternalCourses] = useState([]); // A local cache of all course definitions.
    const [isDataLoading, setIsDataLoading] = useState(true); // Controls the initial data loading state.

    // Effect for fetching all necessary data when the modal is opened.
    useEffect(() => {
        if (open) {
            setIsDataLoading(true);
            
            // This is a sequential fetch: first get courses, then use them to get a complete list of dropdown options.
            fetchCollection("courses").then(coursesData => {
                const courses = coursesData || [];
                setInternalCourses(courses);

                // Now load select options, passing the courses data for the "orphaned semester" check.
                loadSelectOptions(courses).then(options => {
                    setSelectOptions(options);
                    setIsDataLoading(false); // Mark loading as complete only after all data is ready.
                });
            }).catch(err => {
                setApiError("Failed to load initial data.");
                setIsDataLoading(false);
            });
        } else {
            // Reset all state when the modal closes to ensure it's fresh for the next use.
            setSelectedCourseCode("");
            setFormData(null);
            setMode("select");
            setErrors({});
            setApiError("");
            setIsLoading(false);
            setInternalCourses([]);
            setIsDataLoading(true);
        }
    }, [open]);

    // Effect that reacts to the user's selection from the dropdown to set up the form.
    useEffect(() => {
        if (isDataLoading) return; // Don't do anything until the initial data is loaded.
        setErrors({}); setApiError("");
        
        const mapping = formMappings[COURSE_RECORD_TYPE];
        if (!mapping) return;

        if (selectedCourseCode === ADD_NEW_COURSE_OPTION) {
            // If user selects "Add New", set mode to 'add' and prepare a blank form.
            setMode("add");
            setFormData(mapping.initialData());
        } else if (selectedCourseCode) {
            // If user selects an existing course, set mode to 'edit' and find the course data.
            setMode("edit");
            const courseData = internalCourses.find(c => c.courseCode === selectedCourseCode);
            setFormData(courseData ? { ...courseData } : null);
        } else {
            // If nothing is selected, reset the form.
            setMode("select");
            setFormData(null);
        }
    }, [selectedCourseCode, internalCourses, open, isDataLoading]);

    // A generic change handler passed to the CourseForm.
    // Wrapped in useCallback for performance optimization.
    const handleFormChange = useCallback((eventOrData) => {
        // This handles both standard event objects and custom data structures from the form.
        const { name, value } = eventOrData.target 
          ? { name: eventOrData.target.name, value: eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value }
          : eventOrData;

        setFormData((prev) => ({ ...prev, [name]: value }));
        
        // Clear validation errors for a field as the user types.
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            if (newErrors[name]) delete newErrors[name];
            
            // Special case for the dynamic 'hours' array: if it changes, clear all related errors.
            if (name === 'hours' && Array.isArray(value)) {
                Object.keys(newErrors).forEach(key => {
                    if (key.startsWith('hours[')) delete newErrors[key];
                });
            }
            return newErrors;
        });
    }, []);

    // Handler for the save/update button click.
    const handleSave = useCallback(async () => {
        if (!formData || mode === 'select') return;
        setIsLoading(true); setErrors({}); setApiError("");

        const result = await handleSaveOrUpdateRecord('courses', formData, mode, { 
            recordType: COURSE_RECORD_TYPE, 
            editingId: mode === 'edit' ? selectedCourseCode : null 
        });
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess?.(); // Notify parent of success.
            onClose(); // Close the modal.
        } else {
            setErrors(result.errors || {});
            setApiError(result.message || `Failed to ${mode} course.`);
        }
    }, [formData, mode, selectedCourseCode, onSaveSuccess, onClose]);

    // Handler for the delete button click.
    const handleDelete = useCallback(async () => {
        if (mode !== 'edit' || !selectedCourseCode) return;
        
        const courseName = formData?.courseName || selectedCourseCode;
        if (!window.confirm(`DELETE COURSE: "${courseName}"?\n\nThis will permanently delete the course definition, all its calendar meetings, and all associated tasks. This action cannot be undone.`)) return;
        setIsLoading(true);

        const result = await handleDeleteEntity('courses', selectedCourseCode, { recordType: COURSE_RECORD_TYPE });
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess?.();
            onClose();
        } else {
            setApiError(result.message || "Deletion failed.");
        }
    }, [mode, selectedCourseCode, formData, onSaveSuccess, onClose]);

    // A derived state to easily disable UI elements during any loading phase.
    const isActionDisabled = isLoading || isDataLoading;

    return (
        <PopupModal open={open} onClose={() => !isActionDisabled && onClose()} title="Manage Course Definitions" maxWidth="md">
            <Stack spacing={3} sx={{ p: 3, minHeight: 300 }}>
                {apiError && <Alert severity="error">{apiError}</Alert>}
                <FormControl fullWidth disabled={isActionDisabled}>
                    <InputLabel id="course-select-label">Select Course or Action</InputLabel>
                    <Select
                        labelId="course-select-label"
                        label="Select Course or Action"
                        value={selectedCourseCode}
                        onChange={(e) => setSelectedCourseCode(e.target.value)}
                    >
                        <MenuItem value="" disabled><em>Select...</em></MenuItem>
                        <MenuItem value={ADD_NEW_COURSE_OPTION}>--- Add New Course Definition ---</MenuItem>
                        <Divider />
                        {isDataLoading ? (
                            <MenuItem disabled><CircularProgress size={20} sx={{mr: 1}}/> Loading...</MenuItem>
                        ) : (internalCourses || []).map(course => (
                            <MenuItem key={course.courseCode} value={course.courseCode}>
                                {`${course.courseName} (${course.courseCode})`}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {isDataLoading && mode !== 'select' && (
                     <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                )}

                {/* The form and action buttons are only rendered when not loading and form data is ready. */}
                {!isDataLoading && formData && (
                    <>
                      <Divider />
                      <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
                        {mode === 'add' ? 'New Course Details' : `Editing: ${formData.courseName}`}
                      </Typography>
                      {/* The actual CourseForm component is rendered here. */}
                      <CourseForm
                          formData={formData}
                          errors={errors}
                          onChange={handleFormChange}
                          mode={mode}
                          selectOptions={selectOptions}
                      />
                      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            {mode === 'edit' && (
                                <Button color="error" variant="outlined" onClick={handleDelete} disabled={isActionDisabled} sx={{ mr: 'auto' }}>
                                    {isLoading ? "Deleting..." : "Delete Course"}
                                </Button>
                            )}
                            <Button onClick={() => !isActionDisabled && onClose()} disabled={isActionDisabled}>Cancel</Button>
                            <Button variant="contained" onClick={handleSave} disabled={isActionDisabled || !!Object.keys(errors).length} sx={{ minWidth: '220px' }}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : (mode === 'edit' ? "Update & Regenerate" : "Save & Generate")}
                            </Button>
                        </Stack>
                    </>
                )}
            </Stack>
        </PopupModal>
    );
}