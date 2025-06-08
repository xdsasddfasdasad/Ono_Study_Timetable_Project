// src/handlers/formHandlers.js

import {
    setDocument, updateDocument, deleteDocument,
    saveSemesterInYear, deleteSemesterFromYear,
    saveRoomInSite, deleteRoomFromSite,
} from "../firebase/firestoreService";
import { validateFormByType } from "../utils/validateForm";
import { formMappings } from "../utils/formMappings";
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../utils/courseMeetingGenerator";
import { signUpUser } from "../firebase/authService";

/**
 * מזהה את סוג הפעולה על בסיס הרמז לסוג הרשומה (recordTypeHint) או מפתח הישות.
 * זהו התיקון המרכזי שפותר את שגיאת השמירה.
 */
const getOperationDetails = (entityKey, formData, recordTypeHint) => {
    // --- FIX: Use the hint first to find the correct mapping ---
    const recordType = recordTypeHint || formMappings[entityKey]?.recordType;
    if (!recordType) {
        throw new Error(`Configuration Error: Could not determine recordType for entityKey '${entityKey}' with hint '${recordTypeHint}'.`);
    }

    const mapping = formMappings[recordType];
    if (!mapping) {
        throw new Error(`Configuration Error: No mapping found for recordType '${recordType}'.`);
    }

    const details = {
        isNested: false,
        recordType: recordType,
        collectionName: mapping.collectionName,
        primaryKeyField: mapping.primaryKey,
        parentInfo: null,
    };
    
    // Nested entity logic
    if (recordType === 'semester') {
        details.isNested = true;
        details.parentInfo = { collectionName: 'years', docId: formData.yearCode, arrayName: 'semesters' };
    } else if (recordType === 'room') {
        details.isNested = true;
        details.parentInfo = { collectionName: 'sites', docId: formData.siteCode, arrayName: 'rooms' };
    }

    return details;
};

export const handleSaveOrUpdateRecord = async (entityKey, formData, mode, options = {}) => {
    const { recordType: recordTypeHint, editingId } = options;
    console.log(`[Handler:Save] Started for entity: ${entityKey}, mode: ${mode}, hint: ${recordTypeHint}`);

    try {
        const opDetails = getOperationDetails(entityKey, formData, recordTypeHint);
        const { recordType, primaryKeyField, collectionName } = opDetails;

        console.log(`[Handler:Save] Details: type=${recordType}, pk=${primaryKeyField}, collection=${collectionName}`);

        const validationErrors = await validateFormByType(recordType, formData, { mode, editingId });
        if (Object.keys(validationErrors).length > 0) {
            throw { validationErrors, message: "Validation failed. Please check the form fields." };
        }
        
        const recordId = formData[primaryKeyField];

        if (recordType === 'student' && mode === 'add') {
            const { email, password, ...profileData } = formData;
            const newUserData = await signUpUser(email, password, profileData);
            return { success: true, message: `Student ${newUserData.profile.username} created successfully.` };
        }

        if (opDetails.isNested) {
            if (recordType === 'semester') await saveSemesterInYear(opDetails.parentInfo.docId, formData);
            else if (recordType === 'room') await saveRoomInSite(opDetails.parentInfo.docId, formData);
        } else {
            if (!recordId) throw new Error(`Primary key '${primaryKeyField}' is missing.`);
            const dataToSave = { ...formData };
            if (mode === 'add') {
                await setDocument(collectionName, recordId, dataToSave);
            } else { // 'edit'
                delete dataToSave[primaryKeyField];
                await updateDocument(collectionName, recordId, dataToSave);
            }
        }
        
        if (recordType === 'course') {
            await regenerateMeetingsForCourse(recordId);
        }

        return { success: true, message: `${recordType} saved successfully.` };

    } catch (error) {
        console.error(`[Handler:Save] CRITICAL ERROR for ${entityKey} (${mode}):`, error);
        return {
            success: false,
            message: error.message || "An unexpected error occurred.",
            errors: error.validationErrors || { form: error.message },
        };
    }
};

export const handleDeleteEntity = async (entityKey, recordId, options = {}) => {
    const { parentDocId, recordType: recordTypeHint } = options;
    console.log(`[Handler:Delete] Started for entity: ${entityKey}, ID: ${recordId}`);

    try {
        const opDetails = getOperationDetails(entityKey, {}, recordTypeHint);
        const { recordType, collectionName } = opDetails;

        if (opDetails.isNested) {
            if (!parentDocId) throw new Error(`Parent ID required for nested delete of ${recordType}.`);
            if (recordType === 'semester') await deleteSemesterFromYear(parentDocId, recordId);
            else if (recordType === 'room') await deleteRoomFromSite(parentDocId, recordId);
        } else {
            if (recordType === 'student') {
                console.warn(`Deleting student Firestore profile ${recordId}. The corresponding Auth user is NOT deleted.`);
            }
            await deleteDocument(collectionName, recordId);
        }

        if (recordType === 'course') {
            await deleteMeetingsForCourse(recordId);
        }
        
        return { success: true, message: `${recordType} deleted successfully.` };

    } catch (error) {
        console.error(`[Handler:Delete] CRITICAL ERROR for ${entityKey} (ID: ${recordId}):`, error);
        return { success: false, message: error.message || "Deletion failed." };
    }
};