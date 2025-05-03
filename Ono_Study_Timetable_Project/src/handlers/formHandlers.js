// src/handlers/formHandlers.js

import { getRecords, saveRecords } from "../utils/storage";
import { hashPassword } from "../utils/hash";
import { validateFormByType } from "../utils/validateForm";
// Import helper to get primary key field names consistently
import { getPrimaryKeyFieldByRecordType } from "../utils/formMappings";

// Map from ENTITY KEY (storage key) to its primary ID field name
// This is the primary source of truth for ID fields for TOP-LEVEL entities.
const matchKeyMap = {
    students: "id",
    courses: "courseCode",        // Course Definitions
    coursesMeetings: "id",        // Specific Meeting Instances
    years: "yearCode",
    lecturers: "id",
    sites: "siteCode",
    // 'rooms' is not a direct key, handled via 'sites'
    holidays: "holidayCode",
    vacations: "vacationCode",
    events: "eventCode",          // General Events
    tasks: "assignmentCode",
    studentEvents: "eventCode",   // Student Personal Events
};

// --- Helper function to Add/Update item within a nested array ---
// parentArray: The array of parent objects (e.g., all years, all sites)
// parentKeyField: The key field of the parent object (e.g., 'yearCode', 'siteCode')
// parentId: The specific ID of the parent being modified
// nestedArrayField: The name of the array field within the parent (e.g., 'semesters', 'rooms')
// nestedItem: The item (semester, room) to add or update
// nestedKeyField: The key field of the nested item (e.g., 'semesterCode', 'roomCode')
// actionType: 'add' or 'edit'
// Returns: true if added/updated successfully, false otherwise
const updateNestedArray = (parentArray, parentKeyField, parentId, nestedArrayField, nestedItem, nestedKeyField, actionType) => {
    const parentIndex = parentArray.findIndex(p => p[parentKeyField] === parentId);
    if (parentIndex === -1) {
        console.error(`[Handler:updateNested] Parent ${parentKeyField}=${parentId} not found.`);
        return false; // Parent not found
    }

    // Ensure the nested array exists on the parent object
    if (!Array.isArray(parentArray[parentIndex][nestedArrayField])) {
        parentArray[parentIndex][nestedArrayField] = [];
        console.log(`[Handler:updateNested] Initialized ${nestedArrayField} array for parent ${parentId}.`);
    }

    const nestedArray = parentArray[parentIndex][nestedArrayField];
    const nestedItemId = nestedItem[nestedKeyField]; // Get the ID of the item being added/edited

    if (!nestedItemId) {
         console.error(`[Handler:updateNested] Nested item is missing its key field '${nestedKeyField}'. Cannot proceed.`);
         return false; // Missing ID on the item itself
    }


    const existingNestedIndex = nestedArray.findIndex(n => n[nestedKeyField] === nestedItemId);

    if (actionType === 'add') {
        if (existingNestedIndex !== -1) {
            console.warn(`[Handler:updateNested] Cannot add duplicate: Nested item ${nestedKeyField}=${nestedItemId} already exists in parent ${parentId}.`);
            return false; // Already exists
        }
        nestedArray.push(nestedItem); // Add the new item
        console.log(`[Handler:updateNested] Added nested item ${nestedItemId} to parent ${parentId}.`);
        return true; // Successfully added
    } else if (actionType === 'edit') {
        if (existingNestedIndex === -1) {
            console.error(`[Handler:updateNested] Cannot edit: Nested item ${nestedKeyField}=${nestedItemId} not found in parent ${parentId}.`);
            return false; // Not found for editing
        }
        // Update the item in place by merging (preserving other potential fields)
        nestedArray[existingNestedIndex] = { ...nestedArray[existingNestedIndex], ...nestedItem };
        console.log(`[Handler:updateNested] Updated nested item ${nestedItemId} in parent ${parentId}.`);
        return true; // Successfully updated
    }

    console.error(`[Handler:updateNested] Invalid actionType: ${actionType}`);
    return false; // Invalid action type
};


// --- Main Save/Update Handler ---
export const handleSaveOrUpdateRecord = async (
    entityKey,          // The storage key (e.g., "years", "courses", "sites")
    formData,           // Data from the form being submitted
    actionType,         // "add" or "edit"
    validationExtra = {} // Extra context for validation (e.g., existing records, editingId, parentRecord)
) => {
    console.log(`[Handler:SaveUpdate] Start: entityKey=${entityKey}, actionType=${actionType}`);
    // console.log("[Handler:SaveUpdate] formData:", formData);
    // console.log("[Handler:SaveUpdate] validationExtra:", validationExtra);

    try {
        let recordType = null;        // The logical type (e.g., 'semester', 'room', 'year')
        let isNested = false;
        let parentEntityKey = null;   // Storage key of the parent ('years', 'sites')
        let parentKeyField = null;    // Key field of the parent ('yearCode', 'siteCode')
        let parentId = null;          // ID of the specific parent record
        let nestedArrayField = null;  // Array field in parent ('semesters', 'rooms')
        let nestedKeyField = null;    // Key field of the nested item ('semesterCode', 'roomCode')

        // --- 1. Identify Operation Type (Nested vs. Standard) ---
        if (entityKey === 'years' && formData.semesterCode) {
            isNested = true; recordType = 'semester'; parentEntityKey = 'years';
            parentKeyField = 'yearCode'; parentId = formData.yearCode;
            nestedArrayField = 'semesters'; nestedKeyField = getPrimaryKeyFieldByRecordType('semester'); // 'semesterCode'
            if (!nestedKeyField) throw new Error("Config error: Missing primary key for 'semester'.");
        } else if (entityKey === 'sites' && formData.roomCode) {
             isNested = true; recordType = 'room'; parentEntityKey = 'sites';
             parentKeyField = 'siteCode'; parentId = formData.siteCode;
             nestedArrayField = 'rooms'; nestedKeyField = getPrimaryKeyFieldByRecordType('room'); // 'roomCode'
             if (!nestedKeyField) throw new Error("Config error: Missing primary key for 'room'.");
             // Note: Updating the flat 'rooms' list is NOT handled here.
        } else if (matchKeyMap[entityKey]) {
            // Standard top-level entity
            isNested = false; parentEntityKey = entityKey; // Parent is the entity itself
            // Infer recordType (remove trailing 's' if exists)
            recordType = entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey;
            // Allow override from validationExtra if provided (more explicit)
            recordType = validationExtra.recordType || recordType;
        } else {
             throw new Error(`Configuration error: Unknown entity key '${entityKey}'.`);
        }
        console.log(`[Handler:SaveUpdate] Determined recordType: ${recordType}, isNested: ${isNested}`);

        // --- 2. Perform Validation ---
        const validationErrors = validateFormByType(recordType, formData, validationExtra);
        if (Object.keys(validationErrors).length > 0) {
            console.warn(`[Handler:SaveUpdate] Validation failed for ${recordType}:`, validationErrors);
            return { success: false, errors: validationErrors, message: "Validation failed. Please check the fields." };
        }
        console.log(`[Handler:SaveUpdate] Validation passed for ${recordType}.`);

        // --- 3. Prepare Data for Saving ---
        let preparedData = { ...formData };
        // Hash student password if adding or password provided during edit
        if (entityKey === "students") {
            if (actionType === 'add' || (actionType === 'edit' && preparedData.password?.length > 0)) {
                 try {
                     preparedData.password = await hashPassword(preparedData.password);
                     delete preparedData.confirmPassword;
                     console.log("[Handler:SaveUpdate] Student password hashed.");
                 } catch (hashError) { throw new Error(`Password hashing failed: ${hashError.message}`); }
            } else {
                // Remove password fields if not provided during edit to avoid overwriting with empty/null
                delete preparedData.password;
                delete preparedData.confirmPassword;
            }
        }
        // Cleanup nested data if needed (remove parent IDs from nested objects, etc.)
        let nestedItemData = null;
        if (isNested) {
            nestedItemData = { ...preparedData };
            if (recordType === 'room') { // Only save room-specific fields in the nested array
                nestedItemData = {
                     roomCode: preparedData.roomCode,
                     roomName: preparedData.roomName,
                     notes: preparedData.notes || ""
                     // Add other relevant room fields here
                };
            } else if (recordType === 'semester') { // Only save semester-specific fields
                 // Example: If yearCode shouldn't be duplicated inside the semester object
                 // delete nestedItemData.yearCode;
            }
        }

        // --- 4. Perform Save/Update Operation ---
        let operationSuccess = false;
        let finalMessage = "Operation completed successfully.";

        if (isNested) {
            // --- Nested Add/Update ---
            if (!parentId) throw new Error(`Parent ID (${parentKeyField}) is missing for nested ${recordType}.`);
            const parentArray = getRecords(parentEntityKey) || [];
            const updateResult = updateNestedArray(parentArray, parentKeyField, parentId, nestedArrayField, nestedItemData, nestedKeyField, actionType);

            if (updateResult) {
                operationSuccess = saveRecords(parentEntityKey, parentArray); // Save the whole parent array
                if (!operationSuccess) finalMessage = `Storage error: Failed to save updated ${parentEntityKey}.`;
            } else {
                 // updateNestedArray failed (e.g., parent not found, duplicate add)
                 operationSuccess = false;
                 finalMessage = `Operation failed: Could not ${actionType} nested ${recordType}. Check logs.`;
            }
        } else {
            // --- Standard (Top-Level) Add/Update ---
            const primaryKeyField = matchKeyMap[parentEntityKey]; // Use parentEntityKey (which is entityKey here)
            if (!primaryKeyField) throw new Error(`Configuration error: Missing primary key for '${parentEntityKey}'`);

            const existingRecords = getRecords(parentEntityKey) || [];
            const recordId = preparedData[primaryKeyField];
            if (!recordId) throw new Error(`Data error: Missing primary key value for '${primaryKeyField}' in form data.`);
            const existingIndex = existingRecords.findIndex(r => r[primaryKeyField] === recordId);

            if (actionType === "add") {
                if (existingIndex !== -1) throw new Error(`Duplicate error: Record with ${primaryKeyField}=${recordId} already exists.`);
                existingRecords.push(preparedData);
                operationSuccess = saveRecords(parentEntityKey, existingRecords);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save new ${recordType}.`;

            } else if (actionType === "edit") {
                if (existingIndex === -1) throw new Error(`Not found error: Record with ${primaryKeyField}=${recordId} not found for editing.`);
                existingRecords[existingIndex] = { ...existingRecords[existingIndex], ...preparedData }; // Merge update
                operationSuccess = saveRecords(parentEntityKey, existingRecords);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save updated ${recordType}.`;
            } else {
                 throw new Error(`Invalid action type '${actionType}'.`);
            }
        }

        // --- 5. Return Result ---
        console.log(`[Handler:SaveUpdate] Result: success=${operationSuccess}, message=${finalMessage}`);
        return { success: operationSuccess, message: finalMessage };

    } catch (error) {
        console.error(`[Handler:SaveUpdate] CRITICAL ERROR for ${entityKey} (${actionType}):`, error);
        return {
            success: false,
            // Return validation errors if they were the cause and attached to the error
            errors: error.validationErrors || null,
            message: error.message || `Unexpected error during ${actionType}.`
        };
    }
}; // End of handleSaveOrUpdateRecord


// --- Delete Handler (Confirmed for Nested) ---
export const handleDeleteEntityFormSubmit = (
    entityKey,          // Storage key ('years', 'sites', 'courses', etc.)
    recordIdentifier,   // The ID of the record/item to delete (e.g., yearCode, semesterCode, roomCode)
    onSuccess,          // Callback on success: (message: string) => void
    onError,            // Callback on error: (message: string) => void
    parentIdentifier = null // The ID of the parent (e.g., yearCode for semester, siteCode for room)
) => {
    console.log(`[Handler:Delete] Start: entityKey=${entityKey}, recordId=${recordIdentifier}, parentId=${parentIdentifier}`);
    try {
        let operationSuccess = false;
        let recordType = null;           // Type being deleted (e.g., 'semester', 'room', 'year')
        let finalMessage = "Record deleted successfully."; // Default success message
        let  isNested = !!parentIdentifier;

        let parentEntityKey = null;     // Storage key of array to modify ('years', 'sites', 'courses')
        let parentKeyField = null;      // Key field of the parent ('yearCode', 'siteCode') - only if nested
        let nestedArrayField = null;    // Array field in parent ('semesters', 'rooms') - only if nested
        let itemKeyField = null;        // The primary key field of the item being deleted

        // --- 1. Determine Type and Keys ---
        if (isNested && entityKey === 'years') { // Deleting a Semester
            recordType = 'semester'; parentEntityKey = 'years'; parentKeyField = 'yearCode';
            nestedArrayField = 'semesters'; itemKeyField = getPrimaryKeyFieldByRecordType('semester');
        } else if (isNested && entityKey === 'sites') { // Deleting a Room
             recordType = 'room'; parentEntityKey = 'sites'; parentKeyField = 'siteCode';
             nestedArrayField = 'rooms'; itemKeyField = getPrimaryKeyFieldByRecordType('room');
             // Note: Deleting from flat 'rooms' list is NOT handled here.
        } else if (matchKeyMap[entityKey]) { // Standard top-level delete
            parentEntityKey = entityKey; // Modify the entityKey array directly
            recordType = entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey;
            itemKeyField = matchKeyMap[entityKey]; // Get key from the direct map
        } else {
             throw new Error(`Configuration error: Cannot delete unknown entity type '${entityKey}'.`);
        }
        // Validate we found the item's key field
        if (!itemKeyField) throw new Error(`Configuration error: Primary key field not found for '${recordType || entityKey}'.`);
        if (!recordIdentifier) throw new Error(`Data error: No ID provided for deletion of ${recordType || entityKey}.`);
        console.log(`[Handler:Delete] Determined recordType: ${recordType}, isNested: ${isNested}, itemKeyField: ${itemKeyField}`);

        // --- 2. Perform Delete Operation ---
        const dataArray = getRecords(parentEntityKey) || []; // Get the array to modify

        if (isNested) {
            // --- Nested Delete ---
            if (!parentIdentifier) throw new Error(`Data error: Parent ID required to delete nested ${recordType}.`);
            const parentIndex = dataArray.findIndex(p => p[parentKeyField] === parentIdentifier);
            if (parentIndex === -1) throw new Error(`Not found error: Parent ${parentKeyField}=${parentIdentifier} not found.`);

            const nestedArray = dataArray[parentIndex][nestedArrayField];
            if (!Array.isArray(nestedArray)) throw new Error(`Data error: Nested array '${nestedArrayField}' missing or invalid in parent ${parentIdentifier}.`);

            const initialLength = nestedArray.length;
            // Filter OUT the item to be deleted from the nested array
            dataArray[parentIndex][nestedArrayField] = nestedArray.filter(
                item => item[itemKeyField] !== recordIdentifier
            );
            const finalLength = dataArray[parentIndex][nestedArrayField].length;

            if (finalLength < initialLength) { // If an item was actually removed
                operationSuccess = saveRecords(parentEntityKey, dataArray); // Save the modified parent array
                if (!operationSuccess) finalMessage = `Storage error: Failed to save changes after deleting ${recordType}.`;
            } else { // Item not found in the nested array
                 throw new Error(`Not found error: ${recordType} with ID ${recordIdentifier} not found within parent ${parentIdentifier}.`);
            }
        } else {
            // --- Standard Top-Level Delete ---
            const initialLength = dataArray.length;
            // Filter OUT the item from the top-level array
            const updatedRecords = dataArray.filter(r => r[itemKeyField] !== recordIdentifier);
            const finalLength = updatedRecords.length;

            if (finalLength < initialLength) { // If an item was actually removed
                operationSuccess = saveRecords(parentEntityKey, updatedRecords); // Save the filtered top-level array
                if (!operationSuccess) finalMessage = `Storage error: Failed to save changes after deleting ${recordType}.`;
            } else { // Item not found in the top-level array
                 throw new Error(`Not found error: ${recordType} with ID ${recordIdentifier} not found.`);
            }
        }

        // --- 3. Call Callbacks ---
        if (operationSuccess) {
            console.log(`[Handler:Delete] Success: ${finalMessage}`);
            onSuccess(finalMessage);
        } else {
            // This path is mainly for storage save failures
            console.error(`[Handler:Delete] Failed: ${finalMessage}`);
            onError(finalMessage);
        }

    } catch (error) { // Catch all errors (config, not found, data, storage)
        console.error(`[Handler:Delete] CRITICAL ERROR for ${entityKey} (ID: ${recordIdentifier}):`, error);
        onError(error.message || `Unexpected error during delete.`);
    }
}; // End of handleDeleteEntityFormSubmit