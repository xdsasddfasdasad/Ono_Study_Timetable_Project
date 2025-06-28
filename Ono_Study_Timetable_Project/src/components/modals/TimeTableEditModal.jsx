import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, Box, CircularProgress, Typography, Button, DialogContent, DialogActions
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// --- שלב 1: ייבוא רק של הטפסים הרלוונטיים ---
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import TaskForm from "./forms/TaskForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

// --- שלב 2: מיפוי רק של הטפסים הרלוונטיים ---
const formComponentMap = {
    year: YearForm,
    semester: SemesterForm,
    task: TaskForm,
    holiday: HolidayForm,
    vacation: VacationForm,
    event: EventForm,
};

// --- שלב 3: פונקציית עזר רזה שטוענת רק מה שצריך ---
const loadSelectOptionsAsync = async () => {
    try {
        const [years, courses] = await Promise.all([
            fetchCollection("years"),
            fetchCollection("courses")
        ]);
        return {
            years: (years || []).map(y => ({ value: y.yearCode, label: `Year ${y.yearNumber}` })),
            courses: (courses || []).map(c => ({ value: c.courseCode, label: `${c.courseName} (${c.courseCode})` })),
        };
    } catch (error) { 
        console.error("[EditModal:LoadOptions] Error:", error);
        return {};
    }
};

export default function TimeTableEditModal({ open, onClose, onSave, initialData }) {
    const recordType = initialData?.type;

    const [formData, setFormData] = useState(null); // ✨ FIX: Start with null
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true); // ✨ FIX: Start as true
    const [selectOptions, setSelectOptions] = useState({});

    const FormComponent = recordType ? formComponentMap[recordType] : null;

    useEffect(() => {
        if (open && initialData) {
            setIsLoadingOptions(true); // Set loading to true on open
            setFormData(null); // Clear previous data
            setErrors({}); 
            setGeneralError("");

            // ✨ FIX 1: The main logic fix is here.
            // We ensure all state updates happen inside the .then() block
            // only after the asynchronous operation is complete.
            loadSelectOptionsAsync().then(options => {
                setSelectOptions(options);
                setFormData({ ...initialData }); // Set form data AFTER options are loaded
                setIsLoadingOptions(false); // Set loading to false AFTER everything is ready
            });
        }
    }, [open, initialData]);

    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
    }, [errors]);

    const handleUpdateClick = useCallback(async () => {
        // ✨ FIX 2: Check for formData existence before saving
        if (!recordType || !formData) return;
        setIsLoading(true); setErrors({}); setGeneralError("");

        const result = await handleSaveOrUpdateRecord(
            formMappings[recordType].collectionName, formData, "edit",
            { recordType, editingId: formData[formMappings[recordType].primaryKey] }
        );
        setIsLoading(false);

        if (result.success) {
            // This now correctly calls the `onSave` prop
            onSave?.(); 
            onClose?.();
        } else {
            setErrors(result.errors || {});
            setGeneralError(result.message || "Failed to update record.");
        }
    }, [recordType, formData, onSave, onClose]);

    // ... (handleDeleteClick is unchanged) ...
    const handleDeleteClick = useCallback(async () => {
        if (!recordType || !formData) return;
        const mapping = formMappings[recordType];
        const recordId = formData[mapping.primaryKey];
        const recordLabel = formData.eventName || formData.holidayName || formData.vacationName || formData.assignmentName || formData.yearNumber || formData.semesterNumber || recordId;

        if (!window.confirm(`DELETE ${mapping.label}:\n"${recordLabel}"\n\nThis action cannot be undone.`)) return;
        setIsDeleting(true);

        const result = await handleDeleteEntity(mapping.collectionName, recordId, { 
            recordType: recordType,
            parentDocId: formData.yearCode
        });
        setIsDeleting(false);

        if (result.success) {
            onSave?.(); onClose?.();
        } else {
            setGeneralError(result.message || "Failed to delete record.");
        }
    }, [recordType, formData, onSave, onClose]);


    return (
        <PopupModal open={open} onClose={onClose} title={`Edit ${formMappings[recordType]?.label || 'Record'}`}>
            <DialogContent>
              <Stack spacing={3} sx={{ minWidth: { sm: 500 }, pt: 1 }}>
                  {generalError && <Alert severity="error">{generalError}</Alert>}
                  
                  {/* ✨ FIX 3: Check for formData as well before rendering the form */}
                  {isLoadingOptions || !formData ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                  ) : FormComponent ? (
                      <FormComponent
                          formData={formData}
                          errors={errors}
                          onChange={handleFormChange}
                          mode="edit"
                          selectOptions={selectOptions}
                      />
                  ) : <Typography>Form not available for this record type.</Typography>}

              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
                <Button color="error" variant="outlined" onClick={handleDeleteClick} disabled={isLoading || isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
                <Stack direction="row" spacing={1}>
                     <Button onClick={onClose} disabled={isLoading || isDeleting}>Cancel</Button>
                     <Button onClick={handleUpdateClick} variant="contained" disabled={!formData || isLoading || isDeleting || isLoadingOptions}>
                        {isLoading ? "Updating..." : "Update"}
                     </Button>
                </Stack>
            </DialogActions>
        </PopupModal>
    );
}