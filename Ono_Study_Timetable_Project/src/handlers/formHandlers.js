// src/handlers/formHandlers.js

import {
    fetchCollection, fetchDocumentById, setDocument, updateDocument, deleteDocument,
    saveSemesterInYear, deleteSemesterFromYear,
    saveRoomInSite, deleteRoomFromSite
} from "../firebase/firestoreService"; // Async Firestore functions
import { validateFormByType } from "../utils/validateForm"; // Async validation dispatcher
import { getPrimaryKeyFieldByRecordType, getEntityKeyByRecordType } from "../utils/formMappings";
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../utils/courseMeetingGenerator"; // Async meeting functions
// Import the function from authService to create Auth user and Firestore profile
import { signUpUser } from "../firebase/authService"; // For creating new students

// matchKeyMap defines the primary key field for each TOP-LEVEL entity collection
const matchKeyMap = {
    students: "id", // Note: For students, 'id' will be the Firebase UID after creation
    courses: "courseCode",
    coursesMeetings: "id", // ID for individual meeting instances
    years: "yearCode",
    lecturers: "id",
    sites: "siteCode",
    holidays: "holidayCode",
    vacations: "vacationCode",
    events: "eventCode",
    tasks: "assignmentCode",
    studentEvents: "eventCode", // Personal events for a student
};

// Helper to determine if the operation is nested (e.g., semester within year)
const isNestedOperation = (entityKey, formData) => {
    return (entityKey === 'years' && formData.semesterCode) || (entityKey === 'sites' && formData.roomCode);
};

// Async helper to fetch necessary existing data for validation context
const getExistingDataForValidation = async (
    parentEntityKeyForContext, // The entityKey of the data being queried (e.g., 'years', 'sites', or the actual entityKey for top-level)
    recordType,                // The specific type being validated (e.g., 'semester', 'room', 'student')
    parentId,                  // ID of the parent, if nested
    editingId,                 // ID of the record being edited (null if adding)
    callerOptions = {}         // Options passed from the calling modal/handler
) => {
    console.log(`[Handler:ValidationData] Fetching for: entityKeyCtx=${parentEntityKeyForContext}, type=${recordType}, parentId=${parentId}, editingId=${editingId}`);
    const validationExtra = {
        editingId: editingId,
        options: callerOptions.options || {}, // Pass through any specific options for validateStudentForm etc.
        recordType: recordType // Pass recordType for clarity in validateFormByType
    };

    try {
        if (recordType === 'semester' && parentId) {
            const parentYear = await fetchDocumentById('years', parentId);
            validationExtra.parentRecord = parentYear; // For date range checks etc.
            validationExtra.existingSemesters = (parentYear?.semesters || []).filter(s => s.semesterCode !== editingId);
        } else if (recordType === 'room' && parentId) {
            const parentSite = await fetchDocumentById('sites', parentId);
            validationExtra.parentRecord = parentSite;
            validationExtra.existingRooms = (parentSite?.rooms || []).filter(r => r.roomCode !== editingId);
        } else if (matchKeyMap[parentEntityKeyForContext] && !callerOptions.skipFetchingExistingList) {
            // For top-level entities, validateXForm functions now perform their own Firestore queries for uniqueness.
            // So, we don't necessarily need to fetch the entire collection here anymore UNLESS
            // validateFormByType or a generic validation step needs it.
            // For now, we'll assume specific validation functions handle their own data needs.
            // If you had a generic isDuplicate that needed the array, you'd fetch it here:
            // const allRecords = await fetchCollection(parentEntityKeyForContext);
            // const pkField = matchKeyMap[parentEntityKeyForContext];
            // validationExtra[`existing${parentEntityKeyForContext.charAt(0).toUpperCase() + parentEntityKeyForContext.slice(1)}`] = allRecords.filter(item => item[pkField] !== editingId);
             console.log(`[Handler:ValidationData] For top-level ${parentEntityKeyForContext}, uniqueness checks are within specific validation functions.`);
        }
    } catch (error) {
        console.error(`[Handler:ValidationData] Error fetching data for validation (${parentEntityKeyForContext}/${recordType}):`, error);
        // Return minimal context on error, validation might still catch missing parentRecord etc.
    }
    console.log(`[Handler:ValidationData] Prepared validationExtra with keys:`, Object.keys(validationExtra));
    return validationExtra;
};


// --- Main Save/Update Handler - ASYNC & Firestore-ready ---
export const handleSaveOrUpdateRecord = async (
    entityKey,          // Logical storage key for the operation (e.g., "students", "years" for semester)
    formData,           // Data from the form
    actionType,         // "add" or "edit"
    validationExtraFromCaller = {}, // Context from caller (e.g., editingId, recordType hint, options)
    skipInternalValidation = false // Flag from caller to bypass validation in this handler
) => {
    const recordTypeHint = validationExtraFromCaller.recordType; // Get logical type if passed
    console.log(`[Handler:SaveUpdate] Start: entityKey=${entityKey}, actionType=${actionType}, typeHint=${recordTypeHint}, skipVal=${skipInternalValidation}`);

    try {
        // --- 1. Determine Operation Specifics (recordType, isNested, keys) ---
        let recordType = null; let isNestedOp = false;
        let parentCollectionKey = null; // Firestore collection for the parent (if nested) or the entity itself
        let parentDocIdField = null;   // PK field name of the parent (e.g., 'yearCode')
        let parentDocIdValue = null;   // Actual ID value of the parent
        let nestedItemKeyField = null; // PK field name of the nested item (e.g., 'semesterCode')
        let itemPrimaryKeyField = null; // PK field name of the item being saved/updated

        if (entityKey === 'years' && formData.semesterCode) { // Saving a Semester
            isNestedOp = true; recordType = 'semester'; parentCollectionKey = 'years';
            parentDocIdField = 'yearCode'; parentDocIdValue = formData.yearCode;
            nestedItemKeyField = getPrimaryKeyFieldByRecordType('semester'); // 'semesterCode'
            itemPrimaryKeyField = nestedItemKeyField;
        } else if (entityKey === 'sites' && formData.roomCode) { // Saving a Room
             isNestedOp = true; recordType = 'room'; parentCollectionKey = 'sites';
             parentDocIdField = 'siteCode'; parentDocIdValue = formData.siteCode;
             nestedItemKeyField = getPrimaryKeyFieldByRecordType('room'); // 'roomCode'
             itemPrimaryKeyField = nestedItemKeyField;
        } else if (matchKeyMap[entityKey]) { // Top-level entity
            isNestedOp = false; parentCollectionKey = entityKey;
            recordType = recordTypeHint || (entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey);
            itemPrimaryKeyField = matchKeyMap[entityKey];
        } else { throw new Error(`Config error: Unknown entityKey '${entityKey}'.`); }

        if (!itemPrimaryKeyField) throw new Error(`Config error: Primary key not found for ${recordType}.`);
        if (!recordType) throw new Error(`Config error: Could not determine record type for ${entityKey}.`);

        console.log(`[Handler:SaveUpdate] IsNested: ${isNestedOp}, RecordType: ${recordType}, ItemPK: ${itemPrimaryKeyField}`);

        // --- 2. Perform Validation (if not skipped by caller) ---
        if (!skipInternalValidation) {
            console.log(`[Handler:SaveUpdate] Running internal validation for ${recordType}...`);
            const editingId = validationExtraFromCaller.editingId || (actionType === 'edit' ? formData[itemPrimaryKeyField] : null);
            const finalValidationExtra = await getExistingDataForValidation(parentCollectionKey, recordType, parentDocIdValue, editingId, validationExtraFromCaller);

            const validationErrors = await validateFormByType(recordType, formData, finalValidationExtra); // Async validation
            if (Object.keys(validationErrors).length > 0 && !validationErrors._validationError) { // Check for actual field errors
                const error = new Error("Validation failed. Please check the form fields.");
                error.validationErrors = validationErrors; throw error;
            } else if (validationErrors._validationError){ // Generic validation error
                 throw new Error(validationErrors._validationError);
            }
            console.log(`[Handler:SaveUpdate] Internal validation passed.`);
        } else { console.log(`[Handler:SaveUpdate] Internal validation skipped by caller.`); }

        // --- 3. Prepare Data (cleaning, no hashing here for students) ---
        let preparedData = { ...formData }; // Use the data passed (caller should have removed confirmPassword)
        const recordId = preparedData[itemPrimaryKeyField]; // ID of the item being saved/updated

        // Special handling for adding a NEW student (Auth + Firestore profile)
        if (entityKey === "students" && actionType === "add") {
            console.log("[Handler:SaveUpdate] Adding NEW student via signUpUser service...");
            if (!preparedData.email || !preparedData.password) throw new Error("Email and password required for new student.");
            // `signUpUser` handles Auth creation AND Firestore profile creation
            // It expects all necessary profile fields: email, password, firstName, lastName, username, studentIdCard, etc.
            // The 'id' field from formData is assumed to be studentIdCard.
            const { id: studentIdCardFromForm, password, ...otherProfileData } = preparedData;
            await signUpUser(
                otherProfileData.email, password, otherProfileData.firstName, otherProfileData.lastName,
                otherProfileData.username, studentIdCardFromForm, otherProfileData.phone,
                otherProfileData.courseCodes, otherProfileData.eventCodes
            );
            return { success: true, message: `Student ${otherProfileData.username} created successfully.` };
        }

        // --- 4. Perform Firestore Save/Update Operation ---
        let finalMessage = `Successfully ${actionType}d ${recordType}.`;
        if (isNestedOp) {
            if (!parentDocIdValue) throw new Error(`Parent ID (${parentDocIdField}) missing for nested ${recordType}.`);
            let nestedItemData = { ...preparedData };
            if (recordType === 'room') nestedItemData = { roomCode: recordId, roomName: preparedData.roomName || "", notes: preparedData.notes || "" };
            else if (recordType === 'semester') nestedItemData = { semesterCode: recordId, semesterNumber: preparedData.semesterNumber || "", startDate: preparedData.startDate, endDate: preparedData.endDate, yearCode: parentDocIdValue };

            if (recordType === 'semester') await saveSemesterInYear(parentDocIdValue, nestedItemData);
            else if (recordType === 'room') await saveRoomInSite(parentDocIdValue, nestedItemData);
            else throw new Error(`Nested save for ${recordType} not implemented.`);
        } else { // Standard top-level entity (or editing an existing student's Firestore profile)
            if (!recordId) throw new Error(`Primary key '${itemPrimaryKeyField}' missing in data.`);
            if (actionType === "add") { // For non-student entities
                await setDocument(parentCollectionKey, String(recordId), preparedData);
            } else if (actionType === "edit") {
                const dataToUpdate = { ...preparedData };
                // For students, password changes are handled by authService, not here.
                // Ensure plain password is not saved to profile if it somehow slipped through.
                if (entityKey === "students") delete dataToUpdate.password;
                delete dataToUpdate[itemPrimaryKeyField]; // Don't send the ID field itself in an update operation
                await updateDocument(parentCollectionKey, String(recordId), dataToUpdate);
            } else { throw new Error(`Invalid action type '${actionType}'.`); }
        }

        // --- 5. Post-Save Actions (e.g., Regenerate Meetings for Courses) ---
        if (entityKey === 'courses' && (actionType === 'add' || actionType === 'edit')) {
             console.log(`[Handler:SaveUpdate] Course definition ${actionType}d. Regenerating meetings for ${recordId}...`);
             const regenSuccess = await regenerateMeetingsForCourse(String(recordId)); // Now async
             if (!regenSuccess) finalMessage += " (Warning: meeting regeneration failed)";
        }

        // --- 6. Return Success ---
        console.log(`[Handler:SaveUpdate] Operation successful: ${finalMessage}`);
        return { success: true, message: finalMessage };

    } catch (error) { // Catch errors from validation, Firestore ops, etc.
        console.error(`[Handler:SaveUpdate] CRITICAL ERROR for ${entityKey} (${actionType}):`, error);
        return { success: false, errors: error.validationErrors || null, message: error.message || `Unexpected error.` };
    }
};


// --- Delete Handler - ASYNC & Firestore-ready ---
export const handleDeleteEntityFormSubmit = async (
    entityKey, recordIdentifier, onSuccess, onError, parentIdentifier = null
) => {
    console.log(`[Handler:Delete] Start: entityKey=${entityKey}, recordId=${recordIdentifier}, parentId=${parentIdentifier}`);
    try {
        let recordType, isNestedOp = !!parentIdentifier, parentCollectionKey, itemKeyField;

        if (isNestedOp && entityKey === 'years') {
            recordType = 'semester'; parentCollectionKey = 'years'; itemKeyField = getPrimaryKeyFieldByRecordType('semester');
        } else if (isNestedOp && entityKey === 'sites') {
            recordType = 'room'; parentCollectionKey = 'sites'; itemKeyField = getPrimaryKeyFieldByRecordType('room');
        } else if (matchKeyMap[entityKey]) {
            isNestedOp = false; parentCollectionKey = entityKey;
            recordType = entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey; itemKeyField = matchKeyMap[entityKey];
        } else { throw new Error(`Config error: Unknown entity key '${entityKey}'.`); }
        if (!itemKeyField) throw new Error(`Config error: PK for '${recordType || entityKey}'.`);
        if (!recordIdentifier) throw new Error(`Data error: No ID for deletion.`);

        let finalMessage = `Successfully deleted ${recordType}.`;
        if (isNestedOp) {
            if (!parentIdentifier) throw new Error(`Parent ID required for nested delete.`);
            if (recordType === 'semester') await deleteSemesterFromYear(parentIdentifier, String(recordIdentifier));
            else if (recordType === 'room') await deleteRoomFromSite(parentIdentifier, String(recordIdentifier));
            else throw new Error(`Nested delete for ${recordType} not implemented.`);
        } else {
            // Special handling for deleting a student: also delete their Auth account
            if (parentCollectionKey === 'students') {
                // IMPORTANT: Deleting Firebase Auth user by UID needs to be handled carefully.
                // This might require admin privileges or re-authentication.
                // For now, we only delete the Firestore document.
                // To delete Auth user, you'd call a function in authService.js
                // that uses Firebase Admin SDK (server-side) or re-authenticates (client-side).
                console.warn(`[Handler:Delete] Deleting student Firestore profile ${recordIdentifier}. Corresponding Auth user NOT deleted by this handler.`);
                await deleteDocument(parentCollectionKey, String(recordIdentifier));
            } else {
                 await deleteDocument(parentCollectionKey, String(recordIdentifier));
            }
        }

        if (entityKey === 'courses') {
             console.log(`[Handler:Delete] Course def deleted. Deleting meetings for ${recordIdentifier}...`);
             const meetingsDeleted = await deleteMeetingsForCourse(String(recordIdentifier)); // Now async
             if (!meetingsDeleted) finalMessage += " (Warning: meeting deletion failed)";
        }
        onSuccess(finalMessage);
    } catch (error) {
        console.error(`[Handler:Delete] CRITICAL ERROR for ${entityKey} (ID: ${recordIdentifier}):`, error);
        onError(error.message || `Unexpected error.`);
    }
};