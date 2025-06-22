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

const loadSelectOptions = async () => {
    try {
        const [years, lecturers, sites] = await Promise.all([
            fetchCollection("years"), 
            fetchCollection("lecturers"), 
            fetchCollection("sites")
        ]);
        const allSemesters = (years || [])
            .flatMap(y => (y.semesters || []).map(s => ({ ...s, yearNumber: y.yearNumber })))
            // ✨ FIX 1.3: Sort semesters here during generation
            .sort((a, b) => {
                const yearCompare = (a.yearNumber || '').localeCompare(b.yearNumber || '');
                if (yearCompare !== 0) return yearCompare;
                return (a.semesterNumber || '').localeCompare(b.semesterNumber || '');
            })
            .map(s => ({ value: s.semesterCode, label: `Sem ${s.semesterNumber} / Y${s.yearNumber}` }));

        // You can sort lecturers and rooms too if needed
        const allRooms = (sites || [])
            .flatMap(site => (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName} @ ${site.siteName}` })))
            .sort((a, b) => a.label.localeCompare(b.label));
        
        const formattedLecturers = (lecturers || [])
            .map(l => ({ value: l.id, label: `${l.name} (${l.id})` }))
            .sort((a, b) => a.label.localeCompare(b.label));

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
            setIsDataLoading(true); // תמיד התחל טעינה כשהמודאל נפתח
            Promise.all([
                fetchCollection("courses"),
                loadSelectOptions()
            ]).then(([courses, options]) => {
                setInternalCourses(courses || []);
                setSelectOptions(options);
                setIsDataLoading(false); // סיים טעינה רק אחרי שכל הנתונים הגיעו
            }).catch(err => {
                setApiError("Failed to load initial data.");
                setIsDataLoading(false);
            });
        } else {
            // איפוס מלא בסגירה
            setSelectedCourseCode("");
            setFormData(null);
            setMode("select");
            setErrors({});
            setApiError("");
            setIsLoading(false);
            setInternalCourses([]);
            setIsDataLoading(true); // חשוב לאפס את מצב הטעינה
        }
    }, [open]);

    // ✨ FIX: This effect now DEPENDS on isDataLoading and will WAIT for it to be false.
    useEffect(() => {
        // Guard Clause: אם הנתונים עדיין בטעינה, אל תעשה כלום.
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
            // אם לא מצאנו את הקורס (יכול לקרות במצב קיצון), נקה את הטופס
            setFormData(courseData ? { ...courseData } : null);
        } else {
            setMode("select");
            setFormData(null); // נקה את הטופס אם שום דבר לא נבחר
        }
    // ✨ FIX: Add `isDataLoading` to the dependency array.
    }, [selectedCourseCode, internalCourses, open, isDataLoading]);

    const handleFormChange = useCallback((eventOrData) => {
        const { name, value } = eventOrData.target 
          ? { name: eventOrData.target.name, value: eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value }
          : eventOrData;

        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
        }
    }, [errors]);

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

                {/* ✨ FIX: Conditional rendering logic simplified and more robust */}
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