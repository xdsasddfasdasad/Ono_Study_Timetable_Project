// src/components/modals/ManageCourseDefinitionModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, Box, CircularProgress, Typography, Button as MuiButton,
  FormControl, InputLabel, Select, MenuItem, FormHelperText
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CourseForm from "./forms/CourseForm";
import CustomButton from "../UI/CustomButton";
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers";
import { validateCourseForm } from "../../utils/validateForm";
import { getRecords } from "../../utils/storage";
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../../utils/courseMeetingGenerator";
import { getEntityKeyByRecordType, getPrimaryKeyFieldByRecordType } from "../../utils/formMappings";

const loadSelectOptions = () => {
    console.log("[CourseDefModal] Loading select options...");
    try {
        const years = getRecords("years") || [];
        const lecturers = getRecords("lecturers") || [];
        const sites = getRecords("sites") || [];
        const allSemesters = years.flatMap(y =>
            (y.semesters || []).map(s => ({
                value: s.semesterCode,
                label: `Sem ${s.semesterNumber} / Y${y.yearNumber} (${s.startDate} - ${s.endDate})`
            }))
        );
        const allRooms = sites.flatMap(site =>
            (site.rooms || []).map(room => ({
                value: room.roomCode,
                label: `${room.roomName || `Room (${room.roomCode})`} @ ${site.siteName || `Site (${site.siteCode})`}`
            }))
        );
        const formattedLecturers = lecturers.map(l => ({
            value: l.id,
            label: `${l.name} (${l.id})`
        }));
        return {
            semesters: allSemesters,
            lecturers: formattedLecturers,
            rooms: allRooms
        };
    } catch (error) {
        console.error("[CourseDefModal] Error loading select options:", error);
        return { semesters: [], lecturers: [], rooms: [] };
    }
};

const ADD_NEW_COURSE_OPTION = "__addNewCourse__";

export default function ManageCourseDefinitionModal({
    open,
    onClose,
    onSaveSuccess,
    existingCourses
}) {
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const [formData, setFormData] = useState(null);
    const [mode, setMode] = useState("select");
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectOptions, setSelectOptions] = useState({ semesters: [], lecturers: [], rooms: [] });
    const getError = (fieldName) => errors[fieldName];

    useEffect(() => {
        if (open) {
            setSelectOptions(loadSelectOptions());
        }
    }, [open]);

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

    useEffect(() => {
        if (!open) return;
        setErrors({});
        setGeneralError("");
        const defaultForm = {
            courseCode: "", courseName: "", semesterCode: "", lecturerId: "",
            roomCode: "", notes: "", zoomMeetinglink: "",
            hours: [{ day: '', start: '', end: '' }]
        };

        if (selectedCourseCode === ADD_NEW_COURSE_OPTION) {
            setMode("add");
            setFormData(defaultForm);
            console.log("[CourseDefModal] Switched to ADD mode.");
        } else if (selectedCourseCode) {
            setMode("edit");
            const courseData = (existingCourses || []).find(c => c.courseCode === selectedCourseCode);
            if (courseData) {
                const initialHours = Array.isArray(courseData.hours) && courseData.hours.length > 0
                                    ? courseData.hours
                                    : defaultForm.hours;
                setFormData({ ...defaultForm, ...courseData, hours: initialHours });
                console.log("[CourseDefModal] Switched to EDIT mode for:", selectedCourseCode);
            } else {
                setFormData(null);
                setMode("select");
                setGeneralError(`Error: Could not find data for selected course ${selectedCourseCode}. Please refresh.`);
            }
        } else {
            setFormData(null);
            setMode("select");
        }
    }, [selectedCourseCode, existingCourses, open]);

    const handleCourseSelectionChange = (event) => {
        setSelectedCourseCode(event.target.value);
    };

    const handleFormChange = useCallback((eventOrData) => {
        setGeneralError("");

        let name, value;
        if (eventOrData.target && typeof eventOrData.target === 'object' && typeof eventOrData.target.name === 'string') {
            name = eventOrData.target.name;
            value = eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value;
            console.log(`[CourseDefModal:handleFormChange] Field Change: ${name} =`, value);
        } else if (typeof eventOrData === 'object' && eventOrData !== null && !Array.isArray(eventOrData) && eventOrData.target?.name === 'hours' && Array.isArray(eventOrData.target.value)) {
             name = 'hours';
             value = eventOrData.target.value;
             console.log(`[CourseDefModal:handleFormChange] Hours Array Change:`, value);
        } else {
             console.warn("[CourseDefModal:handleFormChange] Unhandled change data format:", eventOrData);
             return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
             setErrors((prev) => { const newState = {...prev}; delete newState[name]; return newState; });
        }
         if (name === 'hours') {
              setErrors((prev) => {
                  const newErrors = { ...prev };
                  Object.keys(newErrors).forEach(key => {
                      if (key.startsWith('hours[') || key === 'hours') delete newErrors[key];
                  });
                  return newErrors;
              });
         }

    }, [errors]);

    const handleSave = useCallback(async () => {
        if (!formData || (mode !== 'add' && mode !== 'edit')) return;

        setIsLoading(true); setErrors({}); setGeneralError("");
        console.log(`[CourseDefModal:Save] Attempting to ${mode} course definition...`);

        const courseRecordType = 'course';
        const coursePrimaryKey = getPrimaryKeyFieldByRecordType(courseRecordType);
        const validationExtra = {
            existingCourses: existingCourses || [],
            editingId: mode === 'edit' ? selectedCourseCode : null,
        };
        const validationErrors = validateCourseForm(formData, validationExtra.existingCourses, validationExtra);
        if (Object.keys(validationErrors).length > 0) {
            console.warn("[CourseDefModal:Save] Validation failed:", validationErrors);
            setErrors(validationErrors); setIsLoading(false);
            setGeneralError("Please fix the errors in the form."); return;
        }

        console.log("[CourseDefModal:Save] Validation passed. Saving definition...");
        const entityKey = getEntityKeyByRecordType(courseRecordType);
        if (!entityKey) { setIsLoading(false); return; }

        const resultDefinition = await handleSaveOrUpdateRecord(
            entityKey, formData, mode, validationExtra, true
        );
        if (!resultDefinition.success) {
            console.error("[CourseDefModal:Save] Failed to save definition:", resultDefinition.message);
            setErrors(resultDefinition.errors || {});
            setGeneralError(resultDefinition.message || `Failed to ${mode} course definition.`);
            setIsLoading(false); return;
        }
        const courseCode = formData[coursePrimaryKey];
        if (!courseCode) {
             console.error("[CourseDefModal:Save] Course code missing in formData after save!");
             setGeneralError("Internal error: Course code missing after save.");
             setIsLoading(false); return;
        }
        console.log(`[CourseDefModal:Save] Definition saved. Regenerating meetings for ${courseCode}...`);
        const regenerationSuccess = regenerateMeetingsForCourse(courseCode);

        setIsLoading(false);
        if (regenerationSuccess) {
            console.log("[CourseDefModal:Save] All operations successful.");
            onSaveSuccess?.();
            onClose?.();
        } else {
            console.error(`[CourseDefModal:Save] Definition ${mode}d, but meeting regeneration FAILED for ${courseCode}.`);
            alert(`Warning: Course definition ${mode}d successfully, but failed to regenerate the schedule meetings. The schedule might be out of date. Please review or try editing again.`);
            onSaveSuccess?.();
            onClose?.();
        }
    }, [formData, mode, selectedCourseCode, existingCourses, onClose, onSaveSuccess]);


    const handleDelete = useCallback(async () => {
        if (mode !== 'edit' || !selectedCourseCode || !formData) return;

        const coursePrimaryKey = getPrimaryKeyFieldByRecordType('course');
        const courseCodeToDelete = selectedCourseCode;
        const courseName = formData.courseName || courseCodeToDelete;

        if (!window.confirm(`DELETE COURSE:\n"${courseName}" (${courseCodeToDelete})\n\nWARNING: This deletes the definition AND ALL schedule meetings.\n\nAre you sure?`)) return;

        setIsDeleting(true); setErrors({}); setGeneralError("");
        console.log(`[CourseDefModal:Delete] Deleting definition ${courseCodeToDelete}...`);
        const entityKey = getEntityKeyByRecordType('course');
        if (!entityKey) {setIsDeleting(false); return; }
        let definitionDeleted = false;
        await handleDeleteEntityFormSubmit(
            entityKey, courseCodeToDelete,
            (msg) => { console.log(`[CourseDefModal:Delete] ${msg}`); definitionDeleted = true; },
            (errMsg) => { console.error(`[CourseDefModal:Delete] Definition delete failed: ${errMsg}`); setGeneralError(errMsg); },
            null
        );
        if (!definitionDeleted) { setIsDeleting(false); return; }
        console.log(`[CourseDefModal:Delete] Deleting associated meetings for ${courseCodeToDelete}...`);
        const meetingsDeleted = deleteMeetingsForCourse(courseCodeToDelete);

        setIsDeleting(false);
        if (meetingsDeleted) {
            console.log("[CourseDefModal:Delete] Course and meetings deleted successfully.");
            onSaveSuccess?.(); onClose?.();
        } else {
            console.error(`[CourseDefModal:Delete] Definition ${courseCodeToDelete} deleted, but FAILED to delete meetings.`);
            alert("Warning: Course definition deleted, but failed to remove its meetings. Manual cleanup might be needed via storage inspection.");
            onSaveSuccess?.(); onClose?.();
        }
    }, [mode, selectedCourseCode, formData, onClose, onSaveSuccess]);

    return (
        <PopupModal open={open} onClose={() => !isLoading && !isDeleting && onClose()} title="Manage Course Definition" maxWidth="md">
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                {generalError && <Alert severity="error" sx={{ mb: 1 }}>{generalError}</Alert>}

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
                {selectedCourseCode && <Box sx={{ borderBottom: 1, borderColor: 'divider', my: 2 }} />}
                {formData && (
                     <CourseForm
                        formData={formData}
                        errors={errors}
                        onChange={handleFormChange}
                        mode={mode}
                        selectOptions={selectOptions}
                    />
                )}

                {formData && (
                     <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ pt: 1 }}>
                         <Box>
                            {mode === 'edit' && (
                                <MuiButton color="error" variant="outlined" onClick={handleDelete} disabled={isLoading || isDeleting} startIcon={isDeleting ? <CircularProgress size={18} color="inherit"/> : null} >
                                    {isDeleting ? "Deleting..." : "Delete Course & Meetings"}
                                </MuiButton>
                            )}
                        </Box>
                        <Stack direction="row" spacing={1}>
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