// src/components/modals/ManageCourseDefinitionModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, Box, CircularProgress, Typography, Button,
  FormControl, InputLabel, Select, MenuItem, Divider
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CourseForm from "./forms/CourseForm";
// --- FIX 1: Import the central mapping and correct handlers ---
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// Helper to load data for CourseForm dropdowns
const loadSelectOptions = async () => {
    try {
        const [years, lecturers, sites] = await Promise.all([
            fetchCollection("years"), fetchCollection("lecturers"), fetchCollection("sites")
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
const COURSE_RECORD_TYPE = 'course'; // Define once

export default function ManageCourseDefinitionModal({
    open,
    onClose,
    onSaveSuccess,
    existingCourses, // Passed from parent
    isLoadingCourses, // Passed from parent
}) {
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const [formData, setFormData] = useState(null);
    const [mode, setMode] = useState("select"); // 'select', 'add', 'edit'
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectOptions, setSelectOptions] = useState({ semesters: [], lecturers: [], rooms: [] });

    // --- Effects ---
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            loadSelectOptions().then(options => {
                setSelectOptions(options);
                setIsLoading(false);
            });
        } else {
            // Full reset on close
            setSelectedCourseCode(""); setFormData(null); setMode("select");
            setErrors({}); setApiError(""); setIsLoading(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setErrors({}); setApiError("");
        
        const mapping = formMappings[COURSE_RECORD_TYPE];
        if (!mapping) return;

        if (selectedCourseCode === ADD_NEW_COURSE_OPTION) {
            setMode("add");
            setFormData(mapping.initialData());
        } else if (selectedCourseCode) {
            setMode("edit");
            const courseData = (existingCourses || []).find(c => c[mapping.primaryKey] === selectedCourseCode);
            setFormData(courseData ? { ...courseData } : null);
        } else {
            setMode("select");
            setFormData(null);
        }
    }, [selectedCourseCode, existingCourses, open]);

    // --- Handlers ---
    const handleFormChange = useCallback((eventOrData) => {
        const { name, value } = eventOrData.target 
          ? { name: eventOrData.target.name, value: eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value }
          : { name: eventOrData.name, value: eventOrData.value }; // For custom components like CourseForm's hours

        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
    }, [errors]);

    const handleSave = useCallback(async () => {
        if (!formData || !mode || mode === 'select') return;
        setIsLoading(true); setErrors({}); setApiError("");

        const mapping = formMappings[COURSE_RECORD_TYPE];
        // The handler now also handles course meeting regeneration
        const result = await handleSaveOrUpdateRecord(
            mapping.collectionName,
            formData,
            mode,
            { recordType: COURSE_RECORD_TYPE, editingId: selectedCourseCode }
        );
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess?.();
        } else {
            setErrors(result.errors || {});
            setApiError(result.message || `Failed to ${mode} course.`);
        }
    }, [formData, mode, selectedCourseCode, onSaveSuccess]);

    const handleDelete = useCallback(async () => {
        if (mode !== 'edit' || !selectedCourseCode) return;
        
        const mapping = formMappings[COURSE_RECORD_TYPE];
        const courseName = formData?.courseName || selectedCourseCode;

        if (!window.confirm(`DELETE COURSE: "${courseName}"?\nThis will also delete ALL associated meetings.`)) return;
        setIsLoading(true);

        // The handler now also handles course meeting deletion
        const result = await handleDeleteEntity(mapping.collectionName, selectedCourseCode);
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess?.();
        } else {
            setApiError(result.message || "Deletion failed.");
        }
    }, [mode, selectedCourseCode, formData, onSaveSuccess]);

    const isActionDisabled = isLoading || isLoadingCourses;

    return (
        <PopupModal open={open} onClose={() => !isActionDisabled && onClose()} title="Manage Course Definition" maxWidth="md">
            <Stack spacing={3} sx={{ p: 3 }}>
                {apiError && <Alert severity="error">{apiError}</Alert>}

                <FormControl fullWidth disabled={isActionDisabled}>
                    <InputLabel id="course-select-label">Action</InputLabel>
                    <Select
                        labelId="course-select-label"
                        label="Action"
                        value={selectedCourseCode}
                        onChange={(e) => setSelectedCourseCode(e.target.value)}
                    >
                        <MenuItem value="" disabled><em>Select Action...</em></MenuItem>
                        <MenuItem value={ADD_NEW_COURSE_OPTION}>--- Add New Course ---</MenuItem>
                        <Divider />
                        {isLoadingCourses ? (
                            <MenuItem disabled><em>Loading courses...</em></MenuItem>
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
                      <CourseForm
                          formData={formData}
                          errors={errors}
                          onChange={handleFormChange}
                          mode={mode}
                          selectOptions={selectOptions}
                      />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                              {mode === 'edit' && (
                                  <Button color="error" variant="outlined" onClick={handleDelete} disabled={isActionDisabled}>
                                      {isLoading ? "Wait..." : "Delete"}
                                  </Button>
                              )}
                          </Box>
                          <Stack direction="row" spacing={1}>
                              <Button onClick={() => !isActionDisabled && onClose()} disabled={isActionDisabled}>
                                  Cancel
                              </Button>
                              <Button variant="contained" onClick={handleSave} disabled={isActionDisabled}>
                                  {isLoading ? "Saving..." : (mode === 'edit' ? "Update Course" : "Save Course")}
                              </Button>
                          </Stack>
                      </Stack>
                    </>
                )}
            </Stack>
        </PopupModal>
    );
}