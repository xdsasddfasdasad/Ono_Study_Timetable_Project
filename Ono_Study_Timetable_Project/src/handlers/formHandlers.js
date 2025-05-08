// src/handlers/formHandlers.js

// ✅ Import Firestore service functions INSTEAD of storage functions
import {
    fetchCollection, fetchDocumentById, setDocument, updateDocument, deleteDocument,
    saveSemesterInYear, deleteSemesterFromYear, // For nested Semesters
    saveRoomInSite, deleteRoomFromSite          // For nested Rooms
} from "../firebase/firestoreService"; // Adjust path

import { hashPassword } from "../utils/hash";
import { validateFormByType } from "../utils/validateForm";
import { getPrimaryKeyFieldByRecordType, getEntityKeyByRecordType } from "../utils/formMappings"; // Use both mapping helpers
// Import Course Meeting generators IF handlers trigger them
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../utils/courseMeetingGenerator";

// ✅ matchKeyMap primarily maps TOP-LEVEL storage keys to their primary ID field name
const matchKeyMap = {
    students: "id", courses: "courseCode", coursesMeetings: "id",
    years: "yearCode", lecturers: "id", sites: "siteCode",
    holidays: "holidayCode", vacations: "vacationCode", events: "eventCode",
    tasks: "assignmentCode", studentEvents: "eventCode",
};

// Helper to get existing data needed for validation checks (now async)
const getExistingDataForValidation = async (entityKey, recordType, parentId = null, editingId = null) => {
    console.log(`[Handler:ValidationData] Fetching existing data for validation: entityKey=${entityKey}, recordType=${recordType}, parentId=${parentId}, editingId=${editingId}`);
    try {
        let data = [];
        let parentRecord = null;

        // Fetch parent record if dealing with nested types
        if (isNested && parentId) {
             const parentEntityKey = entityKey; // e.g., 'years' or 'sites'
             parentRecord = await fetchDocumentById(parentEntityKey, parentId);
             if (!parentRecord) {
                 console.warn(`[Handler:ValidationData] Parent record ${parentId} not found.`);
                 // Decide handling: maybe throw error or return empty/null parent?
                 // Returning empty array for existingData for now.
             }
        }

        // Get relevant existing data for uniqueness/context checks
        if (recordType === 'semester' && parentRecord) {
            data = parentRecord.semesters || [];
        } else if (recordType === 'room' && parentRecord) {
            data = parentRecord.rooms || [];
        } else if (matchKeyMap[entityKey]) { // Check top-level entities
            data = await fetchCollection(entityKey);
        } else {
             console.warn(`[Handler:ValidationData] Could not determine data source for ${entityKey}/${recordType}`);
        }

        // Prepare the 'extra' object for validateFormByType
        const validationExtra = {
             parentRecord: parentRecord, // Pass parent if fetched (for context like date ranges)
             editingId: editingId      // Pass the ID being edited (or null if adding)
        };

         // Add the relevant list for uniqueness checks, excluding the item being edited if applicable
         if (recordType === 'semester') {
             validationExtra.existingSemesters = data.filter(item => item.semesterCode !== editingId);
         } else if (recordType === 'room') {
             validationExtra.existingRooms = data.filter(item => item.roomCode !== editingId);
         } else if (matchKeyMap[entityKey]) {
              const primaryKeyField = matchKeyMap[entityKey];
              const keyName = `existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`;
              validationExtra[keyName] = data.filter(item => item[primaryKeyField] !== editingId);
         }

        console.log(`[Handler:ValidationData] Prepared validationExtra:`, Object.keys(validationExtra));
        return validationExtra;

    } catch (error) {
        console.error(`[Handler:ValidationData] Error fetching data for validation (${entityKey}/${recordType}):`, error);
        // Return minimal context on error to potentially allow other validations
        return { editingId: editingId };
    }
};


// --- Main Save/Update Handler - ASYNC & using Firestore ---
export const handleSaveOrUpdateRecord = async (
    entityKey,          // Logical storage key ('years', 'sites', 'students', etc.)
    formData,           // Data from the modal/caller (should be cleaned, e.g., no confirmPassword)
    actionType,         // 'add' or 'edit'
    validationExtraFromCaller = {}, // Context passed from caller (MAY include editingId, potentially existing data)
    skipInternalValidation = false // Flag from caller to bypass validation here
) => {
    const recordTypeHint = validationExtraFromCaller.recordType; // Get type hint if passed
    console.log(`[Handler:SaveUpdate] Start: entityKey=${entityKey}, actionType=${actionType}, recordTypeHint=${recordTypeHint}, skipVal=${skipInternalValidation}`);

    try {
        // --- 1. Determine Operation Specifics ---
        let recordType = null; let isNested = false;
        let parentEntityKey = null; let parentKeyField = null; let parentId = null;
        let nestedKeyField = null; let primaryKeyField = null; // PK of the item itself

        // Determine if nested based on entityKey and formData content
        if (entityKey === 'years' && formData.semesterCode) {
            isNested = true; recordType = 'semester'; parentEntityKey = 'years';
            parentKeyField = 'yearCode'; parentId = formData.yearCode;
            nestedKeyField = getPrimaryKeyFieldByRecordType('semester');
            primaryKeyField = nestedKeyField;
        } else if (entityKey === 'sites' && formData.roomCode) {
             isNested = true; recordType = 'room'; parentEntityKey = 'sites';
             parentKeyField = 'siteCode'; parentId = formData.siteCode;
             nestedKeyField = getPrimaryKeyFieldByRecordType('room');
             primaryKeyField = nestedKeyField;
        } else if (matchKeyMap[entityKey]) { // Top-level entity
            isNested = false; parentEntityKey = entityKey;
            recordType = recordTypeHint || (entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey);
            primaryKeyField = matchKeyMap[entityKey];
        } else { throw new Error(`Configuration error: Unknown entity key '${entityKey}'.`); }

        if (!primaryKeyField) throw new Error(`Config error: Primary key not defined for ${recordType}.`);
        if (!recordType) throw new Error(`Config error: Could not determine record type for ${entityKey}.`);

        console.log(`[Handler:SaveUpdate] Determined: recordType=${recordType}, isNested=${isNested}, PK=${primaryKeyField}`);

        // --- 2. Perform Validation (if not skipped) ---
        if (!skipInternalValidation) {
            console.log(`[Handler:SaveUpdate] Running internal validation for ${recordType}...`);
            // Fetch necessary data and build context for validation
            const editingId = validationExtraFromCaller.editingId || (actionType === 'edit' ? formData[primaryKeyField] : null);
            const validationContext = await getExistingDataForValidation(parentEntityKey, recordType, parentId, editingId);
            // Merge with any options passed from the caller
            const finalValidationExtra = { ...validationContext, ...validationExtraFromCaller };

            const validationErrors = validateFormByType(recordType, formData, finalValidationExtra);
            if (Object.keys(validationErrors).length > 0) {
                console.warn(`[Handler:SaveUpdate] Validation failed:`, validationErrors);
                // Make sure the error object is attached for the catch block or return value
                const error = new Error("Validation failed.");
                error.validationErrors = validationErrors; // Attach errors
                throw error; // Throw validation error to be caught
            }
            console.log(`[Handler:SaveUpdate] Validation passed.`);
        } else { console.log(`[Handler:SaveUpdate] Skipping internal validation.`); }

        // --- 3. Prepare Data (Hashing, Cleaning) ---
        let preparedData = { ...formData };
        if (entityKey === "students" && preparedData.password?.length > 0) {
             try {
                 preparedData.password = await hashPassword(preparedData.password);
                 console.log("[Handler:SaveUpdate] Student password hashed.");
             } catch (hashError) { throw new Error(`Password hashing failed: ${hashError.message}`); }
        }

        // --- 4. Perform Firestore Save/Update ---
        let operationSuccess = false;
        let finalMessage = `Successfully ${actionType === 'add' ? 'added' : 'updated'} ${recordType}.`;
        const recordId = preparedData[primaryKeyField]; // ID of the item being saved/updated

        if (isNested) {
             if (!parentId) throw new Error(`Data error: Parent ID (${parentKeyField}) missing for nested ${recordType}.`);
             let nestedItemData = { ...preparedData }; // Data for the nested item
             // Clean nested data: remove parent ID, ensure only relevant fields
             if (recordType === 'room') { nestedItemData = { roomCode: recordId, roomName: preparedData.roomName || "", notes: preparedData.notes || "" }; }
             else if (recordType === 'semester') { nestedItemData = { semesterCode: recordId, semesterNumber: preparedData.semesterNumber || "", startDate: preparedData.startDate, endDate: preparedData.endDate }; }

             if (recordType === 'semester') { await saveSemesterInYear(parentId, nestedItemData); }
             else if (recordType === 'room') { await saveRoomInSite(parentId, nestedItemData); }
             else { throw new Error(`Nested save for ${recordType} not implemented.`); }
             operationSuccess = true;

        } else { // Standard top-level entity
             if (!recordId) throw new Error(`Data error: Primary key '${primaryKeyField}' missing.`);
             if (actionType === "add") {
                  // Use setDoc with the provided ID (e.g., student id, course code)
                  await setDocument(parentEntityKey, recordId, preparedData);
                  operationSuccess = true;
             } else if (actionType === "edit") {
                  // Use updateDoc, remove ID field from payload
                  const dataToUpdate = { ...preparedData };
                  delete dataToUpdate[primaryKeyField];
                  await updateDocument(parentEntityKey, recordId, dataToUpdate);
                  operationSuccess = true;
             } else { throw new Error(`Invalid action type '${actionType}'.`); }
        }

        // --- 5. Post-Save Actions (Regenerate Meetings for Courses) ---
        if (operationSuccess && entityKey === 'courses') {
             console.log(`[Handler:SaveUpdate] Course def saved. Triggering meeting regen for ${recordId}...`);
             // Assuming regenerate is async now
             const regenSuccess = await regenerateMeetingsForCourse(recordId);
             if (!regenSuccess) {
                  console.warn(`[Handler:SaveUpdate] Meeting regeneration failed for ${recordId}.`);
                  finalMessage += " (Warning: meeting regeneration failed)";
             }
        }

        // --- 6. Return Success Result ---
        console.log(`[Handler:SaveUpdate] Result: success=${operationSuccess}, message=${finalMessage}`);
        return { success: true, message: finalMessage }; // Errors were thrown if success=false

    } catch (error) { // Catch all errors (config, validation, hashing, firestore)
        console.error(`[Handler:SaveUpdate] CRITICAL ERROR for ${entityKey} (${actionType}):`, error);
        return {
            success: false,
            // Pass back validation errors specifically if they were attached
            errors: error.validationErrors || null,
            message: error.message || `Unexpected error during ${actionType}.`
        };
    }
}; // End handleSaveOrUpdateRecord


// --- Delete Handler - ASYNC & using Firestore ---
export const handleDeleteEntityFormSubmit = async ( // Changed to async
    entityKey,
    recordIdentifier,
    onSuccess, // Keep callbacks for now, or change to return Promise<boolean>
    onError,
    parentIdentifier = null
) => {
    console.log(`[Handler:Delete] Start: entityKey=${entityKey}, recordId=${recordIdentifier}, parentId=${parentIdentifier}`);
    try {
        let recordType = null; let isNested = !!parentIdentifier;
        let parentEntityKey = null; let parentKeyField = null; let nestedArrayField = null; let itemKeyField = null;

        // --- 1. Determine Type and Keys ---
        if (isNested && entityKey === 'years') {
            recordType = 'semester'; parentEntityKey = 'years'; parentKeyField = 'yearCode';
            nestedArrayField = 'semesters'; itemKeyField = getPrimaryKeyFieldByRecordType('semester');
        } else if (isNested && entityKey === 'sites') {
             recordType = 'room'; parentEntityKey = 'sites'; parentKeyField = 'siteCode';
             nestedArrayField = 'rooms'; itemKeyField = getPrimaryKeyFieldByRecordType('room');
        } else if (matchKeyMap[entityKey]) {
            isNested = false; parentEntityKey = entityKey;
            recordType = entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey;
            itemKeyField = matchKeyMap[entityKey];
        } else { throw new Error(`Config error: Unknown entity key '${entityKey}'.`); }

        if (!itemKeyField) throw new Error(`Config error: Primary key not found for '${recordType || entityKey}'.`);
        if (!recordIdentifier) throw new Error(`Data error: No ID provided for deletion.`);
        console.log(`[Handler:Delete] Determined: recordType=${recordType}, isNested=${isNested}, PK=${itemKeyField}`);

        // --- 2. Perform Firestore Delete ---
        let finalMessage = `Successfully deleted ${recordType}.`;
        if (isNested) {
             if (!parentIdentifier) throw new Error(`Data error: Parent ID required for nested delete.`);
             if (recordType === 'semester') { await deleteSemesterFromYear(parentIdentifier, recordIdentifier); }
             else if (recordType === 'room') { await deleteRoomFromSite(parentIdentifier, recordIdentifier); }
             else { throw new Error(`Nested delete for ${recordType} not implemented.`); }
        } else { // Standard delete
             await deleteDocument(parentEntityKey, recordIdentifier);
        }

         // --- 3. Post-Delete Actions (Delete Course Meetings) ---
         if (entityKey === 'courses') {
              console.log(`[Handler:Delete] Course def deleted. Deleting meetings for ${recordIdentifier}...`);
              // Assuming deleteMeetings is async now
              const meetingsDeleted = await deleteMeetingsForCourse(recordIdentifier);
              if (!meetingsDeleted) {
                   console.warn(`[Handler:Delete] Meetings deletion failed for ${recordIdentifier}.`);
                   finalMessage += " (Warning: meeting deletion failed)";
              }
         }

        // --- 4. Call Success Callback ---
        console.log(`[Handler:Delete] Success: ${finalMessage}`);
        onSuccess(finalMessage);

    } catch (error) { // Catch all errors
        console.error(`[Handler:Delete] CRITICAL ERROR for ${entityKey} (ID: ${recordIdentifier}):`, error);
        onError(error.message || `Unexpected error during delete.`);
    }
}; // End handleDeleteEntityFormSubmit