// src/components/modals/StudentFormModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Stack, Alert, Box, CircularProgress } from "@mui/material";
import PopupModal from "../UI/PopupModal"; // Base modal component
import StudentForm from "./forms/StudentForm"; // The presentation form component
import CustomButton from "../UI/CustomButton"; // Styled button
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers"; // Central handler
// Import validation function directly into the modal for pre-handler check
import { validateStudentForm } from "../../utils/validateForm";
// Import getRecords only if needed for extra data NOT passed from parent (usually not needed)
// import { getRecords } from "../../utils/storage";

// This modal handles both Adding and Editing students.
export default function StudentFormModal({
    open,             // Boolean: Controls modal visibility (from parent page)
    onClose,          // Function: Callback to close the modal (from parent page)
    onSaveSuccess,    // Function: Callback after successful save (triggers refresh in parent)
    initialData,      // Object | null: Student data for editing, null for adding
    existingStudents  // Array: List of existing students for uniqueness validation (passed from parent)
}) {
    // Determine mode ('add' or 'edit') based on the presence of initialData
    const mode = initialData ? "edit" : "add";
    const isEditMode = mode === "edit";

    // --- State Management within the Modal ---
    // formData holds the current state of the form fields
    const [formData, setFormData] = useState({});
    // errors holds field-specific validation errors
    const [errors, setErrors] = useState({});
    // generalError holds non-field specific errors (e.g., save failure)
    const [generalError, setGeneralError] = useState("");
    // isLoading tracks the async save operation
    const [isLoading, setIsLoading] = useState(false);

    // --- Effects ---
    // Effect to initialize or reset form data when the modal opens or relevant props change
    useEffect(() => {
        if (open) {
            // Define the default empty structure for a student form
            const defaultFormStructure = {
                id: "", firstName: "", lastName: "", email: "", username: "",
                phone: "", password: "", confirmPassword: ""
            };

            // If editing, merge initialData into the default structure
            // Clear password fields for security/UX reasons in edit mode
            if (isEditMode && initialData) {
                console.log("[StudentModal] Initializing EDIT mode with data:", initialData);
                setFormData({
                    ...defaultFormStructure, // Start with default structure
                    ...initialData,          // Override with existing data
                    password: "",           // Always clear password field
                    confirmPassword: ""     // Always clear confirmation field
                });
            } else {
                // If adding, use the default empty structure
                console.log("[StudentModal] Initializing ADD mode.");
                setFormData(defaultFormStructure);
            }
            // Reset errors and loading state every time the modal opens or data changes
            setErrors({});
            setGeneralError("");
            setIsLoading(false);
        }
        // Dependencies ensure re-initialization if modal opens/closes or edit data changes
    }, [open, initialData, isEditMode]);

    // --- Handlers ---
    // Callback passed to StudentForm to update local formData state on field changes
    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));

        // Clear validation error for the specific field being changed
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name]; // Remove the specific error
                return newErrors;
            });
        }
        // Clear any general error message when the user types
        setGeneralError("");
    }, [errors]); // Dependency: errors state (needed to clear specific errors)

    // Handle the Save / Update button click
// src/components/modals/StudentFormModal.jsx

// Assuming imports and other parts of the component are defined as in the previous response...

    // Handle the Save / Update button click - REVISED LOGIC
    const handleSave = useCallback(async () => {
      setIsLoading(true);
      setErrors({}); // Clear previous UI errors
      setGeneralError("");
      console.log(`[StudentModal] Attempting to ${mode} student...`);

      // --- 1. Perform Full Local Validation First ---
      const validationOptions = {
          editingId: isEditMode ? initialData?.id : null,
          skipPassword: isEditMode && !formData.password?.trim() // Skip ONLY if editing AND no new password typed
      };
      console.log("[StudentModal] Running local validation with options:", validationOptions);
      // Validate the current full formData from state
      const validationErrors = validateStudentForm(formData, existingStudents || [], validationOptions);

      // If local validation fails: Update UI and stop.
      if (Object.keys(validationErrors).length > 0) {
          console.warn("[StudentModal] Local validation failed:", validationErrors);
          setErrors(validationErrors);
          setIsLoading(false);
          setGeneralError("Please fix the errors highlighted in the form.");
          return; // Halt the save process
      }

      // --- 2. Prepare Data for Handler (if local validation passed) ---
      console.log("[StudentModal] Local validation passed. Preparing data for handler...");
      let dataToSave = { ...formData };

      // ALWAYS remove confirmPassword before sending to handler
      delete dataToSave.confirmPassword;

      // Remove password field if editing and it wasn't changed (empty/blank)
      // The handler will only hash if the password field *is* present.
      if (isEditMode && !formData.password?.trim()) {
          delete dataToSave.password;
          console.log("[StudentModal] Edit mode: Password field is blank, removing before save.");
      }

      // Prepare minimal validation context for the HANDLER (optional, but good practice)
      // Handler might re-verify uniqueness or other server-side rules.
      const handlerValidationExtra = {
           existingStudents: existingStudents || [],
           editingId: isEditMode ? initialData?.id : null,
           options: validationOptions // Pass the same options in case handler logic uses them
      };

      console.log("[StudentModal] Data being sent to handler:", dataToSave);
      // console.log("[StudentModal] Validation extra for handler:", handlerValidationExtra);

      // --- 3. Call the Central Handler ---
      // Pass `true` for the 5th argument `skipInternalValidation`
      const result = await handleSaveOrUpdateRecord(
          "students",           // entityKey
          dataToSave,           // Cleaned data
          mode,                 // 'add' or 'edit'
          handlerValidationExtra, // Minimal context for handler
          true                  // <<< Tell handler to SKIP its internal validation
      );

      setIsLoading(false); // End loading state

      // --- 4. Handle Handler's Response ---
      if (result.success) {
          console.log("[StudentModal] Handler reported successful save/update.");
          onSaveSuccess?.(); // Notify parent page
          onClose?.();        // Close modal
      } else {
          console.error("[StudentModal] Handler reported failure:", result.message, result.errors);
          // Display errors returned from the handler (could be save errors, etc.)
          setErrors(result.errors || {});
          setGeneralError(result.message || `Failed to ${mode} student.`);
      }
  }, [
      formData, mode, isEditMode, initialData, existingStudents, onClose, onSaveSuccess
  ]); // Dependencies

    // --- Render Logic ---
    return (
        <PopupModal
            open={open}
            onClose={onClose}
            title={isEditMode ? `Edit Student: ${initialData?.firstName || ''} ${initialData?.lastName || ''}` : "Add New Student"}
        >
            {/* Using Stack for direct content padding instead of FormWrapper */}
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}> {/* Responsive padding */}

                {/* General Error Alert Area */}
                {generalError && <Alert severity="error" sx={{ mb: 1 }}>{generalError}</Alert>}

                {/* The Reusable Student Form Component */}
                <StudentForm
                    formData={formData}
                    errors={errors}
                    onChange={handleFormChange}
                    mode={mode}
                    // No selectOptions needed for this specific form
                />

                {/* Modal Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                    <CustomButton
                        variant="outlined"
                        onClick={onClose}
                        disabled={isLoading} // Disable while saving
                    >
                        Cancel
                    </CustomButton>
                    <CustomButton
                        onClick={handleSave}
                        // Disable if loading OR if there are any validation errors currently shown
                        disabled={isLoading || Object.values(errors).some(e => !!e)}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isLoading ? "Saving..." : (isEditMode ? "Update Student" : "Save Student")}
                    </CustomButton>
                </Box>
            </Stack>
        </PopupModal>
    );
}