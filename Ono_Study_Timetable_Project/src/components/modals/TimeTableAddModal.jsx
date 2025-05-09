import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Stack, MenuItem, Select, InputLabel, FormControl, Alert, Box, CircularProgress, Typography
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CustomButton from "../UI/CustomButton";
import {
    recordTypeLabels as allRecordTypeLabels,
    getEntityKeyByRecordType,
    generateInitialFormData
} from "../../utils/formMappings";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers"; // Will be async
import { fetchCollection, fetchDocumentById } from "../../firebase/firestoreService"; // Firestore service

// Import ALL possible form components (ensure paths are correct)
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import LecturerForm from "./forms/LecturerForm";
import CourseMeetingForm from "./forms/CourseMeetingForm"; // (Formerly SpesificCourseFormEdit)
import TaskForm from "./forms/TaskForm";
import SiteForm from "./forms/SiteForm";
import RoomForm from "./forms/RoomForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

// Map recordType to the actual Form Component
// Excludes 'course' as its definition is handled by a dedicated modal
const formComponentMap = {
  year: YearForm, semester: SemesterForm, lecturer: LecturerForm,
  courseMeeting: CourseMeetingForm, task: TaskForm, site: SiteForm,
  room: RoomForm, holiday: HolidayForm, vacation: VacationForm, event: EventForm,
};

// Filter labels to only include types that can be added via this modal
const addableRecordTypeLabels = Object.entries(allRecordTypeLabels)
    .filter(([key]) => key in formComponentMap)
    .reduce((acc, [key, label]) => { acc[key] = label; return acc; }, {});

// Helper to load data for form dropdowns asynchronously from Firestore
const loadSelectOptionsAsync = async () => {
    console.log("[AddModal:LoadOptions] Loading select options from Firestore...");
    try {
        // Fetch all necessary data lists in parallel
        const [yearsData, sitesData, lecturersData, coursesData] = await Promise.all([
            fetchCollection("years"),
            fetchCollection("sites"),
            fetchCollection("lecturers"),
            fetchCollection("courses") // Needed for 'TaskForm' or 'CourseMeetingForm'
        ]);

        const allSemesters = (yearsData || []).flatMap(y => (y.semesters || []).map(s => ({ value: s.semesterCode, label: `Sem ${s.semesterNumber} / Y${y.yearNumber} (${s.startDate} - ${s.endDate})` })));
        const formattedRooms = (sitesData || []).flatMap(site => (site.rooms || []).map(room => ({ value: room.roomCode, label: `${room.roomName || `Room (${room.roomCode})`} @ ${site.siteName || `Site (${site.siteCode})`}` })));
        const formattedLecturers = (lecturersData || []).map(l => ({ value: l.id, label: `${l.name} (${l.id})` }));
        const formattedCourses = (coursesData || []).map(c => ({ value: c.courseCode, label: `${c.courseName} (${c.courseCode})` }));
        const formattedYears = (yearsData || []).map(y => ({ value: y.yearCode, label: `Year ${y.yearNumber} (${y.yearCode})` }));
        const formattedSites = (sitesData || []).map(s => ({ value: s.siteCode, label: `${s.siteName} (${s.siteCode})` }));

        return {
            years: formattedYears,
            sites: formattedSites,
            lecturers: formattedLecturers,
            courses: formattedCourses,
            semesters: allSemesters,
            rooms: formattedRooms
        };
    } catch (error) {
         console.error("[AddModal:LoadOptions] Error loading select options:", error);
         return { years: [], sites: [], lecturers: [], courses: [], semesters: [], rooms: [] };
    }
};

// --- Main Add Modal Component ---
export default function TimeTableAddModal({ open, onClose, onSave, defaultDate }) {
  // --- State ---
  const [recordType, setRecordType] = useState("");
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For save operation
  const [isLoadingOptions, setIsLoadingOptions] = useState(false); // For loading select options
  const [selectOptions, setSelectOptions] = useState({ years: [], sites: [], lecturers: [], courses: [], semesters: [], rooms: [] });

  // Determine which form component to render based on selected recordType
  const FormComponent = recordType ? formComponentMap[recordType] : null;

  // --- Effects ---
  // Load select options when the modal becomes visible
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

  // Reset form state when modal opens or closes
  useEffect(() => {
    if (!open) {
      setRecordType(""); setFormData({}); setErrors({}); setGeneralError(""); setIsLoading(false);
    } else {
      // Reset for a new entry when modal opens (recordType is cleared first)
      setRecordType(""); setFormData({}); setErrors({}); setGeneralError("");
    }
  }, [open]);

  // Generate initial form data structure when a recordType is selected
   useEffect(() => {
        if (recordType && open) { // Only if a type is chosen and modal is open
            const initialData = generateInitialFormData(recordType, defaultDate);
            setFormData(initialData);
            setErrors({}); setGeneralError(""); // Clear errors for the new form type
        } else if (!recordType && open) { // If type is de-selected while modal is open
             setFormData({}); // Clear form data
        }
    }, [recordType, defaultDate, open]);


  // --- Handlers ---
  // Update the selected recordType state
  const handleRecordTypeChange = useCallback((event) => {
    setRecordType(event.target.value);
  }, []);

  // Handle changes from any field within the dynamically rendered form
  const handleFormChange = useCallback((eventOrData) => {
    setGeneralError(""); // Clear general error on any form change
    let name, value;

    if (eventOrData.target && typeof eventOrData.target === 'object' && typeof eventOrData.target.name === 'string') {
        name = eventOrData.target.name;
        value = eventOrData.target.type === 'checkbox' ? eventOrData.target.checked : eventOrData.target.value;
    } else if (typeof eventOrData === 'object' && eventOrData !== null && eventOrData.name === 'hours' && Array.isArray(eventOrData.value)) {
        name = 'hours'; value = eventOrData.value; // For CourseForm hours array
    } else {
        console.warn("[AddModal:FormChange] Unhandled data format:", eventOrData);
        return;
    }

    setFormData((prev) => {
         const updatedData = { ...prev, [name]: value };
         // Specific logic for 'allDay' checkbox in EventForm
         if (name === 'allDay' && value === true) {
             updatedData.startHour = ''; updatedData.endHour = '';
         }
        return updatedData;
    });

    // Clear specific field error
    if (errors[name]) { setErrors((prev) => { const newE = {...prev}; delete newE[name]; return newE; });}
    // Clear hours array related errors if 'hours' changed
    if (name === 'hours') {
        setErrors((prev) => {
            const newE = {...prev};
            if(newE.hours) delete newE.hours;
            Object.keys(newE).forEach(k => {if(k.startsWith('hours[')) delete newE[k];});
            return newE;
        });
    }
  }, [errors]);


  // Handle the "Save Record" button click
  const handleSaveClick = useCallback(async () => {
    if (!recordType || !FormComponent) {
      setGeneralError("Please select a record type first."); return;
    }
    setIsLoading(true); setErrors({}); setGeneralError("");

    const entityKey = getEntityKeyByRecordType(recordType);
    if (!entityKey) {
        setIsLoading(false); setGeneralError(`Configuration error: No entity key for type '${recordType}'.`); return;
    }

    let dataToSave = { ...formData };
    // Prepare validationExtra for the handler.
    // The handler will use this to fetch necessary context for its validation pass.
    let validationExtra = {
        recordType: recordType, // Pass the logical record type
        editingId: null,        // Always null for 'add' mode
        options: {}             // Can pass any form-specific options for validation
    };

    // For nested types, if validation function needs the parent record's data,
    // fetch it here and pass it. Handler will also fetch parent for actual save.
    try {
        if (recordType === 'semester' && dataToSave.yearCode) {
            validationExtra.parentRecord = await fetchDocumentById('years', dataToSave.yearCode);
            if (!validationExtra.parentRecord) throw new Error(`Parent year ${dataToSave.yearCode} not found.`);
        } else if (recordType === 'room' && dataToSave.siteCode) {
            validationExtra.parentRecord = await fetchDocumentById('sites', dataToSave.siteCode);
            if (!validationExtra.parentRecord) throw new Error(`Parent site ${dataToSave.siteCode} not found.`);
        }
    } catch (fetchParentError) {
        console.error("[AddModal:Save] Error fetching parent for validation:", fetchParentError);
        setGeneralError(`Error verifying parent: ${fetchParentError.message}`);
        setIsLoading(false); return;
    }

    console.log(`[AddModal:Save] Saving type: ${recordType}, entityKey: ${entityKey}`);
    // Call the handler, which will perform Firestore operations AND validation
    const result = await handleSaveOrUpdateRecord(
        entityKey, dataToSave, "add", validationExtra, false // false: let handler validate
    );
    setIsLoading(false);

    if (result.success) {
      console.log("[AddModal:Save] Record saved successfully via handler.");
      onSave?.(); // Notify parent (e.g., TimeTableManagementPage) to refresh data
      onClose?.(); // Close this modal
    } else {
      console.error("[AddModal:Save] Handler failed:", result.message, result.errors);
      setErrors(result.errors || {}); // Display field-specific errors from handler
      setGeneralError(result.message || "Failed to save record. Please check the details.");
    }
  }, [recordType, formData, FormComponent, onSave, onClose]); // Dependencies


  // --- Render Logic ---
  return (
    <PopupModal open={open} onClose={onClose} title={`Add New ${addableRecordTypeLabels[recordType] || 'Record'}`}>
       <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Record Type Selection Dropdown */}
            <FormControl fullWidth sx={{ mb: 2 }} disabled={isLoading || isLoadingOptions}>
                <InputLabel id="add-record-type-label">Select Record Type</InputLabel>
                <Select
                    labelId="add-record-type-label"
                    value={recordType}
                    label="Select Record Type"
                    onChange={handleRecordTypeChange}
                >
                    {Object.entries(addableRecordTypeLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                    {Object.keys(addableRecordTypeLabels).length === 0 && <MenuItem value="" disabled>No types to add</MenuItem>}
                </Select>
            </FormControl>

            {/* General Error Alert */}
            {generalError && <Alert severity="error" sx={{ mb: 2 }}>{generalError}</Alert>}

            {/* Loading Indicator for Options or Dynamic Form Area */}
            {isLoadingOptions ? (
                <Box sx={{display:'flex', justifyContent:'center', my: 3, alignItems: 'center'}}>
                    <CircularProgress size={30}/>
                    <Typography sx={{ml:1.5, color: 'text.secondary'}}>Loading form options...</Typography>
                </Box>
            ) : FormComponent ? (
                <FormComponent
                    formData={formData}
                    errors={errors}
                    onChange={handleFormChange}
                    mode="add"
                    selectOptions={selectOptions} // Pass the loaded options to the form
                />
            ) : (
                recordType && <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>Form not available for this type.</Typography>
            )}
            {!recordType && !isLoadingOptions &&
                <Typography sx={{ textAlign: 'center', mt: 4, color:'text.secondary' }}>
                    Please select a record type to begin.
                </Typography>
            }

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <CustomButton variant="outlined" onClick={onClose} disabled={isLoading || isLoadingOptions}>
                    Cancel
                </CustomButton>
                <CustomButton
                    onClick={handleSaveClick}
                    disabled={!recordType || !FormComponent || isLoading || isLoadingOptions || Object.values(errors).some(e => !!e)}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isLoading ? "Saving..." : "Save Record"}
                </CustomButton>
            </Stack>
       </Stack>
    </PopupModal>
  );
}