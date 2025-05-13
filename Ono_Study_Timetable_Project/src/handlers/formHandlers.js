// src/handlers/formHandlers.js

import {
    fetchCollection, fetchDocumentById, setDocument, updateDocument, deleteDocument,
    saveSemesterInYear, deleteSemesterFromYear,
    saveRoomInSite, deleteRoomFromSite
} from "../firebase/firestoreService";
import { validateFormByType } from "../utils/validateForm"; // Async
import { getPrimaryKeyFieldByRecordType, getEntityKeyByRecordType } from "../utils/formMappings";
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../utils/courseMeetingGenerator"; // Async
// ✅ Import the function to create Auth user and Firestore profile
import { signUpUser } from "../firebase/authService"; // Assuming this creates Auth user & Firestore profile

// matchKeyMap (for top-level entity PKs)
const matchKeyMap = {
    students: "id", courses: "courseCode", coursesMeetings: "id",
    years: "yearCode", lecturers: "id", sites: "siteCode",
    holidays: "holidayCode", vacations: "vacationCode", events: "eventCode",
    tasks: "assignmentCode", studentEvents: "eventCode",
};

// Async helper for validation context (as defined in #71 and confirmed in #77)
const getExistingDataForValidation = async (entityKey, recordType, parentId = null, editingId = null, options = {}) => { /* ... implementation from response #77 ... */ };
const isNestedOperation = (entityKey, formData) => { /* ... implementation from response #77 ... */ };


export const handleSaveOrUpdateRecord = async (
    entityKey, formData, actionType,
    validationExtraFromCaller = {}, skipInternalValidation = false
) => {
    const recordTypeHint = validationExtraFromCaller.recordType;
    console.log(`[Handler:SaveUpdate] Start: entityKey=${entityKey}, actionType=${actionType}, recordTypeHint=${recordTypeHint}, skipVal=${skipInternalValidation}`);
    try {
        let recordType, isNested = false, parentEntityKey, parentKeyField, parentId, nestedKeyField, primaryKeyField;

        if (entityKey === 'years' && formData.semesterCode) {
            isNested = true; recordType = 'semester'; parentEntityKey = 'years'; parentKeyField = 'yearCode'; parentId = formData.yearCode;
            nestedKeyField = getPrimaryKeyFieldByRecordType('semester'); primaryKeyField = nestedKeyField;
        } else if (entityKey === 'sites' && formData.roomCode) {
             isNested = true; recordType = 'room'; parentEntityKey = 'sites'; parentKeyField = 'siteCode'; parentId = formData.siteCode;
             nestedKeyField = getPrimaryKeyFieldByRecordType('room'); primaryKeyField = nestedKeyField;
        } else if (matchKeyMap[entityKey]) {
            isNested = false; parentEntityKey = entityKey;
            recordType = recordTypeHint || (entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey);
            primaryKeyField = matchKeyMap[entityKey];
        } else { throw new Error(`Config error: Unknown entityKey '${entityKey}'.`); }
        if (!primaryKeyField || !recordType) throw new Error(`Config error: PK or recordType for ${entityKey}.`);

        console.log(`[Handler:SaveUpdate] IsNested: ${isNested}, RecordType: ${recordType}, PK: ${primaryKeyField}`);

        if (!skipInternalValidation) {
            const editingId = validationExtraFromCaller.editingId || (actionType === 'edit' ? formData[primaryKeyField] : null);
            const finalValidationExtra = await getExistingDataForValidation(parentEntityKey, recordType, parentId, editingId, validationExtraFromCaller);
            const validationErrors = await validateFormByType(recordType, formData, finalValidationExtra);
            if (Object.keys(validationErrors).length > 0) {
                const error = new Error("Validation failed."); error.validationErrors = validationErrors; throw error;
            }
            console.log(`[Handler:SaveUpdate] Validation passed.`);
        } else { console.log(`[Handler:SaveUpdate] Internal validation skipped.`); }

        let preparedData = { ...formData }; // Data from form
        let operationSuccess = false;
        let finalMessage = `Successfully ${actionType}d ${recordType}.`;
        const recordId = preparedData[primaryKeyField]; // ID of the item being saved/updated

        // --- ✅ Special Handling for Adding a NEW Student ---
        if (entityKey === "students" && actionType === "add") {
            console.log("[Handler:SaveUpdate] Adding new student. Will create Auth user and Firestore profile.");
            if (!preparedData.email || !preparedData.password) {
                throw new Error("Email and password are required to create a new student user.");
            }
            // The ID field from the form is now studentIdCard.
            // signUpUser will create an Auth user, get the UID, then create the Firestore doc with that UID as doc ID.
            // It expects all necessary profile fields (firstName, lastName, username, id from form for studentIdCard).
            const { id: studentIdCardFromForm, email, password, firstName, lastName, username, phone, courseCodes, eventCodes } = preparedData;
            // Call signUpUser which handles Auth creation and Firestore profile creation
            await signUpUser(email, password, firstName, lastName, username, studentIdCardFromForm, phone, courseCodes, eventCodes);
            operationSuccess = true; // Assuming signUpUser throws on failure
            finalMessage = `Student ${username} created successfully (Auth & Firestore).`;
        }
        // --- Handling for EDITS (including students) and ADDING other entities ---
        else if (isNested) {
            if (!parentId) throw new Error(`Parent ID missing for nested ${recordType}.`);
            let nestedItemData = { ...preparedData };
            if (recordType === 'room') nestedItemData = { roomCode: recordId, roomName: preparedData.roomName || "", notes: preparedData.notes || "" };
            else if (recordType === 'semester') nestedItemData = { semesterCode: recordId, semesterNumber: preparedData.semesterNumber || "", startDate: preparedData.startDate, endDate: preparedData.endDate, yearCode: parentId };

            if (recordType === 'semester') await saveSemesterInYear(parentId, nestedItemData);
            else if (recordType === 'room') await saveRoomInSite(parentId, nestedItemData);
            else throw new Error(`Nested save for ${recordType} not implemented.`);
            operationSuccess = true;
        } else { // Standard top-level entity (or student edit)
            if (!recordId) throw new Error(`PK '${primaryKeyField}' missing in data.`);
            if (actionType === "add") { // For adding non-student entities
                await setDocument(parentEntityKey, String(recordId), preparedData);
                operationSuccess = true;
            } else if (actionType === "edit") {
                const dataToUpdate = { ...preparedData };
                // For students, never update password directly here. Password changes via authService.
                if (entityKey === "students") delete dataToUpdate.password;
                delete dataToUpdate[primaryKeyField]; // Don't update the ID field itself via updateDoc
                await updateDocument(parentEntityKey, String(recordId), dataToUpdate);
                operationSuccess = true;
            } else { throw new Error(`Invalid action type '${actionType}'.`); }
        }

        if (operationSuccess && entityKey === 'courses' && (actionType === 'add' || actionType === 'edit')) {
             console.log(`[Handler:SaveUpdate] Course definition ${actionType}. Triggering meeting regen for ${recordId}...`);
             const regenSuccess = await regenerateMeetingsForCourse(String(recordId));
             if (!regenSuccess) finalMessage += " (Warning: meeting regeneration failed)";
        }

        return { success: true, message: finalMessage };
    } catch (error) {
        console.error(`[Handler:SaveUpdate] CRITICAL ERROR for ${entityKey} (${actionType}):`, error);
        return { success: false, errors: error.validationErrors || null, message: error.message || `Unexpected error.` };
    }
};

// Delete handler (remains largely the same, as it doesn't create Auth users)
export const handleDeleteEntityFormSubmit = async (
    entityKey, recordIdentifier, onSuccess, onError, parentIdentifier = null
) => {
    // ... (Implementation from response #77 is fine here) ...
    // It correctly uses Firestore service functions for deletion.
    // Ensure it uses async/await for courseMeetingGenerator functions.
    console.log(`[Handler:Delete] Start: entityKey=${entityKey}, recordId=${recordIdentifier}, parentId=${parentIdentifier}`);
    try {
        let recordType, isNested = !!parentIdentifier, parentEntityKey, parentKeyField, itemKeyField;

        if (isNested && entityKey === 'years') { /* ... */ }
        else if (isNested && entityKey === 'sites') { /* ... */ }
        else if (matchKeyMap[entityKey]) { /* ... */ }
        else { throw new Error(`Config error: Unknown entity key '${entityKey}'.`); }
        if (!itemKeyField) throw new Error(`Config error: PK field not found for '${recordType || entityKey}'.`);
        if (!recordIdentifier) throw new Error(`Data error: No ID for deletion.`);

        let finalMessage = `Successfully deleted ${recordType}.`;
        if (isNested) { /* ... call deleteSemesterFromYear or deleteRoomFromSite ... */ }
        else { await deleteDocument(parentEntityKey, String(recordIdentifier)); }

        if (entityKey === 'courses') {
             const meetingsDeleted = await deleteMeetingsForCourse(String(recordIdentifier)); // Async
             if (!meetingsDeleted) finalMessage += " (Warning: meeting deletion failed)";
        }
        onSuccess(finalMessage);
    } catch (error) { onError(error.message || `Unexpected error.`); }
};