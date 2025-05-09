import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, Box, CircularProgress, Typography, Button as MuiButton,
  FormControl, InputLabel, Select, MenuItem, FormHelperText
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CourseForm from "./forms/CourseForm";
import CustomButton from "../UI/CustomButton";
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers"; // Now async
import { validateCourseForm } from "../../utils/validateForm"; // Now async
import { fetchCollection } from "../../firebase/firestoreService"; // Use Firestore service
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../../utils/courseMeetingGenerator"; // Now async
import { getEntityKeyByRecordType, getPrimaryKeyFieldByRecordType } from "../../utils/formMappings";

// Helper to load data for CourseForm dropdowns - NOW ASYNC
const loadSelectOptions = async () => {
    console.log("[CourseDefModal] Loading select options from Firestore...");
    try {
        const [years, lecturers, sites] = await Promise.all([
            fetchCollection("years"),
            fetchCollection("lecturers"),
            fetchCollection("sites")
        ]);

        const allSemesters = (years || []).flatMap(y =>
            (y.semesters || []).map(s => ({
                value: s.semesterCode,
                label: `Sem ${s.semesterNumber} / Y${y.yearNumber} (${s.startDate} - ${s.endDate})`
            }))
        );
        const allRooms = (sites || []).flatMap(site =>
            (site.rooms || []).map(room => ({
                value: room.roomCode,
                label: `${room.roomName || room.roomCode} @ ${site.siteName || site.siteCode}`
            }))
        );
        const formattedLecturers = (lecturers || []).map(l => ({
            value: l.id,
            label: `${l.name} (${l.id})`
        }));
        return { semesters: allSemesters, lecturers: formattedLecturers, rooms: allRooms };
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
    existingCourses // Passed from parent, assumed to be up-to-date from Firestore
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
            const fetchOptions = async () => {
                const options = await loadSelectOptions();
                setSelectOptions(options);
            };
            fetchOptions();
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            setSelectedCourseCode(""); setFormData(null); setMode("select");
            setErrors({}); setGeneralError(""); setIsLoading(false); setIsDeleting(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setErrors({}); setGeneralError("");
        const defaultForm = { courseCode: "", courseName: "", semesterCode: "", lecturerId: "", roomCode: "", notes: "", zoomMeetinglink: "", hours: [{ day: '', start: '', end: '' }] };

        if (selectedCourseCode === ADD_NEW_COURSE_OPTION) {
            setMode("add"); setFormData(defaultForm);
        } else if (selectedCourseCode) {
            setMode("edit");
            const courseData = (existingCourses || []).find(c => c.courseCode === selectedCourseCode);
            if (courseData) {
                const initialHours = Array.isArray(courseData.hours) && courseData.hours.length > 0 ? courseData.hours : defaultForm.hours;
                setFormData({ ...defaultForm, ...courseData, hours: initialHours });
            } else {
                setFormData(null); setMode("select");
                setGeneralError(`Error: Could not find course ${selectedCourseCode}.`);
            }
        } else {
            setFormData(null); setMode("select");
        }
    }, [selectedCourseCode, existingCourses, open]);

    const handleCourseSelectionChange = (event) => { setSelectedCourseCode(event.target.value); };

    const handleFormChange = useCallback((eventOrData) => {
        setGeneralError("");
        let name, value;
        if (eventOrData.target?.name && typeof eventOrData.target.name === 'string') {
            name = eventOrData.target.name;
            value = eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value;
        } else if (typeof eventOrData === 'object' && eventOrData !== null && eventOrData.name === 'hours' && Array.isArray(eventOrData.value)) {
            name = 'hours'; value = eventOrData.value; // Assuming CourseForm calls onChange({name:'hours', value: newHours})
        } else { console.warn("[CourseDefModal:FormChange] Unhandled:", eventOrData); return; }
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) { setErrors((prev) => { const newE = {...prev}; delete newE[name]; return newE; });}
        if (name === 'hours') { /* Clear hours array errors */ }
    }, [errors]);

    const handleSave = useCallback(async () => {
        if (!formData || (mode !== 'add' && mode !== 'edit')) return;
        setIsLoading(true); setErrors({}); setGeneralError("");
        const courseRecordType = 'course';
        const coursePrimaryKey = getPrimaryKeyFieldByRecordType(courseRecordType);

        const validationExtra = {
            editingId: mode === 'edit' ? selectedCourseCode : null,
            // existingCourses is no longer primary for validation, validateCourseForm queries Firestore
        };
        const validationErrors = await validateCourseForm(formData, validationExtra); // Pass only options now

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors); setIsLoading(false);
            setGeneralError("Please fix errors in the form."); return;
        }

        const entityKey = getEntityKeyByRecordType(courseRecordType);
        if (!entityKey) { setIsLoading(false); setGeneralError("Config error."); return; }

        const resultDefinition = await handleSaveOrUpdateRecord(entityKey, formData, mode, validationExtra, true);

        if (!resultDefinition.success) {
            setErrors(resultDefinition.errors || {});
            setGeneralError(resultDefinition.message || `Failed to ${mode} definition.`);
            setIsLoading(false); return;
        }

        const courseCode = formData[coursePrimaryKey];
        if (!courseCode) {
             setGeneralError("Internal error: Course code missing after save.");
             setIsLoading(false); return;
        }
        const regenerationSuccess = await regenerateMeetingsForCourse(courseCode);
        setIsLoading(false);

        if (regenerationSuccess) {
            onSaveSuccess?.(); onClose?.();
        } else {
            alert(`Warning: Definition ${mode}d, but meetings failed to regenerate.`);
            onSaveSuccess?.(); onClose?.();
        }
    }, [formData, mode, selectedCourseCode, existingCourses, onClose, onSaveSuccess]);

    const handleDelete = useCallback(async () => {
        if (mode !== 'edit' || !selectedCourseCode || !formData) return;
        const coursePrimaryKey = getPrimaryKeyFieldByRecordType('course');
        const courseCodeToDelete = selectedCourseCode;
        const courseName = formData.courseName || courseCodeToDelete;

        if (!window.confirm(`DELETE COURSE: "${courseName}" (${courseCodeToDelete})?\nThis deletes definition AND ALL meetings.`)) return;
        setIsDeleting(true); setErrors({}); setGeneralError("");

        const entityKey = getEntityKeyByRecordType('course');
        if (!entityKey) { setIsDeleting(false); setGeneralError("Config error."); return; }
        let definitionDeleted = false;
        await handleDeleteEntityFormSubmit(
            entityKey, courseCodeToDelete,
            (msg) => { definitionDeleted = true; }, (errMsg) => { setGeneralError(errMsg); }, null
        );

        if (!definitionDeleted) { setIsDeleting(false); return; }
        const meetingsDeleted = await deleteMeetingsForCourse(courseCodeToDelete);
        setIsDeleting(false);

        if (meetingsDeleted) { onSaveSuccess?.(); onClose?.(); }
        else { alert("Warning: Definition deleted, but meetings failed to delete."); onSaveSuccess?.(); onClose?.(); }
    }, [mode, selectedCourseCode, formData, onClose, onSaveSuccess]);

    return (
        <PopupModal open={open} onClose={() => !isLoading && !isDeleting && onClose()} title="Manage Course Definition" maxWidth="md">
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                {generalError && <Alert severity="error" sx={{ mb: 1 }}>{generalError}</Alert>}
                <FormControl fullWidth error={!!getError('courseSelection')} disabled={isLoading || isDeleting}>
                    <InputLabel id="manage-course-select-label">Select Course or Add New</InputLabel>
                    <Select labelId="manage-course-select-label" label="Select Course or Add New" value={selectedCourseCode} onChange={handleCourseSelectionChange}>
                        <MenuItem value="" disabled><em>Select Action...</em></MenuItem>
                        <MenuItem value={ADD_NEW_COURSE_OPTION} sx={{ fontStyle: 'italic', color: 'primary.main' }}>--- Add New Course ---</MenuItem>
                        {(existingCourses || []).length > 0 && <MenuItem value="" disabled>--- Edit Existing ---</MenuItem> }
                        {(existingCourses || []).map(course => ( <MenuItem key={course?.courseCode || Math.random()} value={course?.courseCode}> {course?.courseName || 'Unnamed'} ({course?.courseCode || 'No Code'}) </MenuItem> ))}
                        {(existingCourses || []).length === 0 && <MenuItem value="" disabled>No existing courses to edit</MenuItem>}
                    </Select>
                    {getError('courseSelection') && <FormHelperText>{getError('courseSelection')}</FormHelperText>}
                </FormControl>
                {selectedCourseCode && <Box sx={{ borderBottom: 1, borderColor: 'divider', my: 2 }} />}
                {formData && ( <CourseForm formData={formData} errors={errors} onChange={handleFormChange} mode={mode} selectOptions={selectOptions} /> )}
                {formData && (
                     <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ pt: 1 }}>
                         <Box> {mode === 'edit' && ( <MuiButton color="error" variant="outlined" onClick={handleDelete} disabled={isLoading || isDeleting} startIcon={isDeleting ? <CircularProgress size={18} color="inherit"/> : null} > {isDeleting ? "Deleting..." : "Delete Course & Meetings"} </MuiButton> )} </Box>
                        <Stack direction="row" spacing={1}>
                            <CustomButton variant="outlined" onClick={() => !isLoading && !isDeleting && onClose()} disabled={isLoading || isDeleting}> Cancel </CustomButton>
                            <CustomButton onClick={handleSave} disabled={isLoading || isDeleting || Object.values(errors).some(e => !!e)} startIcon={isLoading ? <CircularProgress size={18} color="inherit"/> : null} > {isLoading ? "Saving..." : (mode === 'edit' ? "Update & Regenerate" : "Save & Generate")} </CustomButton>
                        </Stack>
                     </Stack>
                )}
            </Stack>
        </PopupModal>
    );
}