import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, Box, CircularProgress, Typography, Button, DialogContent, DialogActions
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// ייבוא הטפסים הרלוונטיים
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import TaskForm from "./forms/TaskForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

const formComponentMap = {
    year: YearForm,
    semester: SemesterForm,
    task: TaskForm,
    holiday: HolidayForm,
    vacation: VacationForm,
    event: EventForm,
};

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

    const [formData, setFormData] = useState(null);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);

    const [selectOptions, setSelectOptions] = useState({});

    const FormComponent = recordType ? formComponentMap[recordType] : null;

    useEffect(() => {
        if (open && initialData) {
            setIsLoadingOptions(true);
            setFormData(null); 
            setErrors({}); 
            setGeneralError("");

            loadSelectOptionsAsync().then(options => {
                setSelectOptions(options);
                // initialData כבר כולל את ה-id האמיתי מהקליק בלוח השנה.
                setFormData({ ...initialData }); 
                setIsLoadingOptions(false);
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
    if (!recordType || !formData) return;
    setIsLoading(true); setErrors({}); setGeneralError("");

    const mapping = formMappings[recordType];
    const primaryKeyValue = formData[mapping.primaryKey];
    
    // --- ✨ הוספה לצורך דיבאג ✨ ---
    console.log("--- DEBUGGING MODAL ---");
    console.log("Record Type:", recordType);
    console.log("Initial Data ID (Firestore ID):", initialData?.id);
    console.log("Primary Key Field from Mapping:", mapping.primaryKey);
    console.log("Primary Key Value from FormData:", primaryKeyValue);
    console.log("------------------------");

    const result = await handleSaveOrUpdateRecord(
        mapping.collectionName, 
        formData, 
        "edit",
        { 
            recordType, 
            editingId: initialData?.id,
            primaryKeyValue: primaryKeyValue
        }
    );
    setIsLoading(false);

    if (result.success) {
        onSave?.(); 
        onClose?.();
    } else {
        setErrors(result.errors || {});
        setGeneralError(result.message || "Failed to update record.");
    }
}, [recordType, formData, onSave, onClose, initialData]);


    const handleDeleteClick = useCallback(async () => {
        if (!recordType || !formData) return;
        const mapping = formMappings[recordType];
        // ✨ ותיקון דומה כאן למחיקה, כדי להשתמש ב-ID האמיתי
        const recordId = initialData?.id || formData[mapping.primaryKey];
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
    }, [recordType, formData, onSave, onClose, initialData]);


    return (
        <PopupModal open={open} onClose={onClose} title={`Edit ${formMappings[recordType]?.label || 'Record'}`}>
            <DialogContent>
              <Stack spacing={3} sx={{ minWidth: { sm: 500 }, pt: 1 }}>
                  {generalError && <Alert severity="error">{generalError}</Alert>}
                  
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