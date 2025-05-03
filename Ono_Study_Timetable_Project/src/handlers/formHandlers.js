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
    formData,           // Data from the form (potentially cleaned by caller)
    actionType,         // "add" or "edit"
    validationExtra = {}, // Context for validation (e.g., existing records, editingId)
    // ✅ ADDED: Flag to bypass the internal validation call if caller already validated
    skipInternalValidation = false
) => {
    // Log entry point and parameters
    console.log(`[Handler:SaveUpdate] Start: entityKey=${entityKey}, actionType=${actionType}, skipValidation=${skipInternalValidation}`);
    // Avoid logging sensitive formData by default in production, use during debug if needed
    // console.log("[Handler:SaveUpdate] formData:", formData);
    // console.log("[Handler:SaveUpdate] validationExtra:", validationExtra);

    try {
        // --- 1. Determine Operation Specifics (recordType, isNested, keys) ---
        let recordType = null;
        let isNested = false;
        let parentEntityKey = null;
        let parentKeyField = null;
        let parentId = null;
        let nestedArrayField = null;
        let nestedKeyField = null; // Primary key of the nested item

        // Check for nested operations first
        if (entityKey === 'years' && formData.semesterCode) {
            isNested = true; recordType = 'semester'; parentEntityKey = 'years';
            parentKeyField = 'yearCode'; parentId = formData.yearCode;
            nestedArrayField = 'semesters'; nestedKeyField = getPrimaryKeyFieldByRecordType('semester');
            if (!nestedKeyField) throw new Error("Config error: Missing primary key mapping for 'semester'.");
        } else if (entityKey === 'sites' && formData.roomCode) {
             isNested = true; recordType = 'room'; parentEntityKey = 'sites';
             parentKeyField = 'siteCode'; parentId = formData.siteCode;
             nestedArrayField = 'rooms'; nestedKeyField = getPrimaryKeyFieldByRecordType('room');
             if (!nestedKeyField) throw new Error("Config error: Missing primary key mapping for 'room'.");
        } else if (matchKeyMap[entityKey]) {
            // Standard top-level entity
            isNested = false; parentEntityKey = entityKey; // Operate directly on this key
            recordType = entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey;
            recordType = validationExtra.recordType || recordType; // Allow override
        } else {
             // If entityKey is not in matchKeyMap and not handled as nested, it's an error
             throw new Error(`Configuration error: Unknown or unhandled entity key '${entityKey}'.`);
        }
        console.log(`[Handler:SaveUpdate] Determined: recordType=${recordType}, isNested=${isNested}, parentEntityKey=${parentEntityKey}`);

        // --- 2. Perform Validation (Optional based on flag) ---
        if (!skipInternalValidation) {
            console.log(`[Handler:SaveUpdate] Running internal validation for type: ${recordType}`);
            const validationErrors = validateFormByType(recordType, formData, validationExtra);
            if (Object.keys(validationErrors).length > 0) {
                console.warn(`[Handler:SaveUpdate] Internal validation failed for ${recordType}:`, validationErrors);
                // Return validation errors so the caller can display them
                return { success: false, errors: validationErrors, message: "Internal validation failed." };
            }
            console.log(`[Handler:SaveUpdate] Internal validation passed for ${recordType}.`);
        } else {
             console.log(`[Handler:SaveUpdate] Skipping internal validation as requested by caller.`);
        }

        // --- 3. Prepare Data (Hashing, Cleaning) ---
        // Work with a copy to avoid mutating the original formData argument
        let preparedData = { ...formData };

        // Hash student password if it exists in the preparedData
        // (The modal should have already removed it if it was blank during edit)
        if (entityKey === "students" && preparedData.password && preparedData.password.length > 0) {
            try {
                console.log("[Handler:SaveUpdate] Hashing student password...");
                preparedData.password = await hashPassword(preparedData.password);
                // confirmPassword should already be removed by the caller (modal)
                console.log("[Handler:SaveUpdate] Student password hashed.");
            } catch (hashError) {
                // Wrap hashing error for consistent error handling
                throw new Error(`Password hashing failed: ${hashError.message}`);
            }
        }

        // Prepare specific data structure for nested items if needed
        let nestedItemData = null;
        if (isNested) {
            nestedItemData = { ...preparedData };
            // Clean the nested item: Remove fields that belong only to the parent context, etc.
            if (recordType === 'room') {
                nestedItemData = {
                     roomCode: preparedData.roomCode, // Keep required fields
                     roomName: preparedData.roomName,
                     notes: preparedData.notes || ""
                     // Only include fields defined for a room object within the site's 'rooms' array
                };
                // Remove parent identifier if it shouldn't be stored within the nested object
                // delete nestedItemData.siteCode;
            } else if (recordType === 'semester') {
                // Remove parent identifier if it shouldn't be stored within the nested object
                // delete nestedItemData.yearCode;
            }
        }

        // --- 4. Perform Save/Update Operation ---
        let operationSuccess = false;
        let finalMessage = `Successfully ${actionType === 'add' ? 'added' : 'updated'} ${recordType}.`; // Optimistic message

        const dataArray = getRecords(parentEntityKey) || []; // Get the array (top-level or parent)

        if (isNested) {
            // --- Nested Add/Update ---
            if (!parentId) throw new Error(`Data error: Parent ID (${parentKeyField}) missing for nested ${recordType}.`);
            const updateResult = updateNestedArray(dataArray, parentKeyField, parentId, nestedArrayField, nestedItemData, nestedKeyField, actionType);
            if (updateResult) {
                operationSuccess = saveRecords(parentEntityKey, dataArray); // Save the modified parent array
                if (!operationSuccess) finalMessage = `Storage error: Failed to save updated ${parentEntityKey}.`;
            } else {
                 operationSuccess = false; finalMessage = `Operation failed: Could not ${actionType} nested ${recordType}. Check logs or data.`;
            }
        } else {
            // --- Standard (Top-Level) Add/Update ---
            const primaryKeyField = matchKeyMap[parentEntityKey];
            if (!primaryKeyField) throw new Error(`Configuration error: Missing primary key for '${parentEntityKey}'`);
            const recordId = preparedData[primaryKeyField];
            if (!recordId) throw new Error(`Data error: Missing primary key value for '${primaryKeyField}'.`);
            const existingIndex = dataArray.findIndex(r => r[primaryKeyField] === recordId);

            if (actionType === "add") {
                if (existingIndex !== -1) throw new Error(`Duplicate error: Record ${primaryKeyField}=${recordId} already exists.`);
                dataArray.push(preparedData); // Add the fully prepared data
                operationSuccess = saveRecords(parentEntityKey, dataArray);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save new ${recordType}.`;
            } else if (actionType === "edit") {
                if (existingIndex === -1) throw new Error(`Not found error: Record ${primaryKeyField}=${recordId} not found for editing.`);
                // Merge updates onto the existing record to preserve any unchanged fields
                dataArray[existingIndex] = { ...dataArray[existingIndex], ...preparedData };
                operationSuccess = saveRecords(parentEntityKey, dataArray);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save updated ${recordType}.`;
            } else {
                 throw new Error(`Invalid action type '${actionType}'.`);
            }
        }

        // --- 5. Return Result ---
        console.log(`[Handler:SaveUpdate] Result: success=${operationSuccess}, message=${finalMessage}`);
        return { success: operationSuccess, message: finalMessage };

    } catch (error) { // Catch all errors (config, validation, hashing, storage, data issues)
        console.error(`[Handler:SaveUpdate] CRITICAL ERROR for ${entityKey} (${actionType}):`, error);
        // Try to return specific validation errors if they were passed up
        // Otherwise, return the general error message
        return {
            success: false,
            errors: error.validationErrors || null, // Pass back validation errors if available
            message: error.message || `Unexpected error during ${actionType} operation.`
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