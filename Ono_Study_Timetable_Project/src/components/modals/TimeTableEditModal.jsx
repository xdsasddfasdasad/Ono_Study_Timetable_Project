// /src/components/modals/TimeTableEditModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Stack, Alert, Box, CircularProgress, Typography, Button as MuiButton
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import FormWrapper from "../UI/FormWrapper";
import CustomButton from "../UI/CustomButton";
import {
    recordTypeLabels,
    getEntityKeyByRecordType,
    getPrimaryKeyFieldByRecordType
} from "../../utils/formMappings";
import {
    handleSaveOrUpdateRecord,
    handleDeleteEntityFormSubmit
} from "../../handlers/formHandlers";
import { getRecords } from "../../utils/storage";
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import LecturerForm from "./forms/LecturerForm";
import CourseForm from "./forms/CourseForm";
import CourseMeetingForm from "./forms/CourseMeetingForm";
import TaskForm from "./forms/TaskForm";
import SiteForm from "./forms/SiteForm";
import RoomForm from "./forms/RoomForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

const formComponentMap = {
    year: YearForm,
    semester: SemesterForm,
    lecturer: LecturerForm,
    course: CourseForm,
    courseMeeting: CourseMeetingForm,
    task: TaskForm,
    site: SiteForm,
    room: RoomForm,
    holiday: HolidayForm,
    vacation: VacationForm,
    event: EventForm,
};

export default function TimeTableEditModal({
    open,
    onClose,
    onSave,
    initialData,
    recordType
}) {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const FormComponent = recordType ? formComponentMap[recordType] : null;
    const primaryKeyField = recordType ? getPrimaryKeyFieldByRecordType(recordType) : null;
    const selectOptions = useMemo(() => {
        if (!open) return {};
        console.log("[EditModal] Loading data for select options...");
        try {
            const years = getRecords("years") || [];
            const sites = getRecords("sites") || [];
            const lecturers = getRecords("lecturers") || [];
            const courses = getRecords("courses") || [];
            const allSemesters = years.flatMap(y => (y.semesters || []).map(s => ({ ...s, yearLabel: `Year ${y.yearNumber}` })));
            const formattedRooms = sites.flatMap(site =>
                (site.rooms || []).map(room => ({
                    value: room.roomCode,
                    label: `${room.roomName || `Room (${room.roomCode})`} @ ${site.siteName || `Site (${site.siteCode})`}`
                }))
            );

            return {
                years: years.map(y => ({ value: y.yearCode, label: `Year ${y.yearNumber} (${y.yearCode})` })),
                sites: sites.map(s => ({ value: s.siteCode, label: `${s.siteName} (${s.siteCode})` })),
                lecturers: lecturers.map(l => ({ value: l.id, label: `${l.name} (${l.id})` })),
                courses: courses.map(c => ({ value: c.courseCode, label: `${c.courseName} (${c.courseCode})` })),
                semesters: allSemesters.map(s => ({ value: s.semesterCode, label: `Sem ${s.semesterNumber}, ${s.yearLabel} (${s.semesterCode})` })),
                rooms: formattedRooms,
            };
        } catch (error) {
             console.error("[EditModal] Error loading data for select options:", error);
             return { years: [], sites: [], lecturers: [], courses: [], semesters: [] };
        }
    }, [open]);
    useEffect(() => {
        if (open && initialData) {
            console.log(`[EditModal] Initializing form for type: ${recordType} with data:`, initialData);
            setFormData({ ...initialData });
            setErrors({});
            setGeneralError("");
            setIsLoading(false);
            setIsDeleting(false);
        }
    }, [open, initialData, recordType]);
    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;
    
        setFormData((prev) => {
             const updatedData = { ...prev, [name]: newValue };
             if (name === 'allDay' && newValue === true) {
                 updatedData.startHour = '';
                 updatedData.endHour = '';
             }
            return updatedData;
        });

        if (errors[name]) { setErrors((prev) => ({ ...prev, [name]: undefined })); }
        setGeneralError("");
    }, [errors]);
    const handleUpdateClick = useCallback(async () => {
        if (!recordType || !FormComponent || !formData || !primaryKeyField) {
            setGeneralError("Cannot update: Missing component configuration."); return;
        }
        const recordId = formData[primaryKeyField];
        if (!recordId) {
             setGeneralError("Cannot update: Record ID is missing in form data."); return;
        }
        setIsLoading(true);
        setErrors({});
        setGeneralError("");
        const entityKey = getEntityKeyByRecordType(recordType);
        if (!entityKey) {setIsLoading(false); return; }
        let dataToSave = { ...formData };
        let validationExtra = { editingId: recordId, recordType: recordType };
        if (recordType === 'semester') {
            const parentId = dataToSave.yearCode;
            if (!parentId) { setIsLoading(false); return; }
            const years = getRecords("years") || []; 
            const parentYear = years.find(y => y.yearCode === parentId);
            if (parentYear) {
                validationExtra.existingSemesters = (parentYear.semesters || []).filter(s => s.semesterCode !== recordId);
                validationExtra.yearRecord = parentYear;
            } else {  setIsLoading(false); return; }
        } else if (recordType === 'room') {
             const parentId = dataToSave.siteCode;
             if (!parentId) { setIsLoading(false); return; }
             const sites = getRecords("sites") || [];
             const parentSite = sites.find(s => s.siteCode === parentId);
             if (parentSite) {
                 validationExtra.existingRooms = (parentSite.rooms || []).filter(r => r.roomCode !== recordId);
                 validationExtra.siteRecord = parentSite;
             } else {setIsLoading(false); return; }
        } else if (entityKey) {
            try {
                const allRecords = getRecords(entityKey) || [];
                const idField = primaryKeyField;
                validationExtra[`existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`] = allRecords.filter(r => r[idField] !== recordId);
            } catch (e) { console.error("Error getting records for validation", e); }
        }
        console.log(`[EditModal] Updating recordType: ${recordType}, entityKey: ${entityKey}, ID: ${recordId}`);
        console.log("[EditModal] Data to save:", dataToSave);
        console.log("[EditModal] Validation extra:", validationExtra);
        const result = await handleSaveOrUpdateRecord(entityKey, dataToSave, "edit", validationExtra);
        setIsLoading(false);
        if (result.success) {
            console.log("[EditModal] Update successful.");
            onSave?.(); onClose?.();
        } else {
            console.error("[EditModal] Update failed:", result.message, result.errors);
            setErrors(result.errors || {});
            setGeneralError(result.message || "Failed to update record.");
        }
    }, [recordType, formData, FormComponent, primaryKeyField, onSave, onClose]);
    const handleDeleteClick = useCallback(() => {
        if (!recordType || !formData || !primaryKeyField) { return; }
        const recordId = formData[primaryKeyField];
        if (!recordId) { return; }
        const entityKey = getEntityKeyByRecordType(recordType);
        if (!entityKey) {return; }
        let parentId = null;
        if (recordType === 'semester') {
            parentId = formData.yearCode; 
            if (!parentId) { setGeneralError("Cannot delete semester: Parent Year ID missing."); return; }
        } else if (recordType === 'room') {
             parentId = formData.siteCode;
             if (!parentId) { setGeneralError("Cannot delete room: Parent Site ID missing."); return; }
        }
        const recordLabel = formData.name || formData.eventName || formData.courseName || formData.holidayName || formData.roomName || formData.siteName || formData.assignmentName || recordId;
        if (!window.confirm(`Are you sure you want to delete "${recordLabel}" (${recordType})?`)) return;
        setIsDeleting(true);
        setGeneralError(""); setErrors({});
        console.log(`[EditModal] Deleting recordType: ${recordType}, entityKey: ${entityKey}, ID: ${recordId}, ParentID: ${parentId}`);
        handleDeleteEntityFormSubmit(
            entityKey,
            recordId,
            (successMessage) => {
                console.log("[EditModal] Delete successful:", successMessage);
                setIsDeleting(false);
                onSave?.(); onClose?.();
                alert(successMessage || "Record deleted.");
            },
            (errorMessage) => {
                console.error("[EditModal] Delete failed:", errorMessage);
                setIsDeleting(false);
                setGeneralError(errorMessage || "Failed to delete record.");
            },
            parentId 
        );

    }, [recordType, formData, primaryKeyField, onSave, onClose]);
    return (
        <PopupModal open={open} onClose={onClose} title={`Edit ${recordTypeLabels[recordType] || 'Record'}`}>
            <FormWrapper>
                {generalError && <Alert severity="error" sx={{ mb: 2 }}>{generalError}</Alert>}
                <Box sx={{ minHeight: '200px' }}>
                    {FormComponent ? (
                        <FormComponent
                            formData={formData}
                            errors={errors}
                            onChange={handleFormChange}
                            mode="edit"
                            selectOptions={selectOptions}
                        />
                    ) : (
                       recordType && <Typography sx={{ color: 'error.main', textAlign: 'center', mt: 4 }}>Error: Form component not found for type "{recordType}".</Typography>
                    )}
                    {!recordType && <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>Error: Record type not specified.</Typography>}
                </Box>
                <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
                    {primaryKeyField && formData[primaryKeyField] && (
                        <MuiButton
                            variant="outlined" color="error" onClick={handleDeleteClick}
                            disabled={isLoading || isDeleting}
                            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </MuiButton>
                    )}
                     {!primaryKeyField && <Box />}
                    <Stack direction="row" spacing={2}>
                         <CustomButton variant="outlined" onClick={onClose} disabled={isLoading || isDeleting}>
                            Cancel
                        </CustomButton>
                        <CustomButton
                            onClick={handleUpdateClick}
                            disabled={!recordType || !FormComponent || isLoading || isDeleting || Object.values(errors).some(e => !!e)}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                           {isLoading ? "Updating..." : "Update Record"}
                        </CustomButton>
                    </Stack>
                 </Stack>
            </FormWrapper>
        </PopupModal>
    );
}