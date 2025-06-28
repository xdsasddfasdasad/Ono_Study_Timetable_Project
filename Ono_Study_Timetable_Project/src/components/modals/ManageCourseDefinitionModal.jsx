import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, CircularProgress, Typography, Button,
  FormControl, InputLabel, Select, MenuItem, Divider, Box
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CourseForm from "./forms/CourseForm";
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// ✨ FIX: The entire loadSelectOptions function is replaced with this more robust version.
const loadSelectOptions = async (allCourses = []) => {
    try {
        const [years, lecturers, sites] = await Promise.all([
            fetchCollection("years"), 
            fetchCollection("lecturers"), 
            fetchCollection("sites")
        ]);

        const semesterMap = new Map();

        // 1. Load all semesters that are properly nested in years
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

        // 2. Ensure that any semesterCode attached to an existing course is also included,
        //    even if it's "orphaned" (not yet in a year object).
        (allCourses || []).forEach(course => {
            if (course.semesterCode && !semesterMap.has(course.semesterCode)) {
                // If the semester isn't in our map, add it with a generic label
                semesterMap.set(course.semesterCode, {
                    value: course.semesterCode,
                    label: `Orphaned Semester (${course.semesterCode})` // This label indicates a data issue
                });
            }
        });
        
        // 3. Convert map to a sorted array
        const allSemesters = Array.from(semesterMap.values()).sort((a, b) => a.label.localeCompare(b.label));

        // Sort lecturers and rooms
        const allRooms = (sites || []).flatMap(site => (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName} @ ${site.siteName}` }))).sort((a, b) => a.label.localeCompare(b.label));
        const formattedLecturers = (lecturers || []).map(l => ({ value: l.id, label: `${l.name} (${l.id})` })).sort((a, b) => a.label.localeCompare(b.label));

        return { semesters: allSemesters, lecturers: formattedLecturers, rooms: allRooms };
    } catch (error) {
        console.error("[CourseModal] Error loading select options:", error);
        return { semesters: [], lecturers: [], rooms: [] };
    }
};

const ADD_NEW_COURSE_OPTION = "__addNewCourse__";
const COURSE_RECORD_TYPE = 'course';

export default function ManageCourseDefinitionModal({
    open,
    onClose,
    onSaveSuccess,
}) {
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const [formData, setFormData] = useState(null);
    const [mode, setMode] = useState("select");
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectOptions, setSelectOptions] = useState({ semesters: [], lecturers: [], rooms: [] });
    
    const [internalCourses, setInternalCourses] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (open) {
            setIsDataLoading(true);
            
            // ✨ FIX: First fetch courses, then pass them to loadSelectOptions
            fetchCollection("courses").then(coursesData => {
                const courses = coursesData || [];
                setInternalCourses(courses);

                // Now load select options, providing the context of all existing courses
                loadSelectOptions(courses).then(options => {
                    setSelectOptions(options);
                    setIsDataLoading(false); // Finish loading only after everything is ready
                });
            }).catch(err => {
                setApiError("Failed to load initial data.");
                setIsDataLoading(false);
            });
        } else {
            // Reset state on close
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

    useEffect(() => {
        if (isDataLoading) {
            return; 
        }
        setErrors({}); 
        setApiError("");
        
        const mapping = formMappings[COURSE_RECORD_TYPE];
        if (!mapping) return;

        if (selectedCourseCode === ADD_NEW_COURSE_OPTION) {
            setMode("add");
            setFormData(mapping.initialData());
        } else if (selectedCourseCode) {
            setMode("edit");
            const courseData = internalCourses.find(c => c.courseCode === selectedCourseCode);
            setFormData(courseData ? { ...courseData } : null);
        } else {
            setMode("select");
            setFormData(null);
        }
    }, [selectedCourseCode, internalCourses, open, isDataLoading]);

    const handleFormChange = useCallback((eventOrData) => {
        const { name, value } = eventOrData.target 
          ? { name: eventOrData.target.name, value: eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value }
          : eventOrData;

        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            if (newErrors[name]) {
                delete newErrors[name];
            }
            if (name === 'hours' && Array.isArray(value)) {
                Object.keys(newErrors).forEach(key => {
                    if (key.startsWith('hours[')) {
                        delete newErrors[key];
                    }
                });
            }
            return newErrors;
        });
    }, []);

    const handleSave = useCallback(async () => {
        if (!formData || mode === 'select') return;
        setIsLoading(true); setErrors({}); setApiError("");

        const result = await handleSaveOrUpdateRecord('courses', formData, mode, { 
            recordType: COURSE_RECORD_TYPE, 
            editingId: mode === 'edit' ? selectedCourseCode : null 
        });
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess?.();
            onClose();
        } else {
            setErrors(result.errors || {});
            setApiError(result.message || `Failed to ${mode} course.`);
        }
    }, [formData, mode, selectedCourseCode, onSaveSuccess, onClose]);

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

                {!isDataLoading && formData && (
                    <>
                      <Divider />
                      <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
                        {mode === 'add' ? 'New Course Details' : `Editing: ${formData.courseName}`}
                      </Typography>
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