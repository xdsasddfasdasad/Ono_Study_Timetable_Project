// src/components/modals/TimeTableEditModal.jsx

import React, { useState, useEffect, useCallback } from "react";
// Imports Material-UI components for building the modal's UI.
import {
  Stack, Alert, Box, CircularProgress, Typography, Button, DialogContent, DialogActions
} from "@mui/material";
// Imports a generic, reusable modal wrapper.
import PopupModal from "../UI/PopupModal";
// Imports utility and handler functions for data mapping and database operations.
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// --- Step 1: Import only the specific form components this modal can render. ---
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import TaskForm from "./forms/TaskForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

// --- Step 2: Map the entity type string to its corresponding React form component. ---
const formComponentMap = {
    year: YearForm,
    semester: SemesterForm,
    task: TaskForm,
    holiday: HolidayForm,
    vacation: VacationForm,
    event: EventForm,
};

// --- Step 3: A lean helper function that only loads the data needed for the forms in *this* modal. ---
const loadSelectOptionsAsync = async () => {
    try {
        // These forms only require a list of years and courses for their dropdowns.
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
        return {}; // Return an empty object on failure.
    }
};

// This is a "smart" component designed exclusively for editing an existing record.
// It receives the initial data, loads any necessary dropdown options, and then renders the correct form.
export default function TimeTableEditModal({ open, onClose, onSave, initialData }) {
    // Determine the type of record from the initial data passed in.
    const recordType = initialData?.type;

    // === STATE MANAGEMENT ===
    const [formData, setFormData] = useState(null); // The data object for the form, starts as null.
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false); // For save/update actions.
    const [isDeleting, setIsDeleting] = useState(false); // For the delete action.
    const [isLoadingOptions, setIsLoadingOptions] = useState(true); // For loading dropdown data.
    const [selectOptions, setSelectOptions] = useState({});

    // Dynamically select the form component to render based on the record type.
    const FormComponent = recordType ? formComponentMap[recordType] : null;

    // This effect is the core of the component's logic. It runs when the modal is opened with initial data.
    useEffect(() => {
        if (open && initialData) {
            // --- Logic Fix ---
            // The previous logic may have had a race condition. This new sequence ensures that:
            // 1. Loading state is turned ON.
            // 2. We wait for the asynchronous `loadSelectOptionsAsync` to complete.
            // 3. ONLY after the options are fetched, we set the form data and turn the loading state OFF.
            // This prevents the form from trying to render before its dropdowns have the necessary options.
            setIsLoadingOptions(true);
            setFormData(null); // Clear any stale data from a previous opening.
            setErrors({}); 
            setGeneralError("");

            loadSelectOptionsAsync().then(options => {
                setSelectOptions(options);
                setFormData({ ...initialData }); // Set the form data with the passed-in record.
                setIsLoadingOptions(false); // Mark loading as complete.
            });
        }
    }, [open, initialData]);

    // Generic form change handler, memoized for performance.
    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
    }, [errors]);

    // Handler for the "Update" button click.
    const handleUpdateClick = useCallback(async () => {
        // A guard clause to ensure we don't proceed without the necessary data.
        if (!recordType || !formData) return;
        setIsLoading(true); setErrors({}); setGeneralError("");

        // Delegate the actual database operation to the handler function.
        const result = await handleSaveOrUpdateRecord(
            formMappings[recordType].collectionName, formData, "edit",
            { recordType, editingId: formData[formMappings[recordType].primaryKey] }
        );
        setIsLoading(false);

        if (result.success) {
            onSave?.(); // Notify the parent of success.
            onClose?.();
        } else {
            setErrors(result.errors || {});
            setGeneralError(result.message || "Failed to update record.");
        }
    }, [recordType, formData, onSave, onClose]);

    // Handler for the "Delete" button click.
    const handleDeleteClick = useCallback(async () => {
        if (!recordType || !formData) return;
        const mapping = formMappings[recordType];
        const recordId = formData[mapping.primaryKey];
        // Construct a user-friendly label for the confirmation dialog.
        const recordLabel = formData.eventName || formData.holidayName || formData.vacationName || formData.assignmentName || formData.yearNumber || formData.semesterNumber || recordId;

        if (!window.confirm(`DELETE ${mapping.label}:\n"${recordLabel}"\n\nThis action cannot be undone.`)) return;
        setIsDeleting(true);

        const result = await handleDeleteEntity(mapping.collectionName, recordId, { 
            recordType: recordType,
            parentDocId: formData.yearCode // Pass parent ID for nested deletions (like semesters).
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
                  
                  {/* The form is only rendered after the options have finished loading AND formData is set.
                      This prevents rendering errors and shows a clean loading spinner to the user. */}
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