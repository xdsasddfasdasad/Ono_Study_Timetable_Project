// src/components/modals/TimeTableAddModal.jsx

import React, { useState, useEffect, useCallback } from "react";
// Imports Material-UI components for building the modal's UI.
import {
  Stack, MenuItem, Select, InputLabel, FormControl, Alert, Box, CircularProgress, Typography, DialogContent, DialogActions, Button
} from "@mui/material";
// Imports a generic, reusable modal wrapper.
import PopupModal from "../UI/PopupModal";
// Imports utility and handler functions for data mapping and database operations.
import { formMappings } from "../../utils/formMappings";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";
import { fetchCollection } from "../../firebase/firestoreService";

// --- Step 1: Import only the specific form components this modal can render. ---
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import TaskForm from "./forms/TaskForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";

// --- Step 2: Map the entity type string to its corresponding React form component. ---
// This pattern allows for dynamically rendering the correct form without a large switch statement.
const formComponentMap = {
  year: YearForm,
  semester: SemesterForm,
  task: TaskForm,
  holiday: HolidayForm,
  vacation: VacationForm,
  event: EventForm,
};

// A constant defining the entity types this modal is responsible for adding.
const ADDABLE_ENTITY_TYPES = {
  event: "General Event",
  holiday: "Holiday",
  vacation: "Vacation",
  task: "Task / Assignment",
  semester: "Semester (into existing Year)",
  year: "Academic Year",
};

// --- Step 3: A lean helper function that only loads the data needed for the forms in *this* modal. ---
const loadSelectOptionsAsync = async () => {
    try {
        // These forms only require a list of years (for creating semesters) and courses (for creating tasks).
        // Fetching only what's needed is more efficient than loading all possible options.
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
         return { years: [], courses: [] }; // Return empty arrays on failure.
    }
};

// This is a "smart" component that provides a single, generic interface for adding various new records.
export default function TimeTableAddModal({ open, onClose, onSave, defaultDate }) {
  // === STATE MANAGEMENT ===
  const [recordType, setRecordType] = useState(""); // The type of record the user wants to add.
  const [formData, setFormData] = useState(null); // The data object for the currently displayed form.
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For the save action.
  const [isLoadingOptions, setIsLoadingOptions] = useState(false); // For the initial data load.
  const [selectOptions, setSelectOptions] = useState({}); // Data for form dropdowns.

  // Dynamically select the form component to render based on the current `recordType`.
  const FormComponent = recordType ? formComponentMap[recordType] : null;

  // Effect to load dropdown options when the modal is opened.
  useEffect(() => {
    if (open) {
      setIsLoadingOptions(true);
      loadSelectOptionsAsync().then(options => {
        setSelectOptions(options);
        setIsLoadingOptions(false);
      });
    } else {
      // Perform a full reset when the modal is closed.
      setRecordType(""); setFormData(null); setErrors({}); setGeneralError("");
    }
  }, [open]);

  // Effect to initialize the form data whenever the user selects a new record type.
  useEffect(() => {
    if (recordType && open) {
      // Pre-populate with a default date if one was passed (e.g., from clicking on the calendar).
      const defaultValues = defaultDate ? { startDate: defaultDate } : {};
      const initialData = formMappings[recordType]?.initialData(defaultValues);
      setFormData(initialData || null);
      // Reset any previous errors.
      setErrors({}); setGeneralError("");
    } else {
      // If no record type is selected, there should be no form data.
      setFormData(null);
    }
  }, [recordType, defaultDate, open]);
  
  // Generic form change handler, memoized for performance.
  const handleFormChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    // Clear validation error on change.
    if (errors[name]) setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; });
  }, [errors]);

  // Handler for the save button click.
  const handleSaveClick = useCallback(async () => {
    if (!recordType || !formData) return;
    setIsLoading(true); setErrors({}); setGeneralError("");

    // This component cleanly delegates the actual database operation to a dedicated handler.
    const result = await handleSaveOrUpdateRecord(
        formMappings[recordType].collectionName, formData, "add", { recordType }
    );
    setIsLoading(false);

    if (result.success) {
      onSave?.(); // Notify parent of success.
      onClose?.(); // Close the modal.
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
              {/* Step 1: User selects the type of record to add. */}
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
              {/* Show a spinner while dropdown options are loading in the background. */}
              {isLoadingOptions && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}

              {/* Step 2: The appropriate form is rendered once a type is selected and options are loaded. */}
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