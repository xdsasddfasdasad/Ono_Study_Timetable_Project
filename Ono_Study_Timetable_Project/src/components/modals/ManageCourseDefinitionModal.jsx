// src/components/modals/ManageCourseDefinitionModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, Box, CircularProgress, Typography, Button as MuiButton,
  FormControl, InputLabel, Select, MenuItem, FormHelperText
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CourseForm from "./forms/CourseForm"; // The specific form
import CustomButton from "../UI/CustomButton";
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers";
import { validateCourseForm } from "../../utils/validateForm";
import { getRecords } from "../../utils/storage";
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../../utils/courseMeetingGenerator";
import { getEntityKeyByRecordType, getPrimaryKeyFieldByRecordType } from "../../utils/formMappings";

// Helper to load data for CourseForm dropdowns
const loadSelectOptions = () => {
    console.log("[CourseDefModal] Loading select options...");
    try {
        // Fetch all necessary data lists for dropdowns
        const years = getRecords("years") || [];
        const lecturers = getRecords("lecturers") || [];
        const sites = getRecords("sites") || [];

        // Format Semesters: value=semesterCode, label=Sem X / YYYY (Start - End)
        const allSemesters = years.flatMap(y =>
            (y.semesters || []).map(s => ({
                value: s.semesterCode,
                label: `Sem ${s.semesterNumber} / Y${y.yearNumber} (${s.startDate} - ${s.endDate})`
            }))
        );

        // Format Rooms: value=roomCode, label=Room Name @ Site Name
        const allRooms = sites.flatMap(site =>
            (site.rooms || []).map(room => ({
                value: room.roomCode,
                label: `${room.roomName || `Room (${room.roomCode})`} @ ${site.siteName || `Site (${site.siteCode})`}`
            }))
        );

        // Format Lecturers: value=id, label=Lecturer Name (ID)
        const formattedLecturers = lecturers.map(l => ({
            value: l.id,
            label: `${l.name} (${l.id})`
        }));

        // Return structured options
        return {
            semesters: allSemesters,
            lecturers: formattedLecturers,
            rooms: allRooms
        };
    } catch (error) {
        console.error("[CourseDefModal] Error loading select options:", error);
        // Return empty arrays on error to prevent crashes
        return { semesters: [], lecturers: [], rooms: [] };
    }
};

// Special value for the "Add New Course" option in the select dropdown
const ADD_NEW_COURSE_OPTION = "__addNewCourse__";

// --- Main Modal Component for Managing Course Definitions ---
export default function ManageCourseDefinitionModal({
    open,             // Boolean: Controls overall modal visibility
    onClose,          // Function: Callback to close the modal
    onSaveSuccess,    // Function: Callback after successful save/delete (for parent refresh)
    // initialData is not directly used anymore, selection determines edit target
    existingCourses   // Array: List of existing course definitions (passed from parent)
}) {
    // --- State Variables ---
    const [selectedCourseCode, setSelectedCourseCode] = useState(""); // Tracks the value of the top Select dropdown
    const [formData, setFormData] = useState(null); // Holds the data for the CourseForm (null hides the form)
    const [mode, setMode] = useState("select"); // Current mode: 'select', 'add', 'edit'
    const [errors, setErrors] = useState({}); // Field-specific validation errors
    const [generalError, setGeneralError] = useState(""); // General error messages
    const [isLoading, setIsLoading] = useState(false); // Loading indicator for Save/Update
    const [isDeleting, setIsDeleting] = useState(false); // Loading indicator for Delete
    const [selectOptions, setSelectOptions] = useState({ semesters: [], lecturers: [], rooms: [] }); // Holds dropdown options

    // --- Helper Functions ---
    // Safely gets error message for a field from the errors state
    const getError = (fieldName) => errors[fieldName];

    // --- Effects ---
    // Load dropdown options when the modal opens
    useEffect(() => {
        if (open) {
            setSelectOptions(loadSelectOptions());
        }
    }, [open]);

    // Reset the entire modal state when it closes
    useEffect(() => {
        if (!open) {
            setSelectedCourseCode("");
            setFormData(null);
            setMode("select");
            setErrors({});
            setGeneralError("");
            setIsLoading(false);
            setIsDeleting(false);
        }
    }, [open]);

    // Effect to load/reset the CourseForm data based on the top selection
    useEffect(() => {
        // Don't run if the modal is closed
        if (!open) return;

        // Clear previous form errors when selection changes
        setErrors({});
        setGeneralError("");

        // Define the default structure for a new course, including an empty hours slot
        const defaultForm = {
            courseCode: "", courseName: "", semesterCode: "", lecturerId: "",
            roomCode: "", notes: "", zoomMeetinglink: "",
            hours: [{ day: '', start: '', end: '' }] // Start with one row for hours
        };

        if (selectedCourseCode === ADD_NEW_COURSE_OPTION) {
            // User selected "Add New Course"
            setMode("add");
            setFormData(defaultForm); // Set formData to the empty structure
            console.log("[CourseDefModal] Switched to ADD mode.");
        } else if (selectedCourseCode) {
            // User selected an existing course code
            setMode("edit");
            // Find the selected course data from the list passed via props
            const courseData = (existingCourses || []).find(c => c.courseCode === selectedCourseCode);
            if (courseData) {
                // Ensure 'hours' array exists and isn't empty for the form
                const initialHours = Array.isArray(courseData.hours) && courseData.hours.length > 0
                                    ? courseData.hours
                                    : defaultForm.hours; // Use default empty slot if missing/empty
                // Set formData by merging existing data over the default structure
                setFormData({ ...defaultForm, ...courseData, hours: initialHours });
                console.log("[CourseDefModal] Switched to EDIT mode for:", selectedCourseCode);
            } else {
                // If the selected courseCode is not found (should be rare)
                setFormData(null); // Hide the form
                setMode("select"); // Revert mode
                setGeneralError(`Error: Could not find data for selected course ${selectedCourseCode}. Please refresh.`);
            }
        } else {
            // No course is selected (initial state or user cleared selection)
            setFormData(null); // Hide the form
            setMode("select");
        }
        // Dependencies: selection, course list, and open state
    }, [selectedCourseCode, existingCourses, open]);

    // --- Handlers ---
    // Handles selection change in the top "Select Course or Add New" dropdown
    const handleCourseSelectionChange = (event) => {
        setSelectedCourseCode(event.target.value);
    };

    // Unified handler passed to CourseForm for all its field changes
    const handleFormChange = useCallback((eventOrData) => {
        setGeneralError(""); // Clear general error on any form interaction

        // --- ✅ Corrected Logic to Handle Both Event and Data ---
        let name, value;
        if (eventOrData.target && typeof eventOrData.target === 'object' && typeof eventOrData.target.name === 'string') {
            // Standard input event (TextField, Select, Checkbox)
            name = eventOrData.target.name;
            value = eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value;
            console.log(`[CourseDefModal:handleFormChange] Field Change: ${name} =`, value);
        } else if (typeof eventOrData === 'object' && eventOrData !== null && !Array.isArray(eventOrData) && eventOrData.target?.name === 'hours' && Array.isArray(eventOrData.target.value)) {
             // Specific case for hours array update from CourseForm (if passed via event structure)
             name = 'hours';
             value = eventOrData.target.value;
             console.log(`[CourseDefModal:handleFormChange] Hours Array Change:`, value);
        // } else if (Array.isArray(eventOrData)) { // Alternative if hours array comes directly
        //      name = 'hours';
        //      value = eventOrData;
        //      console.log(`[CourseDefModal:handleFormChange] Hours Array Change (Direct):`, value);
        } else {
             console.warn("[CourseDefModal:handleFormChange] Unhandled change data format:", eventOrData);
             return; // Do not proceed if format is unexpected
        }

        // Update the form data state
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear any existing validation error for the changed field
        if (errors[name]) {
             setErrors((prev) => { const newState = {...prev}; delete newState[name]; return newState; });
        }
         // Clear specific errors for hours array slots
         if (name === 'hours') {
              setErrors((prev) => {
                  const newErrors = { ...prev };
                  Object.keys(newErrors).forEach(key => {
                      if (key.startsWith('hours[') || key === 'hours') delete newErrors[key];
                  });
                  return newErrors;
              });
         }

    }, [errors]); // Dependency on errors state for clearing logic


    // Handle Save/Update button click
    const handleSave = useCallback(async () => {
        // Ensure form data exists and we are in a valid mode
        if (!formData || (mode !== 'add' && mode !== 'edit')) return;

        setIsLoading(true); setErrors({}); setGeneralError("");
        console.log(`[CourseDefModal:Save] Attempting to ${mode} course definition...`);

        const courseRecordType = 'course';
        const coursePrimaryKey = getPrimaryKeyFieldByRecordType(courseRecordType); // 'courseCode'

        // 1. Validate the entire formData using the central validation function
        const validationExtra = {
            existingCourses: existingCourses || [],
            // Provide the ID being edited ONLY if in edit mode
            editingId: mode === 'edit' ? selectedCourseCode : null,
            // Add any other context needed by validateCourseForm (e.g., selectOptions if checking existence)
        };
        const validationErrors = validateCourseForm(formData, validationExtra.existingCourses, validationExtra);

        // If validation fails, display errors and stop
        if (Object.keys(validationErrors).length > 0) {
            console.warn("[CourseDefModal:Save] Validation failed:", validationErrors);
            setErrors(validationErrors); setIsLoading(false);
            setGeneralError("Please fix the errors in the form."); return;
        }

        // 2. Save/Update the Course Definition using the handler
        console.log("[CourseDefModal:Save] Validation passed. Saving definition...");
        const entityKey = getEntityKeyByRecordType(courseRecordType); // "courses"
        if (!entityKey) { /* Handle config error */ setIsLoading(false); return; }

        // Use the current formData which should be valid
        const resultDefinition = await handleSaveOrUpdateRecord(
            entityKey, formData, mode, validationExtra, true // Skip handler's validation
        );

        // If saving the definition fails, show error and stop
        if (!resultDefinition.success) {
            console.error("[CourseDefModal:Save] Failed to save definition:", resultDefinition.message);
            setErrors(resultDefinition.errors || {});
            setGeneralError(resultDefinition.message || `Failed to ${mode} course definition.`);
            setIsLoading(false); return;
        }

        // 3. Regenerate Meetings using the utility function
        // Use the courseCode from the formData (which might be newly generated/entered or existing)
        const courseCode = formData[coursePrimaryKey];
        if (!courseCode) {
             console.error("[CourseDefModal:Save] Course code missing in formData after save!");
             setGeneralError("Internal error: Course code missing after save.");
             setIsLoading(false); return; // Stop if code is missing
        }
        console.log(`[CourseDefModal:Save] Definition saved. Regenerating meetings for ${courseCode}...`);
        // Call the generator utility function
        const regenerationSuccess = regenerateMeetingsForCourse(courseCode);

        setIsLoading(false); // Finish loading state

        // 4. Handle Regeneration Result & Final Actions
        if (regenerationSuccess) {
            console.log("[CourseDefModal:Save] All operations successful.");
            onSaveSuccess?.(); // Notify parent to refresh everything
            onClose?.();        // Close this modal
        } else {
            console.error(`[CourseDefModal:Save] Definition ${mode}d, but meeting regeneration FAILED for ${courseCode}.`);
            // Alert the user but close the modal, as the definition *is* saved
            alert(`Warning: Course definition ${mode}d successfully, but failed to regenerate the schedule meetings. The schedule might be out of date. Please review or try editing again.`);
            onSaveSuccess?.(); // Still trigger refresh as definition changed
            onClose?.();
        }
    }, [formData, mode, selectedCourseCode, existingCourses, onClose, onSaveSuccess]); // Dependencies


    // Handle Delete button click
    const handleDelete = useCallback(async () => {
        // Can only delete if in edit mode and a course is selected
        if (mode !== 'edit' || !selectedCourseCode || !formData) return;

        const coursePrimaryKey = getPrimaryKeyFieldByRecordType('course'); // 'courseCode'
        const courseCodeToDelete = selectedCourseCode; // Use the selected code
        const courseName = formData.courseName || courseCodeToDelete;

        if (!window.confirm(`DELETE COURSE:\n"${courseName}" (${courseCodeToDelete})\n\nWARNING: This deletes the definition AND ALL schedule meetings.\n\nAre you sure?`)) return;

        setIsDeleting(true); setErrors({}); setGeneralError("");
        console.log(`[CourseDefModal:Delete] Deleting definition ${courseCodeToDelete}...`);

        // 1. Delete Course Definition
        const entityKey = getEntityKeyByRecordType('course'); // "courses"
        if (!entityKey) { /* Handle config error */ setIsDeleting(false); return; }
        let definitionDeleted = false;
        await handleDeleteEntityFormSubmit(
            entityKey, courseCodeToDelete,
            (msg) => { console.log(`[CourseDefModal:Delete] ${msg}`); definitionDeleted = true; },
            (errMsg) => { console.error(`[CourseDefModal:Delete] Definition delete failed: ${errMsg}`); setGeneralError(errMsg); },
            null // No parentId for courses
        );

        // Stop if definition deletion failed
        if (!definitionDeleted) { setIsDeleting(false); return; }

        // 2. Delete Associated Meetings
        console.log(`[CourseDefModal:Delete] Deleting associated meetings for ${courseCodeToDelete}...`);
        const meetingsDeleted = deleteMeetingsForCourse(courseCodeToDelete);

        setIsDeleting(false); // Finish deleting state

        // 3. Handle Final Result
        if (meetingsDeleted) {
            console.log("[CourseDefModal:Delete] Course and meetings deleted successfully.");
            onSaveSuccess?.(); onClose?.(); // Refresh and close
        } else {
            console.error(`[CourseDefModal:Delete] Definition ${courseCodeToDelete} deleted, but FAILED to delete meetings.`);
            alert("Warning: Course definition deleted, but failed to remove its meetings. Manual cleanup might be needed via storage inspection.");
            onSaveSuccess?.(); onClose?.(); // Refresh and close anyway
        }
    }, [mode, selectedCourseCode, formData, onClose, onSaveSuccess]); // Dependencies

    // --- Render Logic ---
    return (
        <PopupModal open={open} onClose={() => !isLoading && !isDeleting && onClose()} title="Manage Course Definition" maxWidth="md">
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                {generalError && <Alert severity="error" sx={{ mb: 1 }}>{generalError}</Alert>}

                {/* Step 1: Course Selection Dropdown */}
                <FormControl fullWidth error={!!getError('courseSelection')} disabled={isLoading || isDeleting}>
                    <InputLabel id="manage-course-select-label">Select Course to Edit or Add New</InputLabel>
                    <Select
                        labelId="manage-course-select-label"
                        label="Select Course to Edit or Add New"
                        value={selectedCourseCode}
                        onChange={handleCourseSelectionChange}
                    >
                        <MenuItem value="" disabled><em>Select Action...</em></MenuItem>
                        <MenuItem value={ADD_NEW_COURSE_OPTION} sx={{ fontStyle: 'italic', color: 'primary.main' }}>--- Add New Course ---</MenuItem>
                        { (existingCourses || []).length > 0 && <MenuItem value="" disabled>--- Edit Existing ---</MenuItem> }
                        {(existingCourses || []).map(course => (
                            <MenuItem key={course?.courseCode || Math.random()} value={course?.courseCode}>
                                {course?.courseName || 'Unnamed'} ({course?.courseCode || 'No Code'})
                            </MenuItem>
                        ))}
                        {(existingCourses || []).length === 0 && <MenuItem value="" disabled>No existing courses to edit</MenuItem>}
                    </Select>
                    {getError('courseSelection') && <FormHelperText>{getError('courseSelection')}</FormHelperText>}
                </FormControl>

                {/* Divider or spacing could be added here */}
                {selectedCourseCode && <Box sx={{ borderBottom: 1, borderColor: 'divider', my: 2 }} />}


                {/* Step 2: Render the Course Form (only if a selection is made or 'Add New') */}
                {formData && (
                     <CourseForm
                        formData={formData}
                        errors={errors}
                        onChange={handleFormChange} // Pass the corrected handler
                        mode={mode}
                        selectOptions={selectOptions}
                    />
                )}

                {/* Action Buttons (Show only when form is visible) */}
                {formData && (
                     <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ pt: 1 }}>
                         <Box> {/* Delete Button */}
                            {mode === 'edit' && (
                                <MuiButton color="error" variant="outlined" onClick={handleDelete} disabled={isLoading || isDeleting} startIcon={isDeleting ? <CircularProgress size={18} color="inherit"/> : null} >
                                    {isDeleting ? "Deleting..." : "Delete Course & Meetings"}
                                </MuiButton>
                            )}
                        </Box>
                        <Stack direction="row" spacing={1}> {/* Cancel/Save */}
                            <CustomButton variant="outlined" onClick={() => !isLoading && !isDeleting && onClose()} disabled={isLoading || isDeleting}> Cancel </CustomButton>
                            <CustomButton onClick={handleSave} disabled={isLoading || isDeleting || Object.values(errors).some(e => !!e)} startIcon={isLoading ? <CircularProgress size={18} color="inherit"/> : null} >
                               {isLoading ? "Saving..." : (mode === 'edit' ? "Update & Regenerate" : "Save & Generate")}
                            </CustomButton>
                        </Stack>
                     </Stack>
                )}
            </Stack>
        </PopupModal>
    );
}