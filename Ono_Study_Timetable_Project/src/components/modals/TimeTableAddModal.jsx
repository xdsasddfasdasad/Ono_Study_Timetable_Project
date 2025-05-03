import React, { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import {
  Stack, MenuItem, Select, InputLabel, FormControl, Alert, Box, CircularProgress, Typography
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import FormWrapper from "../UI/FormWrapper";
import CustomButton from "../UI/CustomButton";
import { recordTypeLabels, getEntityKeyByRecordType, generateInitialFormData } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";
import { getRecords } from "../../utils/storage";
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
  year: YearForm,
  semester: SemesterForm,
  lecturer: LecturerForm,
  courseMeeting: CourseMeetingForm,
  task: TaskForm,
  site: SiteForm,
  room: RoomForm,
  holiday: HolidayForm,
  vacation: VacationForm,
  event: EventForm,
};
const addableRecordTypeLabels = Object.entries(recordTypeLabels)
    .filter(([key]) => key in formComponentMap)
    .reduce((acc, [key, label]) => {
        acc[key] = label;
        return acc;
    }, {});

export default function TimeTableAddModal({ open, onClose, onSave, defaultDate }) {
  const [recordType, setRecordType] = useState("");
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const FormComponent = recordType ? formComponentMap[recordType] : null;

  const selectOptions = useMemo(() => {
    if (!open) return {};
    console.log("[AddModal] Loading data for select options...");
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
         console.error("[AddModal] Error loading data for select options:", error);
         return { years: [], sites: [], lecturers: [], courses: [], semesters: [] };
    }
  }, [open]); 

  useEffect(() => {
    if (!open) {
      setRecordType(""); setFormData({}); setErrors({}); setGeneralError(""); setIsLoading(false);
    } else {
      setRecordType(""); setFormData({}); setErrors({}); setGeneralError("");
    }
  }, [open]);

   useEffect(() => {
        if (recordType && open) {
            const initialData = generateInitialFormData(recordType, defaultDate);
            setFormData(initialData);
            setErrors({}); setGeneralError("");
        } else if (!recordType) {
             setFormData({});
        }
    }, [recordType, defaultDate, open]);


  const handleRecordTypeChange = useCallback((event) => {
    setRecordType(event.target.value);
  }, []);

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

  const handleSaveClick = useCallback(async () => {
    if (!recordType || !FormComponent) {return; }
    setIsLoading(true); setErrors({}); setGeneralError("");
    const entityKey = getEntityKeyByRecordType(recordType);
    if (!entityKey) {setIsLoading(false); return; }

    let dataToSave = { ...formData };
    let validationExtra = { recordType: recordType };
     if (recordType === 'semester') {
         const parentId = dataToSave.yearCode;
         if (!parentId) { setErrors({ yearCode: "Please select the parent Year." }); setIsLoading(false); return; }
         const years = getRecords("years") || [];
         const parentYear = years.find(y => y.yearCode === parentId);
         if (parentYear) {
            validationExtra.existingSemesters = parentYear.semesters || [];
            validationExtra.yearRecord = parentYear;
         } else {setIsLoading(false); return; }
     } else if (recordType === 'room') {
          const parentId = dataToSave.siteCode;
          if (!parentId) { setErrors({ siteCode: "Please select the parent Site." }); setIsLoading(false); return; }
          const sites = getRecords("sites") || [];
          const parentSite = sites.find(s => s.siteCode === parentId);
          if (parentSite) {
             validationExtra.existingRooms = parentSite.rooms || [];
             validationExtra.siteRecord = parentSite;
          } else {setIsLoading(false); return; }
     } else if (entityKey) {
        try { validationExtra[`existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`] = getRecords(entityKey) || []; }
        catch (e) { console.error("Error getting records for validation", e); }
     }
    const result = await handleSaveOrUpdateRecord(entityKey, dataToSave, "add", validationExtra);
    setIsLoading(false);
    if (result.success) {
      console.log("[AddModal] Save successful.");
      onSave?.(); onClose?.();
    } else {
      console.error("[AddModal] Save failed:", result.message, result.errors);
      setErrors(result.errors || {});
      setGeneralError(result.message || "Failed to save record.");
    }
  }, [recordType, formData, FormComponent, onSave, onClose]);
  return (
    <PopupModal open={open} onClose={onClose} title={`Add New ${recordTypeLabels[recordType] || 'Record'}`}>
      <FormWrapper>
        <FormControl fullWidth sx={{ mb: 3 }} disabled={isLoading}>
          <InputLabel id="add-record-type-label">Select Record Type</InputLabel>
          <Select labelId="add-record-type-label" value={recordType} label="Select Record Type" onChange={handleRecordTypeChange}>
            {Object.entries(recordTypeLabels).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {generalError && <Alert severity="error" sx={{ mb: 2 }}>{generalError}</Alert>}
        <Box sx={{ minHeight: '200px' }}>
          {FormComponent ? (
            <FormComponent
              formData={formData}
              errors={errors}
              onChange={handleFormChange}
              mode="add"
              selectOptions={selectOptions}
            />
          ) : (
            recordType && <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>Form not implemented for this type yet.</Typography>
          )}
           {!recordType && <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>Please select a record type above.</Typography>}
        </Box>
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <CustomButton variant="outlined" onClick={onClose} disabled={isLoading}>
            Cancel
          </CustomButton>
          <CustomButton onClick={handleSaveClick} disabled={!recordType || !FormComponent || isLoading} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}>
            {isLoading ? "Saving..." : "Save Record"}
          </CustomButton>
        </Stack>
      </FormWrapper>
    </PopupModal>
  );
}