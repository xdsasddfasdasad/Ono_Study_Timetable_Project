import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, Box, CircularProgress, Typography, Button as MuiButton
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
// import FormWrapper from "../UI/FormWrapper"; // Optional, depending on PopupModal's padding
import CustomButton from "../UI/CustomButton";
import {
    recordTypeLabels,
    getEntityKeyByRecordType,
    getPrimaryKeyFieldByRecordType
} from "../../utils/formMappings";
import {
    handleSaveOrUpdateRecord,
    handleDeleteEntityFormSubmit // Async and Firestore-ready
} from "../../handlers/formHandlers"; // Async and Firestore-ready
import { fetchCollection, fetchDocumentById } from "../../firebase/firestoreService"; // Firestore service

// Import ALL possible form components
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import LecturerForm from "./forms/LecturerForm";
// CourseForm is usually handled by ManageCourseDefinitionModal
// import CourseForm from "./forms/CourseForm";
import CourseMeetingForm from "./forms/CourseMeetingForm";
import TaskForm from "./forms/TaskForm";
import SiteForm from "./forms/SiteForm";
import RoomForm from "./forms/RoomForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

const formComponentMap = {
    year: YearForm, semester: SemesterForm, lecturer: LecturerForm,
    // course: CourseForm,
    courseMeeting: CourseMeetingForm, task: TaskForm, site: SiteForm,
    room: RoomForm, holiday: HolidayForm, vacation: VacationForm, event: EventForm,
};

// Helper to load data for form dropdowns asynchronously (same as in AddModal)
const loadSelectOptionsAsync = async () => {
    console.log("[EditModal:LoadOptions] Loading select options from Firestore...");
    try {
        const [years, sites, lecturers, courses] = await Promise.all([
            fetchCollection("years"), fetchCollection("sites"),
            fetchCollection("lecturers"), fetchCollection("courses")
        ]);
        const allSemesters = (years || []).flatMap(y => (y.semesters || []).map(s => ({ value: s.semesterCode, label: `Sem ${s.semesterNumber} / Y${y.yearNumber} (${s.startDate} - ${s.endDate})` })));
        const formattedRooms = (sites || []).flatMap(site => (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName || `R(${room.roomCode})`} @ ${site.siteName || `S(${site.siteCode})`}` })));
        return {
            years: (years || []).map(y => ({ value: y.yearCode, label: `Year ${y.yearNumber} (${y.yearCode})` })),
            sites: (sites || []).map(s => ({ value: s.siteCode, label: `${s.siteName} (${s.siteCode})` })),
            lecturers: (lecturers || []).map(l => ({ value: l.id, label: `${l.name} (${l.id})` })),
            courses: (courses || []).map(c => ({ value: c.courseCode, label: `${c.courseName} (${c.courseCode})` })),
            semesters: allSemesters, rooms: formattedRooms,
        };
    } catch (error) {
         console.error("[EditModal:LoadOptions] Error loading options:", error);
         return { years: [], sites: [], lecturers: [], courses: [], semesters: [], rooms: [] };
    }
};

export default function TimeTableEditModal({
    open, onClose, onSave, // onSave is actually onSaveSuccess from parent
    initialData, // The object being edited
    recordType   // The type of record (e.g., 'year', 'semester')
}) {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false); // For save operation
    const [isDeleting, setIsDeleting] = useState(false); // For delete operation
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [selectOptions, setSelectOptions] = useState({ years: [], sites: [], lecturers: [], courses: [], semesters: [], rooms: [] });

    const FormComponent = recordType ? formComponentMap[recordType] : null;
    const primaryKeyField = recordType ? getPrimaryKeyFieldByRecordType(recordType) : null;

    // Load select options when modal opens
    useEffect(() => {
        if (open) {
            const fetchOptions = async () => {
                setIsLoadingOptions(true);
                const options = await loadSelectOptionsAsync();
                setSelectOptions(options);
                setIsLoadingOptions(false);
            };
            fetchOptions();
        }
    }, [open]);

    // Initialize form data when modal opens or initialData changes
    useEffect(() => {
        if (open && initialData) {
            console.log(`[EditModal] Initializing for type: ${recordType}, data:`, initialData);
            setFormData({ ...initialData }); // Populate form with existing data
            setErrors({}); setGeneralError("");
            setIsLoading(false); setIsDeleting(false);
        } else if (!open) { // Reset when closing
             setFormData({}); setErrors({}); setGeneralError(""); setIsLoading(false); setIsDeleting(false);
        }
    }, [open, initialData, recordType]);

    const handleFormChange = useCallback((eventOrData) => {
        setGeneralError("");
        let name, value;
        if (eventOrData.target?.name && typeof eventOrData.target.name === 'string') {
            name = eventOrData.target.name;
            value = eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value;
        } else if (typeof eventOrData === 'object' && eventOrData !== null && eventOrData.name === 'hours' && Array.isArray(eventOrData.value)) {
            name = 'hours'; value = eventOrData.value;
        } else { return; }
        setFormData((prev) => {
             const updatedData = { ...prev, [name]: value };
             if (name === 'allDay' && value === true) { updatedData.startHour = ''; updatedData.endHour = ''; }
            return updatedData;
        });
        if (errors[name]) { setErrors((prev) => { const newE = {...prev}; delete newE[name]; return newE; }); }
        if (name === 'hours') { /* Clear hours errors */ }
    }, [errors]);

    const handleUpdateClick = useCallback(async () => {
        if (!recordType || !FormComponent || !formData || !primaryKeyField) { setGeneralError("Cannot update: Missing config."); return; }
        const recordId = formData[primaryKeyField];
        if (!recordId) { setGeneralError("Cannot update: Record ID missing."); return; }

        setIsLoading(true); setErrors({}); setGeneralError("");
        const entityKey = getEntityKeyByRecordType(recordType);
        if (!entityKey) { setIsLoading(false); setGeneralError("Config error for type."); return; }

        let dataToSave = { ...formData };
        let validationExtra = {
            recordType: recordType,
            editingId: recordId // Pass the ID of the record being edited
        };

        try {
            if (recordType === 'semester' && dataToSave.yearCode) {
                validationExtra.parentRecord = await fetchDocumentById('years', dataToSave.yearCode);
                if (!validationExtra.parentRecord) throw new Error(`Parent year ${dataToSave.yearCode} not found.`);
            } else if (recordType === 'room' && dataToSave.siteCode) {
                validationExtra.parentRecord = await fetchDocumentById('sites', dataToSave.siteCode);
                if (!validationExtra.parentRecord) throw new Error(`Parent site ${dataToSave.siteCode} not found.`);
            }
        } catch (fetchParentError) {
             console.error("[EditModal:Update] Error fetching parent for validation:", fetchParentError);
             setGeneralError(`Error verifying parent: ${fetchParentError.message}`);
             setIsLoading(false); return;
        }

        console.log(`[EditModal:Update] Type: ${recordType}, Key: ${entityKey}, ID: ${recordId}`);
        const result = await handleSaveOrUpdateRecord(entityKey, dataToSave, "edit", validationExtra, false); // Let handler validate
        setIsLoading(false);

        if (result.success) {
            console.log("[EditModal:Update] Successful."); onSave?.(); onClose?.();
        } else {
            console.error("[EditModal:Update] Failed:", result.message, result.errors);
            setErrors(result.errors || {});
            setGeneralError(result.message || "Failed to update record.");
        }
    }, [recordType, formData, FormComponent, primaryKeyField, onSave, onClose]);

    const handleDeleteClick = useCallback(async () => { // Made async for consistency if needed later
        if (!recordType || !formData || !primaryKeyField) { setGeneralError("Cannot delete: Missing config."); return; }
        const recordId = formData[primaryKeyField];
        if (!recordId) { setGeneralError("Cannot delete: Record ID missing."); return; }
        const entityKey = getEntityKeyByRecordType(recordType);
        if (!entityKey) { setGeneralError("Config error for type."); return; }

        let parentId = null;
        if (recordType === 'semester') parentId = formData.yearCode;
        else if (recordType === 'room') parentId = formData.siteCode;
        if ((recordType === 'semester' || recordType === 'room') && !parentId) {
             setGeneralError(`Cannot delete ${recordType}: Parent ID missing.`); return;
        }

        const recordLabel = formData.name || formData.eventName || formData.courseName || formData.holidayName || formData.roomName || formData.siteName || formData.assignmentName || recordId;
        if (!window.confirm(`DELETE ${recordTypeLabels[recordType] || 'Record'}:\n"${recordLabel}" (${recordId})\n\nAre you sure?`)) return;

        setIsDeleting(true); setGeneralError(""); setErrors({});
        console.log(`[EditModal:Delete] Type: ${recordType}, Key: ${entityKey}, ID: ${recordId}, ParentID: ${parentId}`);

        handleDeleteEntityFormSubmit( entityKey, recordId,
            (successMessage) => {
                setIsDeleting(false); onSave?.(); onClose?.(); alert(successMessage || "Record deleted.");
            },
            (errorMessage) => {
                setIsDeleting(false); setGeneralError(errorMessage || "Failed to delete record.");
            },
            parentId
        );
    }, [recordType, formData, primaryKeyField, onSave, onClose]);

    return (
        <PopupModal open={open} onClose={onClose} title={`Edit ${recordTypeLabels[recordType] || 'Record'}`}>
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                {generalError && <Alert severity="error" sx={{ mb: 2 }}>{generalError}</Alert>}
                {isLoadingOptions ? ( <Box sx={{display:'flex', justifyContent:'center', my:3}}><CircularProgress size={30}/> <Typography sx={{ml:1}}>Loading options...</Typography></Box> )
                                 : FormComponent ? ( <FormComponent formData={formData} errors={errors} onChange={handleFormChange} mode="edit" selectOptions={selectOptions} /> )
                                 : ( recordType && <Typography sx={{ textAlign: 'center', mt: 4 }}>Form component not found.</Typography> )}
                {!recordType && !isLoadingOptions && <Typography sx={{ textAlign: 'center', mt: 4 }}>Record type not specified.</Typography>}

                <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 2 }}>
                    <Box>
                        {primaryKeyField && formData[primaryKeyField] && (
                             <MuiButton variant="outlined" color="error" onClick={handleDeleteClick} disabled={isLoading || isDeleting} startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : null} >
                                {isDeleting ? "Deleting..." : "Delete"}
                             </MuiButton>
                        )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                         <CustomButton variant="outlined" onClick={onClose} disabled={isLoading || isDeleting}> Cancel </CustomButton>
                         <CustomButton onClick={handleUpdateClick} disabled={!recordType || !FormComponent || isLoading || isDeleting || isLoadingOptions || Object.values(errors).some(e => !!e)} startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null} >
                            {isLoading ? "Updating..." : "Update Record"}
                         </CustomButton>
                    </Stack>
                 </Stack>
            </Stack>
        </PopupModal>
    );
}