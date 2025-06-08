// src/components/modals/TimeTableAddModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, MenuItem, Select, InputLabel, FormControl, Alert, Box, CircularProgress, Typography, Button
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// Import all possible form components dynamically
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

const addableRecordTypes = Object.entries(formMappings)
    .filter(([key]) => key in formComponentMap)
    .map(([key, value]) => ({ key, label: value.label }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically for user convenience

// This helper is used by both Add and Edit modals
const loadSelectOptionsAsync = async () => {
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
    } catch (error) {
         console.error("[Modal:LoadOptions] Error:", error);
         return { years: [], sites: [], lecturers: [], courses: [], semesters: [], rooms: [] };
    }
};

export default function TimeTableAddModal({ open, onClose, onSave, defaultDate }) {
  const [recordType, setRecordType] = useState("");
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectOptions, setSelectOptions] = useState({});

  const FormComponent = recordType ? formComponentMap[recordType] : null;

  useEffect(() => {
    if (open) {
      setIsLoadingOptions(true);
      loadSelectOptionsAsync().then(options => {
        setSelectOptions(options);
        setIsLoadingOptions(false);
      });
    } else {
      setRecordType(""); setFormData({}); setErrors({}); setGeneralError(""); setIsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (recordType && open) {
      const defaultValues = defaultDate ? { startDate: defaultDate } : {};
      const initialData = formMappings[recordType]?.initialData(defaultValues);
      setFormData(initialData || {});
      setErrors({}); setGeneralError("");
    } else {
      setFormData({});
    }
  }, [recordType, defaultDate, open]);
  
  const handleFormChange = useCallback((eventOrData) => {
    const { name, value } = eventOrData.target 
      ? { name: eventOrData.target.name, value: eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value }
      : { name: eventOrData.name, value: eventOrData.value };
    
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
  }, [errors]);

  const handleSaveClick = useCallback(async () => {
    if (!recordType) return;
    setIsLoading(true); setErrors({}); setGeneralError("");

    const mapping = formMappings[recordType];
    if (!mapping) {
      setIsLoading(false);
      setGeneralError("Configuration error: Cannot find mapping for this record type.");
      return;
    }

    const result = await handleSaveOrUpdateRecord(
        mapping.collectionName, formData, "add", { recordType }
    );
    setIsLoading(false);

    if (result.success) {
      onSave?.();
      onClose?.();
    } else {
      setErrors(result.errors || {});
      setGeneralError(result.message || "Failed to save record. Please check the form for errors.");
    }
  }, [recordType, formData, onSave, onClose]);

  return (
    <PopupModal open={open} onClose={onClose} title={`Add New ${formMappings[recordType]?.label || 'Record'}`}>
       <DialogContent>
          <Stack spacing={3} sx={{ minWidth: { sm: 500 }, pt: 1 }}>
              <FormControl fullWidth disabled={isLoading || isLoadingOptions}>
                  <InputLabel id="add-record-type-label">Record Type</InputLabel>
                  <Select
                      labelId="add-record-type-label"
                      label="Record Type"
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                  >
                      {addableRecordTypes.map(({ key, label }) => (
                          <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                  </Select>
              </FormControl>

              {generalError && <Alert severity="error">{generalError}</Alert>}

              {isLoadingOptions && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}

              {FormComponent && !isLoadingOptions && (
                  <FormComponent
                      formData={formData}
                      errors={errors}
                      onChange={handleFormChange}
                      mode="add"
                      selectOptions={selectOptions}
                  />
              )}
          </Stack>
       </DialogContent>
       <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSaveClick} variant="contained" disabled={!recordType || isLoading || isLoadingOptions}>
              {isLoading ? "Saving..." : "Save Record"}
          </Button>
       </DialogActions>
    </PopupModal>
  );
}