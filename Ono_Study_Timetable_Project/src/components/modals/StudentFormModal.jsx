// src/components/modals/StudentFormModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Stack, Alert, Box, CircularProgress } from "@mui/material";
import PopupModal from "../UI/PopupModal";
import StudentForm from "./forms/StudentForm";
import CustomButton from "../UI/CustomButton";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";
import { validateStudentForm } from "../../utils/validateForm";

export default function StudentFormModal({
    open,
    onClose,
    onSaveSuccess,
    initialData,
    existingStudents
}) {
    const mode = initialData ? "edit" : "add";
    const isEditMode = mode === "edit";
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (open) {
            const defaultFormStructure = {
                id: "", firstName: "", lastName: "", email: "", username: "",
                phone: "", password: "", confirmPassword: ""
            };
            if (isEditMode && initialData) {
                console.log("[StudentModal] Initializing EDIT mode with data:", initialData);
                setFormData({
                    ...defaultFormStructure,
                    ...initialData,
                    password: "",
                    confirmPassword: ""
                });
            } else {
                console.log("[StudentModal] Initializing ADD mode.");
                setFormData(defaultFormStructure);
            }
            setErrors({});
            setGeneralError("");
            setIsLoading(false);
        }
    }, [open, initialData, isEditMode]);
    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        setGeneralError("");
    }, [errors]);
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
  ]);
    return (
        <PopupModal
            open={open}
            onClose={onClose}
            title={isEditMode ? `Edit Student: ${initialData?.firstName || ''} ${initialData?.lastName || ''}` : "Add New Student"}
        >
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                {generalError && <Alert severity="error" sx={{ mb: 1 }}>{generalError}</Alert>}
                <StudentForm
                    formData={formData}
                    errors={errors}
                    onChange={handleFormChange}
                    mode={mode}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                    <CustomButton
                        variant="outlined"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </CustomButton>
                    <CustomButton
                        onClick={handleSave}
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