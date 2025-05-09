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
                setFormData({ ...defaultFormStructure, ...initialData, password: "", confirmPassword: "" });
            } else {
                setFormData(defaultFormStructure);
            }
            setErrors({}); setGeneralError(""); setIsLoading(false);
        }
    }, [open, initialData, isEditMode]);

    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: newValue }));
        if (errors[name]) { setErrors((prev) => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });}
        setGeneralError("");
    }, [errors]);

    const handleSave = useCallback(async () => {
        setIsLoading(true); setErrors({}); setGeneralError("");
        console.log(`[StudentModal] Attempting to ${mode} student...`);

        const validationOptions = {
            editingId: isEditMode ? initialData?.id : null,
            skipPassword: isEditMode && !formData.password?.trim()
        };
        console.log("[StudentModal] Running local async validation with options:", validationOptions);
        // ✅ Call ASYNC validation (no longer needs existingStudents prop)
        const validationErrors = await validateStudentForm(formData, validationOptions);

        if (Object.keys(validationErrors).length > 0) {
            console.warn("[StudentModal] Local validation failed:", validationErrors);
            setErrors(validationErrors); setIsLoading(false);
            setGeneralError("Please fix the errors highlighted in the form.");
            return;
        }

        console.log("[StudentModal] Local validation passed. Preparing data for handler...");
        let dataToSave = { ...formData };
        delete dataToSave.confirmPassword;
        if (isEditMode && !formData.password?.trim()) { delete dataToSave.password; }

        // For the handler, options are still relevant, but existingStudents is handled by handler's getExisting...
        const handlerValidationExtra = {
           editingId: isEditMode ? initialData?.id : null,
           options: validationOptions,
           recordType: 'student' // Explicitly pass recordType
        };

        console.log("[StudentModal] Data to handler:", dataToSave);

        const result = await handleSaveOrUpdateRecord(
            "students", dataToSave, mode, handlerValidationExtra, true // Skip handler's validation pass
        );
        setIsLoading(false);

        if (result.success) {
            console.log("[StudentModal] Handler successful.");
            onSaveSuccess?.(); onClose?.();
        } else {
            console.error("[StudentModal] Handler failed:", result.message, result.errors);
            setErrors(result.errors || {});
            setGeneralError(result.message || `Failed to ${mode} student.`);
        }
    }, [ formData, mode, isEditMode, initialData, onClose, onSaveSuccess ]);


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
                    <CustomButton variant="outlined" onClick={onClose} disabled={isLoading} > Cancel </CustomButton>
                    <CustomButton onClick={handleSave} disabled={isLoading || Object.values(errors).some(e => !!e)} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null} >
                        {isLoading ? "Saving..." : (isEditMode ? "Update Student" : "Save Student")}
                    </CustomButton>
                </Box>
            </Stack>
        </PopupModal>
    );
}