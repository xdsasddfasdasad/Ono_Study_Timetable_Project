import React, { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import {
  Stack, MenuItem, Select, InputLabel, FormControl, Alert, Box, CircularProgress, Typography
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import FormWrapper from "../UI/FormWrapper";
import CustomButton from "../UI/CustomButton";

// Import Helpers
import {
  recordTypeLabels,
  getEntityKeyByRecordType,
  generateInitialFormData
} from "../../utils/formMappings"; // Adjust path

// Import Handlers and Storage
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";
import { getRecords } from "../../utils/storage";

// Import ALL possible form components
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import LecturerForm from "./forms/LecturerForm";
import CourseForm from "./forms/CourseForm"; // Likely not used directly here anymore
import CourseMeetingForm from "./forms/CourseMeetingForm"; // Use alias
import TaskForm from "./forms/TaskForm";
import SiteForm from "./forms/SiteForm";
import RoomForm from "./forms/RoomForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

// Map recordType to the actual Form Component
const formComponentMap = {
  year: YearForm,
  semester: SemesterForm,
  lecturer: LecturerForm,
  // course: CourseForm, // Definition handled by dedicated modal
  courseMeeting: CourseMeetingForm,
  task: TaskForm,
  site: SiteForm,
  room: RoomForm,
  holiday: HolidayForm,
  vacation: VacationForm,
  event: EventForm,
};

// --- Main Component ---
export default function TimeTableAddModal({ open, onClose, onSave, defaultDate }) {
  const [recordType, setRecordType] = useState("");
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const FormComponent = recordType ? formComponentMap[recordType] : null;

  // --- ✅ Preload data for Select dropdowns (Memoized) ---
  const selectOptions = useMemo(() => {
    if (!open) return {}; // Don't load if not open
    console.log("[AddModal] Loading data for select options...");
    try {
        // Fetch data needed by ANY of the potential forms
        const years = getRecords("years") || [];
        const sites = getRecords("sites") || [];
        const lecturers = getRecords("lecturers") || [];
        const courses = getRecords("courses") || [];
        const allSemesters = years.flatMap(y => (y.semesters || []).map(s => ({ ...s, yearLabel: `Year ${y.yearNumber}` })));
        const formattedRooms = sites.flatMap(site =>
          (site.rooms || []).map(room => ({
              // value יהיה קוד החדר
              value: room.roomCode,
              // label ישלב את שם החדר ושם האתר
              label: `${room.roomName || `Room (${room.roomCode})`} @ ${site.siteName || `Site (${site.siteCode})`}`
              // אפשר להוסיף גם siteCode אם צריך לסינון עתידי
              // siteCode: site.siteCode
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
  }, [open]); // Reload options when modal opens

  // --- Effects ---
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


  // --- Handlers ---
  const handleRecordTypeChange = useCallback((event) => {
    setRecordType(event.target.value);
  }, []);

  const handleFormChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    setGeneralError("");
  }, [errors]);

  const handleSaveClick = useCallback(async () => {
    if (!recordType || !FormComponent) { /* ... error handling ... */ return; }
    setIsLoading(true); setErrors({}); setGeneralError("");
    const entityKey = getEntityKeyByRecordType(recordType);
    if (!entityKey) { /* ... error handling ... */ setIsLoading(false); return; }

    let dataToSave = { ...formData };
    let validationExtra = { recordType: recordType }; // Pass recordType for clarity

    // Prepare context for nested/complex types
     if (recordType === 'semester') {
         const parentId = dataToSave.yearCode;
         if (!parentId) { setErrors({ yearCode: "Please select the parent Year." }); setIsLoading(false); return; }
         const years = getRecords("years") || [];
         const parentYear = years.find(y => y.yearCode === parentId);
         if (parentYear) {
            validationExtra.existingSemesters = parentYear.semesters || [];
            validationExtra.yearRecord = parentYear;
         } else { /* ... error handling ... */ setIsLoading(false); return; }
     } else if (recordType === 'room') {
          const parentId = dataToSave.siteCode;
          if (!parentId) { setErrors({ siteCode: "Please select the parent Site." }); setIsLoading(false); return; }
          const sites = getRecords("sites") || [];
          const parentSite = sites.find(s => s.siteCode === parentId);
          if (parentSite) {
             validationExtra.existingRooms = parentSite.rooms || [];
             validationExtra.siteRecord = parentSite;
          } else { /* ... error handling ... */ setIsLoading(false); return; }
     } else if (entityKey) {
        // For simple entities, provide all existing records
        try { validationExtra[`existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`] = getRecords(entityKey) || []; }
        catch (e) { console.error("Error getting records for validation", e); }
     }

    // console.log(`[AddModal] Saving recordType: ${recordType}, entityKey: ${entityKey}`);
    // console.log("[AddModal] Data to save:", dataToSave);
    // console.log("[AddModal] Validation extra:", validationExtra);

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


  // --- Render Logic ---
  return (
    <PopupModal open={open} onClose={onClose} title={`Add New ${recordTypeLabels[recordType] || 'Record'}`}>
      <FormWrapper>
        <FormControl fullWidth sx={{ mb: 3 }} disabled={isLoading}>
          <InputLabel id="add-record-type-label">Select Record Type</InputLabel>
          <Select labelId="add-record-type-label" value={recordType} label="Select Record Type" onChange={handleRecordTypeChange}>
            {Object.entries(recordTypeLabels).map(([key, label]) => (
               // Optionally filter out 'course' if it's only handled by dedicated modal
               // key !== 'course' &&
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
              // ✅ Pass loaded options for Select dropdowns
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