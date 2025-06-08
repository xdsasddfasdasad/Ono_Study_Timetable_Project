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

// פונקציית עזר לטעינת כל האופציות הנדרשות ל-Dropdowns
const loadSelectOptions = async () => {
    try {
        const [years, lecturers, sites] = await Promise.all([
            fetchCollection("years"), 
            fetchCollection("lecturers"), 
            fetchCollection("sites")
        ]);
        const allSemesters = (years || []).flatMap(y =>
            (y.semesters || []).map(s => ({ value: s.semesterCode, label: `Sem ${s.semesterNumber} / Y${y.yearNumber}` }))
        );
        const allRooms = (sites || []).flatMap(site =>
            (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName} @ ${site.siteName}` }))
        );
        const formattedLecturers = (lecturers || []).map(l => ({ value: l.id, label: `${l.name} (${l.id})` }));
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
    existingCourses, // רשימת הקורסים הקיימים מהדף הראשי
    isLoadingCourses, // מצב הטעינה של הקורסים מהדף הראשי
}) {
    // === STATE MANAGEMENT ===
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const [formData, setFormData] = useState(null);
    const [mode, setMode] = useState("select"); // 'select', 'add', 'edit'
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [isLoading, setIsLoading] = useState(false); // טעינה פנימית (שמירה/מחיקה)
    const [selectOptions, setSelectOptions] = useState({ semesters: [], lecturers: [], rooms: [] });

    // === EFFECTS ===

    // אפקט 1: טעינת ה-Dropdowns ואיפוס כללי
    useEffect(() => {
        if (open) {
            loadSelectOptions().then(setSelectOptions);
        } else {
            // איפוס מלא בסגירה כדי למנוע הצגת מידע ישן
            setSelectedCourseCode("");
            setFormData(null);
            setMode("select");
            setErrors({});
            setApiError("");
            setIsLoading(false);
        }
    }, [open]);

    // אפקט 2: הכנת הטופס בהתבסס על בחירת המשתמש
    useEffect(() => {
        if (!open) return;
        setErrors({}); 
        setApiError("");
        
        const mapping = formMappings[COURSE_RECORD_TYPE];
        if (!mapping) return;

        if (selectedCourseCode === ADD_NEW_COURSE_OPTION) {
            setMode("add");
            setFormData(mapping.initialData()); // אתחל טופס נקי
        } else if (selectedCourseCode) {
            setMode("edit");
            const courseData = (existingCourses || []).find(c => c.courseCode === selectedCourseCode);
            setFormData(courseData ? { ...courseData } : null); // טען את נתוני הקורס הקיים
        } else {
            setMode("select");
            setFormData(null); // נקה את הטופס
        }
    }, [selectedCourseCode, existingCourses, open]);

    // === HANDLERS ===
    
    // מטפל בשינוי שדות בטופס
    const handleFormChange = useCallback((eventOrData) => {
        const { name, value } = eventOrData.target 
          ? { name: eventOrData.target.name, value: eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value }
          : eventOrData; // תמיכה ברכיבים מותאמים

        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
        }
    }, [errors]);

    // מטפל בשמירה (הוספה/עדכון)
    const handleSave = useCallback(async () => {
        if (!formData || mode === 'select') return;
        setIsLoading(true); setErrors({}); setApiError("");

        const result = await handleSaveOrUpdateRecord(
            'courses',
            formData,
            mode,
            // ה-handler ישתמש ב-recordType כדי לדעת שהוא צריך להפעיל את regenerateMeetingsForCourse
            { recordType: COURSE_RECORD_TYPE, editingId: mode === 'edit' ? selectedCourseCode : null }
        );
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess?.();
            onClose();
        } else {
            setErrors(result.errors || {});
            setApiError(result.message || `Failed to ${mode} course.`);
        }
    }, [formData, mode, selectedCourseCode, onSaveSuccess, onClose]);

    // מטפל במחיקה
    const handleDelete = useCallback(async () => {
        if (mode !== 'edit' || !selectedCourseCode) return;
        
        const courseName = formData?.courseName || selectedCourseCode;
        if (!window.confirm(`DELETE COURSE: "${courseName}"?\n\nThis will permanently delete the course definition AND ALL associated meetings from the calendar. This action cannot be undone.`)) return;
        setIsLoading(true);

        // ה-handler ישתמש ב-recordType כדי לדעת שהוא צריך להפעיל את deleteMeetingsForCourse
        const result = await handleDeleteEntity('courses', selectedCourseCode, { recordType: COURSE_RECORD_TYPE });
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess?.();
            onClose();
        } else {
            setApiError(result.message || "Deletion failed.");
        }
    }, [mode, selectedCourseCode, formData, onSaveSuccess, onClose]);

    const isActionDisabled = isLoading || isLoadingCourses;

    return (
        <PopupModal open={open} onClose={() => !isActionDisabled && onClose()} title="Manage Course Definitions" maxWidth="md">
            <Stack spacing={3} sx={{ p: 3 }}>
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
                        {isLoadingCourses ? (
                            <MenuItem disabled><CircularProgress size={20} sx={{mr: 1}}/> Loading courses...</MenuItem>
                        ) : (existingCourses || []).map(course => (
                            <MenuItem key={course.courseCode} value={course.courseCode}>
                                {`${course.courseName} (${course.courseCode})`}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {formData && (
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
                            {/* כפתור המחיקה יוצג רק במצב עריכה, ויוצמד שמאלה */}
                            {mode === 'edit' && (
                                <Button 
                                    color="error" 
                                    variant="outlined" 
                                    onClick={handleDelete} 
                                    disabled={isActionDisabled}
                                    sx={{ mr: 'auto' }} // This pushes it to the far left
                                >
                                    {isLoading ? <CircularProgress size={24} /> : "Delete Course"}
                                </Button>
                            )}
                            
                            {/* כפתורי הפעולה הראשיים תמיד יהיו בצד ימין */}
                            <Button 
                                onClick={() => !isActionDisabled && onClose()} 
                                disabled={isActionDisabled}
                            >
                                Cancel
                            </Button>
                            
                            <Button 
                                variant="contained" 
                                onClick={handleSave} 
                                disabled={isActionDisabled}
                                sx={{ minWidth: '220px' }} // קביעת רוחב מינימלי כדי להתאים לטקסט הארוך
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : (mode === 'edit' ? "Update & Regenerate" : "Save & Generate")}
                            </Button>
                        </Stack>
                    </>
                )}
            </Stack>
        </PopupModal>
    );
}