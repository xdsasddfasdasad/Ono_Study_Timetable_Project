// src/components/modals/StudentFormModal.jsx

import React, { useState, useEffect, useCallback } from "react";
// Imports Material-UI components for the modal layout.
import { Stack, Alert, Box, CircularProgress } from "@mui/material";
// Imports reusable UI components.
import PopupModal from "../UI/PopupModal";
import StudentForm from "./forms/StudentForm";
import CustomButton from "../UI/CustomButton";
// Imports the specific backend services for authentication and database operations.
import { signUpUser, updateUserAuthPassword } from "../../firebase/authService";
import { updateDocument } from "../../firebase/firestoreService";
// Imports the validation logic for the student form.
import { validateStudentForm } from "../../utils/validateForm";

// This is a "smart" component that encapsulates the entire logic for a modal
// used to add a new student or edit an existing one's details.
export default function StudentFormModal({
    open,
    onClose,
    onSaveSuccess,
    initialData, // If this prop exists, the modal is in "edit" mode.
}) {
    // Determine the mode based on the presence of initialData.
    const mode = initialData ? "edit" : "add";
    const isEditMode = mode === "edit";

    // A function to get a clean, initial state for the form.
    const getInitialFormState = () => ({
        id: "", studentIdCard: "", firstName: "", lastName: "", email: "", username: "",
        phone: "", password: "", confirmPassword: ""
    });

    // === STATE MANAGEMENT ===
    const [formData, setFormData] = useState(getInitialFormState());
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // This effect initializes the form state whenever the modal is opened.
    useEffect(() => {
        if (open) {
            if (isEditMode && initialData) {
                // In edit mode, populate the form with the student's existing data.
                // Passwords are intentionally kept blank for security.
                setFormData({ ...getInitialFormState(), ...initialData });
            } else {
                // In add mode, ensure the form is reset to a clean slate.
                setFormData(getInitialFormState());
            }
            // Reset errors and loading state for a fresh start.
            setErrors({});
            setGeneralError("");
            setIsLoading(false);
        }
    }, [open, initialData, isEditMode]);

    // A generic change handler for the form inputs, memoized for performance.
    const handleFormChange = useCallback((event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear the specific field's error as the user types.
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
        // Clear any general error message on any change.
        setGeneralError("");
    }, [errors]);

    // The core logic for saving or updating a student. This is the heart of the component.
    const handleSave = useCallback(async () => {
        setIsLoading(true);
        setGeneralError("");
        setErrors({});

        // --- Step 1: Asynchronous Validation ---
        // This validation can include database checks (e.g., for unique email/username), so it must be async.
        const validationOptions = { editingId: isEditMode ? initialData?.id : null };
        const validationErrors = await validateStudentForm(formData, validationOptions);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setGeneralError("Please fix the errors in the form."); // Hebrew: "נא לתקן את השגיאות בטופס."
            setIsLoading(false);
            return;
        }

        // --- Step 2: Process Based on Mode (Add vs. Edit) ---
        try {
            if (isEditMode) {
                // --- EDIT LOGIC ---
                const studentId = initialData.id;

                // If a new password was entered, update it in Firebase Authentication first.
                // This is a separate operation from updating the Firestore document.
                if (formData.password?.trim()) {
                    await updateUserAuthPassword(formData.password.trim());
                }
                
                // Prepare data for the Firestore document update.
                // We exclude passwords and other fields that shouldn't be changed or stored directly.
                const { password, confirmPassword, studentIdCard, ...dataToUpdate } = formData;
                await updateDocument("students", studentId, dataToUpdate);

            } else {
                // --- ADD LOGIC ---
                // The `signUpUser` service is an abstraction that handles both creating the user
                // in Firebase Authentication and creating their corresponding document in the Firestore 'students' collection.
                const { confirmPassword, ...dataToSave } = formData;
                await signUpUser(dataToSave);
            }

            // --- Step 3: Success ---
            // If the operations above succeed, notify the parent and close the modal.
            onSaveSuccess?.();
            onClose?.();

        } catch (error) {
            // --- Error Handling ---
            console.error(`[StudentModal:${mode}] Failed:`, error);
            // Translate specific Firebase error codes into user-friendly messages.
            let friendlyMessage = `Error ${isEditMode ? 'updating' : 'adding'} student.`; // Hebrew: "שגיאה ב... הסטודנט"
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = "This email address is already registered."; // Hebrew: "כתובת האימייל הזו כבר רשומה במערכת."
                setErrors({ email: friendlyMessage });
            } else if (error.code === 'auth/weak-password') {
                friendlyMessage = "The password is too weak."; // Hebrew: "הסיסמה חלשה מדי."
                setErrors({ password: friendlyMessage });
            }
            setGeneralError(friendlyMessage);
        } finally {
            // No matter the outcome, stop the loading indicator.
            setIsLoading(false);
        }
    }, [formData, isEditMode, initialData, onClose, onSaveSuccess]);

    return (
        <PopupModal
            open={open}
            onClose={onClose}
            // Title is dynamic based on the mode.
            // Hebrew: "עריכת סטודנט" (Edit Student), "הוספת סטודנט חדש" (Add New Student)
            title={isEditMode ? `Edit Student: ${initialData?.firstName || ''} ${initialData?.lastName || ''}` : "Add New Student"}
        >
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                {generalError && <Alert severity="error">{generalError}</Alert>}
                {/* The "dumb" form component is rendered here. */}
                <StudentForm
                    formData={formData}
                    errors={errors}
                    onChange={handleFormChange}
                    mode={mode}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                    {/* Hebrew: "ביטול" (Cancel) */}
                    <CustomButton variant="outlined" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </CustomButton>
                    {/* Hebrew: "שומר..." (Saving...), "עדכן סטודנט" (Update Student), "שמור סטודנט" (Save Student) */}
                    <CustomButton onClick={handleSave} disabled={isLoading} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}>
                        {isLoading ? "Saving..." : (isEditMode ? "Update Student" : "Save Student")}
                    </CustomButton>
                </Box>
            </Stack>
        </PopupModal>
    );
}