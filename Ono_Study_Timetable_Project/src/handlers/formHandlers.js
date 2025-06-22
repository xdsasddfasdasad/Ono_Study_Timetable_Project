import {
    setDocument, updateDocument, deleteDocument,
    saveSemesterInYear, deleteSemesterFromYear,
    saveRoomInSite, deleteRoomFromSite,
    fetchCollectionWithQuery, performBatchWrites
} from "../firebase/firestoreService";
import { where } from "firebase/firestore";
import { validateFormByType } from "../utils/validateForm";
import { formMappings } from "../utils/formMappings";
import { regenerateMeetingsForCourse, deleteMeetingsForCourse } from "../utils/courseMeetingGenerator";
import { signUpUser } from "../firebase/authService";

/**
 * פונקציית עזר פנימית לזיהוי סוג הפעולה והמידע הרלוונטי על בסיס הישות.
 */
const getOperationDetails = (entityKey, formData, recordTypeHint) => {
    const recordType = recordTypeHint || Object.values(formMappings).find(m => m.collectionName === entityKey)?.recordType;
    if (!recordType) throw new Error(`Configuration Error: Could not determine recordType for entityKey '${entityKey}' with hint '${recordTypeHint}'.`);

    const mapping = formMappings[recordType];
    if (!mapping) throw new Error(`Configuration Error: No mapping found for recordType '${recordType}'.`);

    const details = {
        isNested: false,
        recordType: recordType,
        collectionName: mapping.collectionName,
        primaryKeyField: mapping.primaryKey,
        parentInfo: null,
    };
    
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
 * Handler מרכזי וגנרי לשמירה או עדכון של כל רשומה במערכת.
 */
export const handleSaveOrUpdateRecord = async (entityKey, formData, mode, options = {}) => {
    const { recordType: recordTypeHint, editingId } = options;
    console.log(`[Handler:Save] Started for entity: ${entityKey}, mode: ${mode}, hint: ${recordTypeHint}`);

    try {
        const opDetails = getOperationDetails(entityKey, formData, recordTypeHint);
        const { recordType, primaryKeyField, collectionName } = opDetails;

        console.log(`[Handler:Save] Details: type=${recordType}, pk=${primaryKeyField}, collection=${collectionName}`);

        // --- שלב 1: ולידציה ---
        const validationErrors = await validateFormByType(recordType, formData, { mode, editingId });
        if (Object.keys(validationErrors).length > 0) {
            throw { validationErrors, message: "Validation failed. Please check the form fields." };
        }
        
        // --- שלב 2: הכנת הנתונים לשמירה ---
        let dataToSave = { ...formData };
        const recordId = dataToSave[primaryKeyField];

        // ✨ --- התיקון הסופי והמרכזי נמצא כאן --- ✨
        // פונקציית עזר פנימית להמרת תאריך חכמה
        const toValidDate = (dateValue) => {
            if (!dateValue) return null;
            // אם זה כבר אובייקט Date, החזר אותו
            if (dateValue instanceof Date) return dateValue;
            // אם זה Timestamp של Firestore, השתמש ב-toDate()
            if (typeof dateValue.toDate === 'function') return dateValue.toDate();
            // אחרת, נסה להמיר אותו (כנראה ממחרוזת)
            const date = new Date(dateValue);
            // החזר את התאריך רק אם הוא תקין, אחרת זרוק שגיאה
            if (isNaN(date.getTime())) throw new RangeError(`Invalid date value provided: ${dateValue}`);
            return date;
        };
        
        // המר את שדות התאריך הרלוונטיים באמצעות הפונקציה החכמה.
        // זה מבטיח שלעולם לא ננסה לשמור תאריך לא תקין.
        if ('start' in dataToSave) {
            dataToSave.start = toValidDate(dataToSave.start);
        }
        if ('end' in dataToSave) {
            dataToSave.end = toValidDate(dataToSave.end);
        }
        // --- סוף התיקון ---

        // --- שלב 3: לוגיקה ייעודית לפי סוג ישות ---
        if (recordType === 'student' && mode === 'add') {
            const { email, password, ...profileData } = dataToSave;
            const newUserData = await signUpUser(email, password, profileData);
            return { success: true, message: `Student ${newUserData.profile.username} created successfully.` };
        }

        // --- שלב 4: שמירה ל-Firestore ---
        if (opDetails.isNested) {
            if (recordType === 'semester') await saveSemesterInYear(opDetails.parentInfo.docId, dataToSave);
            else if (recordType === 'room') await saveRoomInSite(opDetails.parentInfo.docId, dataToSave);
        } else {
            if (!recordId) throw new Error(`Primary key '${primaryKeyField}' is missing from the data.`);
            
            if (mode === 'add') {
                await setDocument(collectionName, recordId, dataToSave);
            } else { // 'edit'
                delete dataToSave[primaryKeyField];
                await updateDocument(collectionName, recordId, dataToSave);
            }
        }
        
        // --- שלב 5: פעולות לאחר שמירה ---
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
 * Handler מרכזי וגנרי למחיקת כל רשומה מהמערכת.
 */
export const handleDeleteEntity = async (entityKey, recordId, options = {}) => {
    const { parentDocId, recordType: recordTypeHint } = options;
    console.log(`[Handler:Delete] Started for entity: ${entityKey}, ID: ${recordId}`);

    try {
        const opDetails = getOperationDetails(entityKey, {}, recordTypeHint);
        const { recordType, collectionName } = opDetails;
        const batchWrites = []; // Array to hold all delete operations

        // ✨ FIX 3.1: Logic for deleting a Year
        if (recordType === 'year') {
            console.log(`[Handler:Delete] Year deletion detected for ${recordId}. Cascading...`);
            // Fetch all courses that belong to semesters within this year
            const yearToDelete = await fetchCollectionWithQuery('years', [where('yearCode', '==', recordId)]);
            const semesterCodesToDelete = (yearToDelete[0]?.semesters || []).map(s => s.semesterCode);
            
            if (semesterCodesToDelete.length > 0) {
                const relatedCourses = await fetchCollectionWithQuery('courses', [where('semesterCode', 'in', semesterCodesToDelete)]);
                for (const course of relatedCourses) {
                    console.log(`[Handler:Delete] -> Deleting meetings and tasks for related course: ${course.courseCode}`);
                    // A. Delete all meetings for each related course
                    const courseMeetings = await fetchCollectionWithQuery('coursesMeetings', [where('courseCode', '==', course.courseCode)]);
                    courseMeetings.forEach(meeting => batchWrites.push({ type: 'delete', collectionPath: 'coursesMeetings', documentId: meeting.id }));
                    
                    // B. Delete all tasks for each related course
                    const courseTasks = await fetchCollectionWithQuery('tasks', [where('courseCode', '==', course.courseCode)]);
                    courseTasks.forEach(task => batchWrites.push({ type: 'delete', collectionPath: 'tasks', documentId: task.assignmentCode }));
                    
                    // C. Delete the course definition itself
                    //batchWrites.push({ type: 'delete', collectionPath: 'courses', documentId: course.courseCode });
                }
            }
        }

        // ✨ FIX 3.2: Logic for deleting a Semester
        if (recordType === 'semester') {
            console.log(`[Handler:Delete] Semester deletion detected for ${recordId}. Cascading...`);
            // This is handled by the Year deletion logic, but if a semester is deleted directly:
            await deleteSemesterFromYear(parentDocId, recordId); // This removes it from the parent year document

            // Then, find and delete all related courses (and their meetings/tasks)
            const relatedCourses = await fetchCollectionWithQuery('courses', [where('semesterCode', '==', recordId)]);
            for (const course of relatedCourses) {
                console.log(`[Handler:Delete] -> Deleting meetings and tasks for related course: ${course.courseCode}`);
                const courseMeetings = await fetchCollectionWithQuery('coursesMeetings', [where('courseCode', '==', course.courseCode)]);
                courseMeetings.forEach(meeting => batchWrites.push({ type: 'delete', collectionPath: 'coursesMeetings', documentId: meeting.id }));
                
                const courseTasks = await fetchCollectionWithQuery('tasks', [where('courseCode', '==', course.courseCode)]);
                courseTasks.forEach(task => batchWrites.push({ type: 'delete', collectionPath: 'tasks', documentId: task.assignmentCode }));
                
                // batchWrites.push({ type: 'delete', collectionPath: 'courses', documentId: course.courseCode });
            }
            // No need to delete the main document, as semesters are nested.
        }
        
        // ✨ FIX 4: Logic for deleting a Course
        if (recordType === 'course') {
            console.log(`[Handler:Delete] Course deletion detected for ${recordId}. Cascading...`);
            // A. Delete all meetings for this course
            const courseMeetings = await fetchCollectionWithQuery('coursesMeetings', [where('courseCode', '==', recordId)]);
            courseMeetings.forEach(meeting => batchWrites.push({ type: 'delete', collectionPath: 'coursesMeetings', documentId: meeting.id }));
            
            // B. Delete all tasks for this course
            const courseTasks = await fetchCollectionWithQuery('tasks', [where('courseCode', '==', recordId)]);
            courseTasks.forEach(task => batchWrites.push({ type: 'delete', collectionPath: 'tasks', documentId: task.assignmentCode }));
        }

        // --- Main Deletion Logic ---
        if (opDetails.isNested && recordType !== 'semester') { // Semester is special
            if (!parentDocId) throw new Error(`Parent ID required for nested delete of ${recordType}.`);
            if (recordType === 'room') await deleteRoomFromSite(parentDocId, recordId);
        } else if (recordType !== 'semester') {
             if (recordType === 'student') {
                console.warn(`Deleting student Firestore profile ${recordId}. Auth user NOT deleted.`);
            }
            // Add the main document to be deleted
            batchWrites.push({ type: 'delete', collectionPath: collectionName, documentId: recordId });
        }

        // --- Execute all deletes in a single batch ---
        if (batchWrites.length > 0) {
            console.log(`[Handler:Delete] Executing batch delete of ${batchWrites.length} documents.`);
            await performBatchWrites(batchWrites);
        } else {
             // This can happen for a semester deletion if there are no related courses
            console.log("[Handler:Delete] No batch operations to perform, deletion considered complete.");
        }
        
        return { success: true, message: `${recordType} and all related data deleted successfully.` };

    } catch (error) {
        console.error(`[Handler:Delete] CRITICAL ERROR for ${entityKey} (ID: ${recordId}):`, error);
        return { success: false, message: error.message || "Deletion failed." };
    }
};