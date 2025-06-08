import React, { useState, useEffect, useCallback } from "react";
import {
  Stack, MenuItem, Select, InputLabel, FormControl, Alert, Box, CircularProgress, Typography, DialogContent, DialogActions, Button
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";
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

// רשימת הישויות שניתן להוסיף במודאל זה
const ADDABLE_ENTITY_TYPES = {
  event: "General Event",
  holiday: "Holiday",
  vacation: "Vacation",
  task: "Task / Assignment",
  semester: "Semester (into existing Year)",
  year: "Academic Year",
};

// --- שלב 3: פונקציית עזר רזה שטוענת רק מה שצריך ---
const loadSelectOptionsAsync = async () => {
    try {
        // טפסים אלו צריכים רק רשימת שנים (עבור סמסטרים) וקורסים (עבור משימות)
        const [years, courses] = await Promise.all([
            fetchCollection("years"),
            fetchCollection("courses")
        ]);
        return {
            years: (years || []).map(y => ({ value: y.yearCode, label: `Year ${y.yearNumber}` })),
            courses: (courses || []).map(c => ({ value: c.courseCode, label: `${c.courseName} (${c.courseCode})` })),
        };
    } catch (error) {
         console.error("[AddModal:LoadOptions] Error:", error);
         return { years: [], courses: [] };
    }
};

export default function TimeTableAddModal({ open, onClose, onSave, defaultDate }) {
  const [recordType, setRecordType] = useState("");
  const [formData, setFormData] = useState(null);
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
      // איפוס מלא בסגירה
      setRecordType(""); setFormData(null); setErrors({}); setGeneralError("");
    }
  }, [open]);

  useEffect(() => {
    if (recordType && open) {
      const defaultValues = defaultDate ? { startDate: defaultDate } : {};
      const initialData = formMappings[recordType]?.initialData(defaultValues);
      setFormData(initialData || null);
      setErrors({}); setGeneralError("");
    } else {
      setFormData(null);
    }
  }, [recordType, defaultDate, open]);
  
  const handleFormChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
  }, [errors]);

  const handleSaveClick = useCallback(async () => {
    if (!recordType || !formData) return;
    setIsLoading(true); setErrors({}); setGeneralError("");

    const result = await handleSaveOrUpdateRecord(
        formMappings[recordType].collectionName, formData, "add", { recordType }
    );
    setIsLoading(false);

    if (result.success) {
      onSave?.();
      onClose?.();
    } else {
      setErrors(result.errors || {});
      setGeneralError(result.message || "Failed to save record.");
    }
  }, [recordType, formData, onSave, onClose]);

  const handleRecordTypeChange = (e) => {
    setRecordType(e.target.value);
  };

  return (
    <PopupModal open={open} onClose={onClose} title={`Add New Record`}>
       <DialogContent>
          <Stack spacing={3} sx={{ minWidth: { sm: 500 }, pt: 1 }}>
              <FormControl fullWidth disabled={isLoading || isLoadingOptions}>
                  <InputLabel id="add-record-type-label">Type of Record to Add</InputLabel>
                  <Select
                    labelId="add-record-type-label"
                    value={recordType}
                    label="Type of Record to Add"
                    onChange={handleRecordTypeChange}
                >
                    <MenuItem value="" disabled><em>Select type...</em></MenuItem>
                    {Object.entries(ADDABLE_ENTITY_TYPES).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
              </FormControl>

              {generalError && <Alert severity="error">{generalError}</Alert>}
              {isLoadingOptions && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}

              {formData && FormComponent && !isLoadingOptions && (
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