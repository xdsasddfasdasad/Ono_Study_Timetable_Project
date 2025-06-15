import React, { useState, useEffect, useCallback } from "react";
import { Stack, Alert, Box, CircularProgress } from "@mui/material";
import PopupModal from "../UI/PopupModal";
import StudentForm from "./forms/StudentForm";
import CustomButton from "../UI/CustomButton";
// ✅ ADDED: Direct imports for auth and firestore services
import { signUpUser, updateUserAuthPassword } from "../../firebase/authService";
import { updateDocument } from "../../firebase/firestoreService";
import { validateStudentForm } from "../../utils/validateForm";

export default function StudentFormModal({
    open,
    onClose,
    onSaveSuccess,
    initialData,
}) {
    const mode = initialData ? "edit" : "add";
    const isEditMode = mode === "edit";

    const getInitialFormState = () => ({
        id: "", studentIdCard: "", firstName: "", lastName: "", email: "", username: "",
        phone: "", password: "", confirmPassword: ""
    });

    const [formData, setFormData] = useState(getInitialFormState());
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (isEditMode && initialData) {
                // For edit mode, populate with existing data but clear passwords
                setFormData({ ...getInitialFormState(), ...initialData });
            } else {
                // For add mode, reset to a clean slate
                setFormData(getInitialFormState());
            }
            // Reset errors and loading state whenever the modal opens
            setErrors({});
            setGeneralError("");
            setIsLoading(false);
        }
    }, [open, initialData, isEditMode]);

    const handleFormChange = useCallback((event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear specific field error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
        // Clear general error on any change
        setGeneralError("");
    }, [errors]);

    // ✅ REWRITTEN: The core logic for saving or updating a student
    const handleSave = useCallback(async () => {
        setIsLoading(true);
        setGeneralError("");
        setErrors({});

        // 1. Run Async Validation
        const validationOptions = { editingId: isEditMode ? initialData?.id : null };
        const validationErrors = await validateStudentForm(formData, validationOptions);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setGeneralError("נא לתקן את השגיאות בטופס.");
            setIsLoading(false);
            return;
        }

        // 2. Process based on mode (Add vs. Edit)
        try {
            if (isEditMode) {
                // --- EDIT LOGIC ---
                console.log("[StudentModal:Edit] Starting update process...");
                const studentId = initialData.id;

                // If password was entered, update it in Firebase Auth first
                if (formData.password?.trim()) {
                    await updateUserAuthPassword(formData.password.trim());
                    console.log("[StudentModal:Edit] Password updated in Auth.");
                }
                
                // Prepare data for Firestore update (exclude passwords and non-editable fields)
                const { password, confirmPassword, studentIdCard, ...dataToUpdate } = formData;
                await updateDocument("students", studentId, dataToUpdate);
                console.log("[StudentModal:Edit] Firestore document updated.");

            } else {
                // --- ADD LOGIC ---
                console.log("[StudentModal:Add] Starting creation process...");
                const { confirmPassword, ...dataToSave } = formData;
                // The signUpUser service handles both Auth and Firestore creation
                await signUpUser(dataToSave);
                console.log("[StudentModal:Add] User created successfully.");
            }

            // 3. Success
            onSaveSuccess?.();
            onClose?.();

        } catch (error) {
            console.error(`[StudentModal:${mode}] Failed:`, error);
            // Provide user-friendly feedback
            let friendlyMessage = `שגיאה ב${isEditMode ? 'עדכון' : 'הוספת'} הסטודנט.`;
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = "כתובת האימייל הזו כבר רשומה במערכת.";
                setErrors({ email: friendlyMessage });
            } else if (error.code === 'auth/weak-password') {
                friendlyMessage = "הסיסמה חלשה מדי.";
                setErrors({ password: friendlyMessage });
            }
            setGeneralError(friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    }, [formData, isEditMode, initialData, onClose, onSaveSuccess]);


    return (
        <PopupModal
            open={open}
            onClose={onClose}
            title={isEditMode ? `עריכת סטודנט: ${initialData?.firstName || ''} ${initialData?.lastName || ''}` : "הוספת סטודנט חדש"}
        >
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                {generalError && <Alert severity="error">{generalError}</Alert>}
                <StudentForm
                    formData={formData}
                    errors={errors}
                    onChange={handleFormChange}
                    mode={mode}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                    <CustomButton variant="outlined" onClick={onClose} disabled={isLoading}>
                        ביטול
                    </CustomButton>
                    <CustomButton onClick={handleSave} disabled={isLoading} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}>
                        {isLoading ? "שומר..." : (isEditMode ? "עדכן סטודנט" : "שמור סטודנט")}
                    </CustomButton>
                </Box>
            </Stack>
        </PopupModal>
    );
}