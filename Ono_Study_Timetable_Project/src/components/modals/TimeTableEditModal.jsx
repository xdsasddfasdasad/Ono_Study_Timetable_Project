// src/components/modals/TimeTableEditModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, Alert, Box, CircularProgress, Typography, Button, DialogContent, DialogActions
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// Import all possible form components (same as AddModal)
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import LecturerForm from "./forms/LecturerForm";
import CourseMeetingForm from "./forms/CourseMeetingForm";
import TaskForm from "./forms/TaskForm";
import SiteForm from "./forms/SiteForm";
import RoomForm from "./forms/RoomForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

const formComponentMap = {
    year: YearForm, semester: SemesterForm, lecturer: LecturerForm,
    courseMeeting: CourseMeetingForm, task: TaskForm, site: SiteForm,
    room: RoomForm, holiday: HolidayForm, vacation: VacationForm, event: EventForm,
};

// Re-using the same helper from AddModal
const loadSelectOptionsAsync = async () => { /* ... (exact same implementation) ... */
    try {
        const [years, sites, lecturers, courses] = await Promise.all([
            fetchCollection("years"), fetchCollection("sites"),
            fetchCollection("lecturers"), fetchCollection("courses")
        ]);
        const allSemesters = (years || []).flatMap(y => (y.semesters || []).map(s => ({ value: s.semesterCode, label: `Sem ${s.semesterNumber} / Y${y.yearNumber}` })));
        const allRooms = (sites || []).flatMap(site => (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName} @ ${site.siteName}` })));
        return {
            years: (years || []).map(y => ({ value: y.yearCode, label: `Year ${y.yearNumber}` })),
            sites: (sites || []).map(s => ({ value: s.siteCode, label: s.siteName })),
            lecturers: (lecturers || []).map(l => ({ value: l.id, label: `${l.name} (${l.id})` })),
            courses: (courses || []).map(c => ({ value: c.courseCode, label: `${c.courseName} (${c.courseCode})` })),
            semesters: allSemesters, rooms: allRooms,
        };
    } catch (error) { return {}; }
};

export default function TimeTableEditModal({ open, onClose, onSave, initialData, recordType }) {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [selectOptions, setSelectOptions] = useState({});

    const FormComponent = recordType ? formComponentMap[recordType] : null;

    useEffect(() => {
        if (open && initialData) {
            setIsLoadingOptions(true);
            loadSelectOptionsAsync().then(options => setSelectOptions(options));
            setFormData({ ...initialData });
            setIsLoadingOptions(false);
            setErrors({}); setGeneralError("");
        }
    }, [open, initialData, recordType]);

    const handleFormChange = useCallback((eventOrData) => { /* ... (Same as AddModal) ... */
        const { name, value } = eventOrData.target 
          ? { name: eventOrData.target.name, value: eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value }
          : { name: eventOrData.name, value: eventOrData.value };
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
    }, [errors]);

    const handleUpdateClick = useCallback(async () => {
        if (!recordType || !formData) return;
        setIsLoading(true); setErrors({}); setGeneralError("");

        const mapping = formMappings[recordType];
        const result = await handleSaveOrUpdateRecord(
            mapping.collectionName, formData, "edit",
            { recordType, editingId: formData[mapping.primaryKey] }
        );
        setIsLoading(false);

        if (result.success) {
            onSave?.(); onClose?.();
        } else {
            setErrors(result.errors || {});
            setGeneralError(result.message || "Failed to update record.");
        }
    }, [recordType, formData, onSave, onClose]);

    const handleDeleteClick = useCallback(async () => {
        if (!recordType || !formData) return;

        const mapping = formMappings[recordType];
        const recordId = formData[mapping.primaryKey];
        const recordLabel = formData.name || formData.eventName || recordId;

        if (!window.confirm(`DELETE ${mapping.label}:\n"${recordLabel}"\n\nThis action cannot be undone.`)) return;
        setIsDeleting(true);

        const options = {};
        if (recordType === 'semester') options.parentDocId = formData.yearCode;
        if (recordType === 'room') options.parentDocId = formData.siteCode;

        const result = await handleDeleteEntity(mapping.collectionName, recordId, options);
        setIsDeleting(false);

        if (result.success) {
            alert(result.message);
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
                  {isLoadingOptions && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
                  {FormComponent && !isLoadingOptions ? (
                      <FormComponent
                          formData={formData}
                          errors={errors}
                          onChange={handleFormChange}
                          mode="edit"
                          selectOptions={selectOptions}
                      />
                  ) : <Typography>Form not available.</Typography>}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
                <Button color="error" variant="outlined" onClick={handleDeleteClick} disabled={isLoading || isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
                <Stack direction="row" spacing={1}>
                     <Button onClick={onClose} disabled={isLoading || isDeleting}>Cancel</Button>
                     <Button onClick={handleUpdateClick} variant="contained" disabled={isLoading || isDeleting || isLoadingOptions}>
                        {isLoading ? "Updating..." : "Update"}
                     </Button>
                </Stack>
            </DialogActions>
        </PopupModal>
    );
}