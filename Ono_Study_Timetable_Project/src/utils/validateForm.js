// src/utils/validateForm.js

// ✅ Import Firestore query function
import { fetchDocumentsByQuery } from '../firebase/firestoreService';

/**
 * Validates the student form data against business rules and database uniqueness.
 * @param {object} formData - The current state of the form.
 * @param {object} options - Options like editingId to skip self-comparison.
 * @returns {Promise<object>} An object containing validation errors.
 */
export const validateStudentForm = async (formData, options = {}) => {
    const errors = {};
    const editingId = options.editingId; // The student's Firestore document ID (UID)
    const isEditMode = !!editingId;

    // --- Student ID Card (ת.ז) Validation ---
    // ✅ CHANGED: Logic now targets studentIdCard instead of a generic 'id' field
    if (!formData.studentIdCard?.trim()) {
        errors.studentIdCard = "שדה ת.ז. הוא חובה.";
    } else if (!/^\d{9}$/.test(formData.studentIdCard.trim())) {
        errors.studentIdCard = "ת.ז. חייבת להכיל 9 ספרות בדיוק.";
    } else if (!isEditMode) { // ✅ Check for uniqueness only on 'add' mode
        try {
            const existingStudent = await fetchDocumentsByQuery('students', 'studentIdCard', '==', formData.studentIdCard.trim());
            if (existingStudent.length > 0) {
                errors.studentIdCard = "מספר ת.ז. זה כבר קיים במערכת.";
            }
        } catch (e) {
            console.error("Student ID Card check failed:", e);
            errors.studentIdCard = "שגיאה בבדיקת ייחודיות של ת.ז.";
        }
    }

    // --- Basic Information Validation (Synchronous) ---
    if (!formData.firstName?.trim()) errors.firstName = "שם פרטי הוא חובה.";
    if (!formData.lastName?.trim()) errors.lastName = "שם משפחה הוא חובה.";
    if (!formData.username?.trim()) errors.username = "שם משתמש הוא חובה.";

    // --- Email Validation (Async) ---
    if (!formData.email?.trim()) {
        errors.email = "אימייל הוא חובה.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        errors.email = "פורמט אימייל לא תקין.";
    } else {
        try {
            const existingByEmail = await fetchDocumentsByQuery('students', 'email', '==', formData.email.trim());
            // Check if an existing document with this email belongs to a *different* user
            if (existingByEmail.some(doc => doc.id !== editingId)) {
                errors.email = "כתובת אימייל זו כבר בשימוש.";
            }
        } catch (e) {
            console.error("Email check failed:", e);
            errors.email = "שגיאה בבדיקת ייחודיות של אימייל.";
        }
    }
    
    // --- Password Validation ---
    const isPasswordFilled = !!formData.password?.trim();
    
    // ✅ In 'add' mode, password is required. In 'edit' mode, it's optional.
    if (!isEditMode && !isPasswordFilled) {
        errors.password = "סיסמה היא חובה.";
    }

    // ✅ If a password is provided (in either mode), it must be valid.
    if (isPasswordFilled) {
        if (formData.password.length < 6) {
            errors.password = "סיסמה חייבת להכיל לפחות 6 תווים.";
        } else {
            // ✅ Validate confirmation only if password field itself is valid and filled
            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = "הסיסמאות אינן תואמות.";
            }
        }
    }
    
    console.log("[validateStudentForm:Async] Validation Errors:", errors);
    return errors;
};

export const validateYearForm = async (formData, options = {}) => {
    const errors = {};
    const editingId = options.editingId; // yearCode

    // Year Number Checks
    if (!formData.yearNumber?.trim()) { errors.yearNumber = "Year number is required."; }
    else {
        try {
            const existingByNumber = await fetchDocumentsByQuery('years', 'yearNumber', '==', formData.yearNumber.trim());
            if (existingByNumber.some(doc => doc.id !== editingId)) { errors.yearNumber = "Year number already exists."; }
        } catch (e) { console.error("Year number check failed:", e); errors.yearNumber = "Could not verify year number uniqueness."; }
    }

    // Year Code Checks
    if (!formData.yearCode?.trim()) { errors.yearCode = "Year code is required."; }
    else {
         try {
            // Check if a document with this ID already exists (Firestore doesn't have a direct duplicate check for ID on set/update)
            // This check might be better handled by trying to save and catching the error if ID structure is strict,
            // or assuming user won't manually create conflicting codes if they are auto-generated based on yearNumber.
            // For simplicity, let's skip direct Firestore ID check here unless explicitly needed.
            // const existingByCode = await fetchDocumentById('years', formData.yearCode.trim());
            // if (existingByCode && existingByCode.id !== editingId) { errors.yearCode = "Year code already exists."; }
         } catch (e) { console.error("Year code check skipped/failed:", e); }
    }

    // Date Checks (Synchronous)
    if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
    if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.endDate = "End date must be on or after start date.";
    }
    return errors;
};

// Needs parentYear context passed in options for date range checks and uniqueness within parent
export const validateSemesterForm = async (formData, options = {}) => {
    const errors = {};
    const parentYear = options.parentRecord; // Passed from handler/caller
    const editingId = options.editingId; // semesterCode

    // Semester Number Checks
    if (!formData.semesterNumber?.trim()) { errors.semesterNumber = "Semester number is required."; }
    else if (parentYear?.semesters) { // Check uniqueness only if parent and its semesters exist
         const duplicate = parentYear.semesters.some(s =>
              s.semesterNumber?.trim() === formData.semesterNumber?.trim() && s.semesterCode !== editingId
         );
         if (duplicate) { errors.semesterNumber = "Semester number already exists in this year."; }
    }

    // Semester Code Checks
    if (!formData.semesterCode?.trim()) { errors.semesterCode = "Semester code is required."; }
    else if (parentYear?.semesters) {
         const duplicateCode = parentYear.semesters.some(s =>
              s.semesterCode?.trim() === formData.semesterCode?.trim() && s.semesterCode !== editingId
         );
         if (duplicateCode) { errors.semesterCode = "Semester code already exists in this year."; }
    }

    // Date Checks (Synchronous)
    if (!formData.startDate?.trim()) errors.startDate = "Semester start date is required.";
    if (!formData.endDate?.trim()) errors.endDate = "Semester end date is required.";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.startDate = "Start date must be on or before end date.";
    }

    // Date Range within Year Check (Synchronous, uses parentRecord from options)
    if (parentYear && formData.startDate && formData.endDate) {
        if (formData.startDate < parentYear.startDate || formData.endDate > parentYear.endDate) {
            errors.startDate = errors.startDate || `Dates must be within year range (${parentYear.startDate} - ${parentYear.endDate}).`;
            errors.endDate = errors.endDate || `Dates must be within year range (${parentYear.startDate} - ${parentYear.endDate}).`;
        }
    }

    if (!formData.yearCode?.trim()) errors.yearCode = "Parent year code is required.";

    return errors;
};

export const validateLecturerForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId; // Lecturer document ID

  if (!formData.id?.trim()) { errors.id = "Lecturer ID is required."; }
  // ID uniqueness check might be complex if ID isn't user-controlled

  if (!formData.name?.trim()) { errors.name = "Lecturer name is required."; }
  else {
      try {
          const existingByName = await fetchDocumentsByQuery('lecturers', 'name', '==', formData.name.trim());
          if (existingByName.some(doc => doc.id !== editingId)) { errors.name = "Lecturer name already exists."; }
      } catch (e) { console.error("Lecturer name check failed:", e); errors.name = "Could not verify name uniqueness."; }
  }

  if (formData.email && formData.email.trim()) {
      if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) { errors.email = "Invalid email format."; }
      else {
          try {
              const existingByEmail = await fetchDocumentsByQuery('lecturers', 'email', '==', formData.email.trim());
              if (existingByEmail.some(doc => doc.id !== editingId)) { errors.email = "Email already registered."; }
          } catch (e) { console.error("Lecturer email check failed:", e); errors.email = "Could not verify email uniqueness."; }
      }
  }
  // Optional phone format validation
  return errors;
};

// Validation for Course Definition
export const validateCourseForm = async (formData, options = {}) => {
    const errors = {};
    const editingId = options.editingId; // courseCode

    // Course Code Checks
    if (!formData.courseCode?.trim()) { errors.courseCode = "Course code is required."; }
    else {
        // Check uniqueness via Firestore query
         try {
            const existingByCode = await fetchDocumentsByQuery('courses', 'courseCode', '==', formData.courseCode.trim());
            if (existingByCode.some(doc => doc.id !== editingId)) { // Firestore ID is courseCode here
                 errors.courseCode = "Course code already exists.";
            }
         } catch (e) { console.error("Course code check failed:", e); errors.courseCode = "Could not verify code uniqueness."; }
    }

    // Synchronous checks
    if (!formData.courseName?.trim()) errors.courseName = "Course name is required.";
    if (!formData.lecturerId?.trim()) errors.lecturerId = "Lecturer is required.";
    if (!formData.semesterCode?.trim()) errors.semesterCode = "Semester is required.";
    // Optional: Add checks here to verify existence of selected lecturer/semester/room using queries if needed

    // Hours array validation (Synchronous checks on the array data)
    if (!Array.isArray(formData.hours) || formData.hours.length === 0) {
        errors.hours = "At least one weekly time slot is required.";
    } else {
        const daysUsed = new Set();
        formData.hours.forEach((slot, index) => {
            let slotHasError = false;
            if (!slot?.day) { errors[`hours[${index}].day`] = "Day required."; slotHasError = true; }
            if (!slot?.start) { errors[`hours[${index}].start`] = "Start required."; slotHasError = true; }
            if (!slot?.end) { errors[`hours[${index}].end`] = "End required."; slotHasError = true; }
            if (slot?.start && slot?.end && !slotHasError) {
                if (slot.start >= slot.end) { errors[`hours[${index}].end`] = "End must be after start."; slotHasError = true; }
            }
            // Uncomment if duplicate days are not allowed
            // if (slot?.day && !slotHasError) {
            //     if (daysUsed.has(slot.day)) { errors[`hours[${index}].day`] = `Day already scheduled.`; }
            //     else { daysUsed.add(slot.day); }
            // }
        });
    }
    return errors;
};

// Validation for a single Course Meeting
// Uniqueness check on 'id' might be less critical if generated robustly.
export const validateCourseMeetingForm = async (formData, options = {}) => {
    const errors = {};

    if (!formData.title?.trim()) {
      errors.title = "Meeting title is required.";
    }

    if (!formData.start) {
      errors.start = "Start date and time are required.";
    }

    if (!formData.end) {
      errors.end = "End date and time are required.";
    }

    // בצע בדיקה רק אם שני התאריכים קיימים
    if (formData.start && formData.end) {
        try {
            // ✨ שינוי מרכזי: המר את שני הצדדים לאובייקטי Date לפני השוואה ✨
            // זה מבטיח שאנחנו משווים תפוחים לתפוחים (Date ל-Date)
            // ולא תפוחים לתפוזים (string ל-Timestamp)
            const startDate = new Date(formData.start.toDate ? formData.start.toDate() : formData.start);
            const endDate = new Date(formData.end.toDate ? formData.end.toDate() : formData.end);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error("Invalid date format detected.");
            }

            if (startDate >= endDate) {
                errors.end = "End time must be after start time.";
            }
        } catch (e) {
            errors.start = errors.start || "Invalid date format.";
            errors.end = errors.end || "Invalid date format.";
        }
    }

    if (!formData.lecturerId) {
      errors.lecturerId = "Lecturer is required.";
    }

    if (!formData.roomCode) {
      errors.roomCode = "Room is required.";
    }

    if (!formData.courseCode?.trim()) {
      errors.courseCode = "Associated course code is required. This should be automatic.";
    }
    
    return errors;
};

// Validation for Tasks
export const validateTaskForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId; // assignmentCode

  if (!formData.assignmentCode?.trim()) { errors.assignmentCode = "Assignment code is required."; }
  else {
       try {
          const existingByCode = await fetchDocumentsByQuery('tasks', 'assignmentCode', '==', formData.assignmentCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.assignmentCode = "Assignment code already exists."; }
       } catch (e) { console.error("Task code check failed:", e); errors.assignmentCode = "Could not verify code uniqueness."; }
  }

  if (!formData.assignmentName?.trim()) errors.assignmentName = "Assignment name is required.";
  if (!formData.courseCode?.trim()) errors.courseCode = "Associated course is required.";
  if (!formData.submissionDate?.trim()) errors.submissionDate = "Submission date is required.";
  // Optional: Validate submission time format if needed
  return errors;
};

// Validation for Sites
export const validateSiteForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId; // siteCode

  if (!formData.siteCode?.trim()) { errors.siteCode = "Site code is required."; }
  // Site code uniqueness check might be skipped if it's tightly controlled

  if (!formData.siteName?.trim()) { errors.siteName = "Site name is required."; }
  else {
      try {
          const existingByName = await fetchDocumentsByQuery('sites', 'siteName', '==', formData.siteName.trim());
          if (existingByName.some(doc => doc.id !== editingId)) { errors.siteName = "Site name already exists."; }
      } catch (e) { console.error("Site name check failed:", e); errors.siteName = "Could not verify name uniqueness."; }
  }
  return errors;
};

// Validation for Rooms (uniqueness within parent site)
// Needs parentSite context passed in options
export const validateRoomForm = async (formData, options = {}) => {
    const errors = {};
    const parentSite = options.parentRecord; // Site document passed from handler
    const editingId = options.editingId; // roomCode

    if (!formData.roomCode?.trim()) { errors.roomCode = "Room code is required."; }
    else if (parentSite?.rooms) { // Check uniqueness only if parent and its rooms exist
         const duplicateCode = parentSite.rooms.some(r =>
              r.roomCode?.trim() === formData.roomCode?.trim() && r.roomCode !== editingId
         );
         if (duplicateCode) { errors.roomCode = "Room code already exists in this site."; }
    }

    if (!formData.roomName?.trim()) { errors.roomName = "Room name is required."; }
    else if (parentSite?.rooms) {
         const duplicateName = parentSite.rooms.some(r =>
              r.roomName?.trim().toLowerCase() === formData.roomName?.trim().toLowerCase() && r.roomCode !== editingId
         );
         if (duplicateName) { errors.roomName = "Room name already exists in this site."; }
    }

    if (!formData.siteCode?.trim()) errors.siteCode = "Parent site code is required.";
    else if (parentSite && formData.siteCode !== parentSite.siteCode) {
         errors.siteCode = "Site code mismatch with parent record."; // Sanity check
    }

    return errors;
};

// Validation for Holidays (only uniqueness check added)
export const validateHolidayForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId; // holidayCode

  if (!formData.holidayCode?.trim()) { errors.holidayCode = "Holiday code is required."; }
  else {
       try {
          const existingByCode = await fetchDocumentsByQuery('holidays', 'holidayCode', '==', formData.holidayCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.holidayCode = "Holiday code already exists."; }
       } catch (e) { console.error("Holiday code check failed:", e); errors.holidayCode = "Could not verify code uniqueness."; }
  }

  if (!formData.holidayName?.trim()) errors.holidayName = "Holiday name is required.";
  if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
  if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
  if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
    errors.endDate = "End date must be on or after start date.";
  }
  return errors;
};

// Validation for Vacations (only uniqueness check added)
export const validateVacationForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId; // vacationCode

  if (!formData.vacationCode?.trim()) { errors.vacationCode = "Vacation code is required."; }
  else {
      try {
          const existingByCode = await fetchDocumentsByQuery('vacations', 'vacationCode', '==', formData.vacationCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.vacationCode = "Vacation code already exists."; }
       } catch (e) { console.error("Vacation code check failed:", e); errors.vacationCode = "Could not verify code uniqueness."; }
  }

  if (!formData.vacationName?.trim()) errors.vacationName = "Vacation name is required.";
  if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
  if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
  if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.endDate = "End date must be on or after start date.";
  }
  return errors;
};

// Validation for general Events (only uniqueness check added)
export const validateEventForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId; // eventCode

  if (!formData.eventCode?.trim()) { errors.eventCode = "Event code is required."; }
  else {
       try {
          const existingByCode = await fetchDocumentsByQuery('events', 'eventCode', '==', formData.eventCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.eventCode = "Event code already exists."; }
       } catch (e) { console.error("Event code check failed:", e); errors.eventCode = "Could not verify code uniqueness."; }
  }

  if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";
  if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";

  const isAllDay = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';
  if (isAllDay) {
      if (!formData.endDate?.trim()) errors.endDate = "End date required for multi-day all-day event.";
      else if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) { errors.endDate = "End date must be on or after start date."; }
  } else { // Timed event
      if (!formData.startHour?.trim()) errors.startHour = "Start time is required.";
      if (!formData.endHour?.trim()) errors.endHour = "End time is required.";
      if (formData.startHour && formData.endHour) {
          const effectiveEndDate = formData.endDate || formData.startDate; // Assume same day if end date missing
          if (formData.startDate && effectiveEndDate && formData.startDate > effectiveEndDate) { errors.endDate = "End date cannot be before start date."; }
          else if (formData.startDate === effectiveEndDate && formData.startHour >= formData.endHour) { errors.endHour = "End time must be after start time on the same day."; }
      }
  }
  return errors;
};

// Validation for Student Personal Events (only uniqueness check added)
export const validatePersonalEventForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId; // eventCode

  if (!formData.eventCode?.trim()) { errors.eventCode = "Event code is required."; }
  else {
      try {
          // Uniqueness check assumes eventCode is unique across all studentEvents
          const existingByCode = await fetchDocumentsByQuery('studentEvents', 'eventCode', '==', formData.eventCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.eventCode = "Event code already exists."; }
      } catch (e) { console.error("Student event code check failed:", e); errors.eventCode = "Could not verify code uniqueness."; }
  }

  if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";
  if (!formData.startDate?.trim()) errors.startDate = "Date is required.";
  
  const isAllDayBool = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';

  if (!isAllDayBool) {
      // --- FIX: Use formData.startHour and formData.endHour consistently ---
      if (!formData.startHour?.trim()) {
          errors.startHour = "Start time is required.";
      }
      if (!formData.endHour?.trim()) {
          errors.endHour = "End time is required.";
      }
      if (formData.startHour && formData.endHour && formData.startHour >= formData.endHour) {
          errors.endHour = "End time must be after start time.";
      }
  }
  return errors;
};


// --- Central Dynamic Validation Dispatcher (NOW ASYNC) ---
export const validateFormByType = async (recordType, formData, extra = {}) => {
    console.log(`[validateFormByType:Async] Validating type: ${recordType}`);
    // Prepare options consistently for all async validation functions
    const options = {
         ...extra.options, // Pass through any options from caller
         editingId: extra.editingId, // Pass the ID being edited
         parentRecord: extra.parentRecord // Pass parent context if available/needed
    };

    try {
        switch (recordType) {
            case "student":       return await validateStudentForm(formData, options);
            case "year":          return await validateYearForm(formData, options);
            case "semester":      return await validateSemesterForm(formData, options.parentRecord?.semesters || [], options); // Pass existing from parent, plus options
            case "lecturer":      return await validateLecturerForm(formData, options);
            case "course":        return await validateCourseForm(formData, options);
            case "courseMeeting": return await validateCourseMeetingForm(formData, options);
            case "task":          return await validateTaskForm(formData, options);
            case "site":          return await validateSiteForm(formData, options);
            case "room":          return await validateRoomForm(formData, options.parentRecord?.rooms || [], options); // Pass existing from parent, plus options
            case "holiday":       return await validateHolidayForm(formData, options);
            case "vacation":      return await validateVacationForm(formData, options);
            case "event":         return await validateEventForm(formData, options);
            case "studentEvent":  return await validatePersonalEventForm(formData, options);
            default:
                console.warn(`Validation not implemented for type: ${recordType}`);
                return {}; // Return empty object for unknown types
        }
    } catch (error) {
         console.error(`[validateFormByType:Async] Error during validation for ${recordType}:`, error);
         // Return a generic error object to indicate failure
         return { _validationError: `Validation failed: ${error.message || 'Unknown error'}` };
    }
};