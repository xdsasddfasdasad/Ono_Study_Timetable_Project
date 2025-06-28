// src/handlers/formHandlers.js

// This file serves as a central hub for all complex data manipulation logic.
// It acts as a "handler" layer that sits between the UI components (modals) and the
// low-level database services (firestoreService). This pattern is excellent for
// centralizing business logic, validation, and complex operations like cascading deletes.

import {
    setDocument, updateDocument, deleteDocument,
    saveSemesterInYear, deleteSemesterFromYear,
    saveRoomInSite, deleteRoomFromSite,
    fetchCollectionWithQuery, performBatchWrites, fetchCollection
} from "../firebase/firestoreService";
import { where } from "firebase/firestore";
// Imports validation logic and data structure mappings.
import { validateFormByType } from "../utils/validateForm";
import { formMappings } from "../utils/formMappings";
// Imports higher-level utility functions.
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../utils/courseMeetingGenerator";
import { signUpUser } from "../firebase/authService";

/**
 * An internal helper function to determine the type of operation and relevant metadata
 * based on the entity being processed.
 */
const getOperationDetails = (entityKey, formData, recordTypeHint) => {
    // Determine the 'recordType' (e.g., 'semester') from the hint or by looking it up in the mappings.
    const recordType = recordTypeHint || Object.values(formMappings).find(m => m.collectionName === entityKey)?.recordType;
    if (!recordType) throw new Error(`Configuration Error: Could not determine recordType for entityKey '${entityKey}' with hint '${recordTypeHint}'.`);

    const mapping = formMappings[recordType];
    if (!mapping) throw new Error(`Configuration Error: No mapping found for recordType '${recordType}'.`);

    // This object will hold all the necessary metadata for the operation.
    const details = {
        isNested: false, // Is this data stored in an array inside another document?
        recordType: recordType,
        collectionName: mapping.collectionName,
        primaryKeyField: mapping.primaryKey,
        parentInfo: null, // Info about the parent document if it's nested.
    };
    
    // Specific logic for nested data types.
    if (recordType === 'semester') {
        details.isNested = true;
        details.parentInfo = { collectionName: 'years', docId: formData.yearCode, arrayName: 'semesters' };
    } else if (recordType === 'room') {
        details.isNested = true;
        details.parentInfo = { collectionName: 'sites', docId: formData.siteCode, arrayName: 'rooms' };
    }

    return details;
};

/**
 * A central, generic handler for saving a new record or updating an existing one.
 * This function orchestrates validation, data preparation, saving, and any post-save actions.
 */
export const handleSaveOrUpdateRecord = async (entityKey, formData, mode, options = {}) => {
    const { recordType: recordTypeHint, editingId } = options;
    console.log(`[Handler:Save] Started for entity: ${entityKey}, mode: ${mode}, hint: ${recordTypeHint}`);

    try {
        const opDetails = getOperationDetails(entityKey, formData, recordTypeHint);
        const { recordType, primaryKeyField, collectionName } = opDetails;

        console.log(`[Handler:Save] Details: type=${recordType}, pk=${primaryKeyField}, collection=${collectionName}`);
        let extraValidationOptions = { ...options };

        // For some validations, we need to fetch extra context.
        // e.g., To validate a course meeting's dates, we need the parent semester's start and end dates.
        if (recordType === 'courseMeeting' && formData.semesterCode) {
            const years = await fetchCollection("years");
            const parentSemester = years.flatMap(y => y.semesters || []).find(s => s.semesterCode === formData.semesterCode);
            if (parentSemester) {
                extraValidationOptions.parentSemester = parentSemester;
            }
        }

        // --- Step 1: Validation ---
        const validationErrors = await validateFormByType(recordType, formData, extraValidationOptions);
        if (Object.keys(validationErrors).length > 0) {
            // If validation fails, throw an error that includes the specific field errors.
            throw { validationErrors, message: "Validation failed. Please check the form fields." };
        }
        
        // --- Step 2: Prepare Data for Saving ---
        let dataToSave = { ...formData };
        const recordId = dataToSave[primaryKeyField];

        // This is a robust helper function to ensure any date value is a valid Date object
        // before we try to save it to Firestore, preventing crashes from invalid date strings.
        const toValidDate = (dateValue) => {
            if (!dateValue) return null;
            if (dateValue instanceof Date) return dateValue; // Already a Date object.
            if (typeof dateValue.toDate === 'function') return dateValue.toDate(); // It's a Firestore Timestamp.
            
            // Otherwise, try to parse it (likely from a string).
            const date = new Date(dateValue);
            // If the parsed date is invalid, throw an error to stop the save process.
            if (isNaN(date.getTime())) throw new RangeError(`Invalid date value provided: ${dateValue}`);
            return date;
        };
        
        // Apply the safe date conversion to relevant fields.
        if ('start' in dataToSave) dataToSave.start = toValidDate(dataToSave.start);
        if ('end' in dataToSave) dataToSave.end = toValidDate(dataToSave.end);

        // --- Step 3: Special Logic by Entity Type ---
        // Some entities, like 'student', require special handling (e.g., calling auth services).
        if (recordType === 'student' && mode === 'add') {
            const { email, password, ...profileData } = dataToSave;
            // The `signUpUser` service handles both Auth and Firestore creation.
            const newUserData = await signUpUser(email, password, profileData);
            return { success: true, message: `Student ${newUserData.profile.username} created successfully.` };
        }

        // --- Step 4: Save to Firestore ---
        if (opDetails.isNested) {
            // If the data is nested (like a semester in a year), call the specific handler for it.
            if (recordType === 'semester') await saveSemesterInYear(opDetails.parentInfo.docId, dataToSave);
            else if (recordType === 'room') await saveRoomInSite(opDetails.parentInfo.docId, dataToSave);
        } else {
            // For top-level documents.
            if (!recordId) throw new Error(`Primary key '${primaryKeyField}' is missing from the data.`);
            
            if (mode === 'add') {
                // `setDocument` creates a document with a specific, client-defined ID.
                await setDocument(collectionName, recordId, dataToSave);
            } else { // 'edit'
                // In edit mode, we don't want to update the primary key itself.
                delete dataToSave[primaryKeyField];
                await updateDocument(collectionName, recordId, dataToSave);
            }
        }
        
        // --- Step 5: Post-Save Actions ---
        // After a course is saved, we need to regenerate its meeting instances on the calendar.
        if (recordType === 'course') {
            console.log(`[Handler:Save] Post-save action: Regenerating meetings for course ${recordId}`);
            await regenerateMeetingsForCourse(recordId);
        }

        return { success: true, message: `${recordType} saved successfully.` };

    } catch (error) {
        console.error(`[Handler:Save] CRITICAL ERROR for ${entityKey} (${mode}):`, error);
        return {
            success: false,
            message: error.validationErrors ? error.message : error.message || "An unexpected server error occurred.",
            errors: error.validationErrors || { form: error.message },
        };
    }
};

/**
 * A central, generic handler for deleting any record from the system.
 * This function is responsible for handling "cascading deletes" where necessary.
 */
export const handleDeleteEntity = async (entityKey, recordId, options = {}) => {
    const { parentDocId, recordType: recordTypeHint } = options;
    console.log(`[Handler:Delete] Started for entity: ${entityKey}, ID: ${recordId}`);

    try {
        const opDetails = getOperationDetails(entityKey, {}, recordTypeHint);
        const { recordType, collectionName } = opDetails;
        const batchWrites = []; // We will gather all delete operations into a single atomic batch.

        // --- Cascading Delete Logic ---
        
        // If deleting a Year, we must also delete all its semesters, courses, meetings, and tasks.
        if (recordType === 'year') {
            console.log(`[Handler:Delete] Year deletion detected for ${recordId}. Cascading...`);
            const yearToDelete = await fetchCollectionWithQuery('years', [where('yearCode', '==', recordId)]);
            const semesterCodesToDelete = (yearToDelete[0]?.semesters || []).map(s => s.semesterCode);
            
            if (semesterCodesToDelete.length > 0) {
                const relatedCourses = await fetchCollectionWithQuery('courses', [where('semesterCode', 'in', semesterCodesToDelete)]);
                for (const course of relatedCourses) {
                    console.log(`[Handler:Delete] -> Queueing deletes for related course: ${course.courseCode}`);
                    // A. Queue deletes for all meetings of each related course.
                    const courseMeetings = await fetchCollectionWithQuery('coursesMeetings', [where('courseCode', '==', course.courseCode)]);
                    courseMeetings.forEach(meeting => batchWrites.push({ type: 'delete', collectionPath: 'coursesMeetings', documentId: meeting.id }));
                    
                    // B. Queue deletes for all tasks of each related course.
                    const courseTasks = await fetchCollectionWithQuery('tasks', [where('courseCode', '==', course.courseCode)]);
                    courseTasks.forEach(task => batchWrites.push({ type: 'delete', collectionPath: 'tasks', documentId: task.assignmentCode }));
                }
            }
        }

        // If deleting a Semester, we must also delete all its courses, meetings, and tasks.
        if (recordType === 'semester') {
            console.log(`[Handler:Delete] Semester deletion detected for ${recordId}. Cascading...`);
            await deleteSemesterFromYear(parentDocId, recordId); // This removes it from the parent year's array.

            const relatedCourses = await fetchCollectionWithQuery('courses', [where('semesterCode', '==', recordId)]);
            for (const course of relatedCourses) {
                console.log(`[Handler:Delete] -> Queueing deletes for related course: ${course.courseCode}`);
                const courseMeetings = await fetchCollectionWithQuery('coursesMeetings', [where('courseCode', '==', course.courseCode)]);
                courseMeetings.forEach(meeting => batchWrites.push({ type: 'delete', collectionPath: 'coursesMeetings', documentId: meeting.id }));
                
                const courseTasks = await fetchCollectionWithQuery('tasks', [where('courseCode', '==', course.courseCode)]);
                courseTasks.forEach(task => batchWrites.push({ type: 'delete', collectionPath: 'tasks', documentId: task.assignmentCode }));
            }
        }
        
        // If deleting a Course, we must also delete all its meetings and tasks.
        if (recordType === 'course') {
            console.log(`[Handler:Delete] Course deletion detected for ${recordId}. Cascading...`);
            await deleteMeetingsForCourse(recordId, batchWrites); // Use the utility function to queue deletes.
        }

        // --- Main Deletion Logic ---
        if (opDetails.isNested && recordType !== 'semester') { // Semesters are special as they don't have their own collection.
            if (!parentDocId) throw new Error(`Parent ID required for nested delete of ${recordType}.`);
            if (recordType === 'room') await deleteRoomFromSite(parentDocId, recordId);
        } else if (recordType !== 'semester') {
             if (recordType === 'student') {
                // IMPORTANT: This only deletes the Firestore profile. The Firebase Auth user is NOT deleted.
                // This is a business decision to prevent accidental permanent user deletion.
                console.warn(`Deleting student Firestore profile ${recordId}. Auth user NOT deleted.`);
            }
            // Add the main document itself to the batch to be deleted.
            batchWrites.push({ type: 'delete', collectionPath: collectionName, documentId: recordId });
        }

        // --- Execute the Batch ---
        if (batchWrites.length > 0) {
            console.log(`[Handler:Delete] Executing batch delete of ${batchWrites.length} documents.`);
            await performBatchWrites(batchWrites);
        } else {
            console.log("[Handler:Delete] No batch operations to perform, deletion considered complete.");
        }
        
        return { success: true, message: `${recordType} and all related data deleted successfully.` };

    } catch (error) {
        console.error(`[Handler:Delete] CRITICAL ERROR for ${entityKey} (ID: ${recordId}):`, error);
        return { success: false, message: error.message || "Deletion failed." };
    }
};