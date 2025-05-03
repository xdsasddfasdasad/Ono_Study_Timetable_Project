// src/handlers/formHandlers.js

import { getRecords, saveRecords } from "../utils/storage";
import { hashPassword } from "../utils/hash";
import { validateFormByType } from "../utils/validateForm";
import { getPrimaryKeyFieldByRecordType } from "../utils/formMappings";
const matchKeyMap = {
    students: "id",
    courses: "courseCode",
    coursesMeetings: "id",
    years: "yearCode",
    lecturers: "id",
    sites: "siteCode",
    holidays: "holidayCode",
    vacations: "vacationCode",
    events: "eventCode",
    tasks: "assignmentCode",
    studentEvents: "eventCode",
};
const updateNestedArray = (parentArray, parentKeyField, parentId, nestedArrayField, nestedItem, nestedKeyField, actionType) => {
    const parentIndex = parentArray.findIndex(p => p[parentKeyField] === parentId);
    if (parentIndex === -1) {
        console.error(`[Handler:updateNested] Parent ${parentKeyField}=${parentId} not found.`);
        return false;
    }
    if (!Array.isArray(parentArray[parentIndex][nestedArrayField])) {
        parentArray[parentIndex][nestedArrayField] = [];
        console.log(`[Handler:updateNested] Initialized ${nestedArrayField} array for parent ${parentId}.`);
    }

    const nestedArray = parentArray[parentIndex][nestedArrayField];
    const nestedItemId = nestedItem[nestedKeyField];

    if (!nestedItemId) {
         console.error(`[Handler:updateNested] Nested item is missing its key field '${nestedKeyField}'. Cannot proceed.`);
         return false;
    }
    const existingNestedIndex = nestedArray.findIndex(n => n[nestedKeyField] === nestedItemId);
    if (actionType === 'add') {
        if (existingNestedIndex !== -1) {
            console.warn(`[Handler:updateNested] Cannot add duplicate: Nested item ${nestedKeyField}=${nestedItemId} already exists in parent ${parentId}.`);
            return false;
        }
        nestedArray.push(nestedItem);
        console.log(`[Handler:updateNested] Added nested item ${nestedItemId} to parent ${parentId}.`);
        return true;
    } else if (actionType === 'edit') {
        if (existingNestedIndex === -1) {
            console.error(`[Handler:updateNested] Cannot edit: Nested item ${nestedKeyField}=${nestedItemId} not found in parent ${parentId}.`);
            return false;
        }
        nestedArray[existingNestedIndex] = { ...nestedArray[existingNestedIndex], ...nestedItem };
        console.log(`[Handler:updateNested] Updated nested item ${nestedItemId} in parent ${parentId}.`);
        return true;
    }
    console.error(`[Handler:updateNested] Invalid actionType: ${actionType}`);
    return false;
};
export const handleSaveOrUpdateRecord = async (
    entityKey,
    formData,
    actionType,
    validationExtra = {},
    skipInternalValidation = false
) => {
    console.log(`[Handler:SaveUpdate] Start: entityKey=${entityKey}, actionType=${actionType}, skipValidation=${skipInternalValidation}`);
    try {
        let recordType = null;
        let isNested = false;
        let parentEntityKey = null;
        let parentKeyField = null;
        let parentId = null;
        let nestedArrayField = null;
        let nestedKeyField = null;
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
            isNested = false; parentEntityKey = entityKey;
            recordType = entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey;
            recordType = validationExtra.recordType || recordType;
        } else {
             throw new Error(`Configuration error: Unknown or unhandled entity key '${entityKey}'.`);
        }
        console.log(`[Handler:SaveUpdate] Determined: recordType=${recordType}, isNested=${isNested}, parentEntityKey=${parentEntityKey}`);
        if (!skipInternalValidation) {
            console.log(`[Handler:SaveUpdate] Running internal validation for type: ${recordType}`);
            const validationErrors = validateFormByType(recordType, formData, validationExtra);
            if (Object.keys(validationErrors).length > 0) {
                console.warn(`[Handler:SaveUpdate] Internal validation failed for ${recordType}:`, validationErrors);
                return { success: false, errors: validationErrors, message: "Internal validation failed." };
            }
            console.log(`[Handler:SaveUpdate] Internal validation passed for ${recordType}.`);
        } else {
             console.log(`[Handler:SaveUpdate] Skipping internal validation as requested by caller.`);
        }
        let preparedData = { ...formData };
        if (entityKey === "students" && preparedData.password && preparedData.password.length > 0) {
            try {
                console.log("[Handler:SaveUpdate] Hashing student password...");
                preparedData.password = await hashPassword(preparedData.password);
                console.log("[Handler:SaveUpdate] Student password hashed.");
            } catch (hashError) {
                throw new Error(`Password hashing failed: ${hashError.message}`);
            }
        }
        let nestedItemData = null;
        if (isNested) {
            nestedItemData = { ...preparedData };
            if (recordType === 'room') {
                nestedItemData = {
                     roomCode: preparedData.roomCode,
                     roomName: preparedData.roomName,
                     notes: preparedData.notes || ""
                };
            } else if (recordType === 'semester') {
            }
        }
        let operationSuccess = false;
        let finalMessage = `Successfully ${actionType === 'add' ? 'added' : 'updated'} ${recordType}.`;

        const dataArray = getRecords(parentEntityKey) || [];

        if (isNested) {
            if (!parentId) throw new Error(`Data error: Parent ID (${parentKeyField}) missing for nested ${recordType}.`);
            const updateResult = updateNestedArray(dataArray, parentKeyField, parentId, nestedArrayField, nestedItemData, nestedKeyField, actionType);
            if (updateResult) {
                operationSuccess = saveRecords(parentEntityKey, dataArray);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save updated ${parentEntityKey}.`;
            } else {
                 operationSuccess = false; finalMessage = `Operation failed: Could not ${actionType} nested ${recordType}. Check logs or data.`;
            }
        } else {
            const primaryKeyField = matchKeyMap[parentEntityKey];
            if (!primaryKeyField) throw new Error(`Configuration error: Missing primary key for '${parentEntityKey}'`);
            const recordId = preparedData[primaryKeyField];
            if (!recordId) throw new Error(`Data error: Missing primary key value for '${primaryKeyField}'.`);
            const existingIndex = dataArray.findIndex(r => r[primaryKeyField] === recordId);

            if (actionType === "add") {
                if (existingIndex !== -1) throw new Error(`Duplicate error: Record ${primaryKeyField}=${recordId} already exists.`);
                dataArray.push(preparedData);
                operationSuccess = saveRecords(parentEntityKey, dataArray);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save new ${recordType}.`;
            } else if (actionType === "edit") {
                if (existingIndex === -1) throw new Error(`Not found error: Record ${primaryKeyField}=${recordId} not found for editing.`);
                dataArray[existingIndex] = { ...dataArray[existingIndex], ...preparedData };
                operationSuccess = saveRecords(parentEntityKey, dataArray);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save updated ${recordType}.`;
            } else {
                 throw new Error(`Invalid action type '${actionType}'.`);
            }
        }
        console.log(`[Handler:SaveUpdate] Result: success=${operationSuccess}, message=${finalMessage}`);
        return { success: operationSuccess, message: finalMessage };

    } catch (error) {
        console.error(`[Handler:SaveUpdate] CRITICAL ERROR for ${entityKey} (${actionType}):`, error);
        return {
            success: false,
            errors: error.validationErrors || null,
            message: error.message || `Unexpected error during ${actionType} operation.`
        };
    }
};
export const handleDeleteEntityFormSubmit = (
    entityKey,
    recordIdentifier,
    onSuccess,
    onError,
    parentIdentifier = null
) => {
    console.log(`[Handler:Delete] Start: entityKey=${entityKey}, recordId=${recordIdentifier}, parentId=${parentIdentifier}`);
    try {
        let operationSuccess = false;
        let recordType = null;
        let finalMessage = "Record deleted successfully.";
        let  isNested = !!parentIdentifier;

        let parentEntityKey = null;
        let parentKeyField = null;
        let nestedArrayField = null;
        let itemKeyField = null;
        if (isNested && entityKey === 'years') {
            recordType = 'semester'; parentEntityKey = 'years'; parentKeyField = 'yearCode';
            nestedArrayField = 'semesters'; itemKeyField = getPrimaryKeyFieldByRecordType('semester');
        } else if (isNested && entityKey === 'sites') {
             recordType = 'room'; parentEntityKey = 'sites'; parentKeyField = 'siteCode';
             nestedArrayField = 'rooms'; itemKeyField = getPrimaryKeyFieldByRecordType('room');
        } else if (matchKeyMap[entityKey]) {
            parentEntityKey = entityKey;
            recordType = entityKey.endsWith('s') ? entityKey.slice(0, -1) : entityKey;
            itemKeyField = matchKeyMap[entityKey];
        } else {
             throw new Error(`Configuration error: Cannot delete unknown entity type '${entityKey}'.`);
        }
        if (!itemKeyField) throw new Error(`Configuration error: Primary key field not found for '${recordType || entityKey}'.`);
        if (!recordIdentifier) throw new Error(`Data error: No ID provided for deletion of ${recordType || entityKey}.`);
        console.log(`[Handler:Delete] Determined recordType: ${recordType}, isNested: ${isNested}, itemKeyField: ${itemKeyField}`);
        const dataArray = getRecords(parentEntityKey) || [];
        if (isNested) {
            if (!parentIdentifier) throw new Error(`Data error: Parent ID required to delete nested ${recordType}.`);
            const parentIndex = dataArray.findIndex(p => p[parentKeyField] === parentIdentifier);
            if (parentIndex === -1) throw new Error(`Not found error: Parent ${parentKeyField}=${parentIdentifier} not found.`);
            const nestedArray = dataArray[parentIndex][nestedArrayField];
            if (!Array.isArray(nestedArray)) throw new Error(`Data error: Nested array '${nestedArrayField}' missing or invalid in parent ${parentIdentifier}.`);
            const initialLength = nestedArray.length;
            dataArray[parentIndex][nestedArrayField] = nestedArray.filter(
                item => item[itemKeyField] !== recordIdentifier
            );
            const finalLength = dataArray[parentIndex][nestedArrayField].length;
            if (finalLength < initialLength) {
                operationSuccess = saveRecords(parentEntityKey, dataArray);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save changes after deleting ${recordType}.`;
            } else {
                 throw new Error(`Not found error: ${recordType} with ID ${recordIdentifier} not found within parent ${parentIdentifier}.`);
            }
        } else {
            const initialLength = dataArray.length;
            const updatedRecords = dataArray.filter(r => r[itemKeyField] !== recordIdentifier);
            const finalLength = updatedRecords.length;
            if (finalLength < initialLength) {
                operationSuccess = saveRecords(parentEntityKey, updatedRecords);
                if (!operationSuccess) finalMessage = `Storage error: Failed to save changes after deleting ${recordType}.`;
            } else {
                 throw new Error(`Not found error: ${recordType} with ID ${recordIdentifier} not found.`);
            }
        }
        if (operationSuccess) {
            console.log(`[Handler:Delete] Success: ${finalMessage}`);
            onSuccess(finalMessage);
        } else {
            console.error(`[Handler:Delete] Failed: ${finalMessage}`);
            onError(finalMessage);
        }
    } catch (error) {
        console.error(`[Handler:Delete] CRITICAL ERROR for ${entityKey} (ID: ${recordIdentifier}):`, error);
        onError(error.message || `Unexpected error during delete.`);
    }
};