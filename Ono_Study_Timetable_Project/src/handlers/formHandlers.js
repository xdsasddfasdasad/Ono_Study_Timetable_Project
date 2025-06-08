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

        if (opDetails.isNested) {
            if (!parentDocId) throw new Error(`Parent ID required for nested delete of ${recordType}.`);
            if (recordType === 'semester') await deleteSemesterFromYear(parentDocId, recordId);
            else if (recordType === 'room') await deleteRoomFromSite(parentDocId, recordId);
        } else {
            if (recordType === 'student') {
                console.warn(`Deleting student Firestore profile ${recordId}. The corresponding Auth user is NOT deleted from Auth service automatically.`);
            }
            await deleteDocument(collectionName, recordId);
        }

        if (recordType === 'course') {
            console.log(`[Handler:Delete] Post-delete action: Deleting all meetings for course ${recordId}`);
            await deleteMeetingsForCourse(recordId);
        }
        
        return { success: true, message: `${recordType} deleted successfully.` };

    } catch (error) {
        console.error(`[Handler:Delete] CRITICAL ERROR for ${entityKey} (ID: ${recordId}):`, error);
        return { success: false, message: error.message || "Deletion failed." };
    }
};