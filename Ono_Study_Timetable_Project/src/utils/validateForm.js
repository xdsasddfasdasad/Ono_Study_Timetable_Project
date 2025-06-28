// src/utils/validateForm.js

import { fetchDocumentsByQuery } from '../firebase/firestoreService';

/**
 * ✨ NEW: Reusable validation logic for date/time fields in calendar entries.
 * @param {object} data - The form data for the entry.
 * @returns {object} An object with date/time validation errors.
 */
const validateDateTime = (data) => {
    const errors = {};
    if (!data.startDate) {
        errors.startDate = "Start date is required.";
        return errors; // Stop further date checks if start date is missing
    }

    const isAllDay = data.allDay === true || String(data.allDay).toLowerCase() === 'true';

    // If it's NOT an all-day event, times are mandatory
    if (!isAllDay) {
        if (!data.startHour) errors.startHour = "Start time is required.";
        if (!data.endHour) errors.endHour = "End time is required.";
    }

    // Generic date range check
    if (data.endDate && data.endDate < data.startDate) {
        errors.endDate = "End date cannot be before the start date.";
    }

    // Time range check for single-day, timed events
    if (!isAllDay && data.startHour && data.endHour) {
        const effectiveEndDate = data.endDate || data.startDate; // Assume same day if end date is missing
        if (effectiveEndDate === data.startDate && data.startHour >= data.endHour) {
            errors.endHour = "End time must be after the start time on the same day.";
        }
    }
    
    return errors;
};


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

    if (!formData.studentIdCard?.trim()) {
        errors.studentIdCard = "שדה ת.ז. הוא חובה.";
    } else if (!/^\d{9}$/.test(formData.studentIdCard.trim())) {
        errors.studentIdCard = "ת.ז. חייבת להכיל 9 ספרות בדיוק.";
    } else if (!isEditMode) {
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

    if (!formData.firstName?.trim()) errors.firstName = "שם פרטי הוא חובה.";
    if (!formData.lastName?.trim()) errors.lastName = "שם משפחה הוא חובה.";
    if (!formData.username?.trim()) errors.username = "שם משתמש הוא חובה.";

    if (!formData.email?.trim()) {
        errors.email = "אימייל הוא חובה.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        errors.email = "פורמט אימייל לא תקין.";
    } else {
        try {
            const existingByEmail = await fetchDocumentsByQuery('students', 'email', '==', formData.email.trim());
            if (existingByEmail.some(doc => doc.id !== editingId)) {
                errors.email = "כתובת אימייל זו כבר בשימוש.";
            }
        } catch (e) {
            console.error("Email check failed:", e);
            errors.email = "שגיאה בבדיקת ייחודיות של אימייל.";
        }
    }
    
    const isPasswordFilled = !!formData.password?.trim();
    
    if (!isEditMode && !isPasswordFilled) {
        errors.password = "סיסמה היא חובה.";
    }

    if (isPasswordFilled) {
        if (formData.password.length < 6) {
            errors.password = "סיסמה חייבת להכיל לפחות 6 תווים.";
        } else {
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
    const editingId = options.editingId;

    if (!formData.yearNumber?.trim()) { errors.yearNumber = "Year number is required."; }
    else {
        try {
            const existingByNumber = await fetchDocumentsByQuery('years', 'yearNumber', '==', formData.yearNumber.trim());
            if (existingByNumber.some(doc => doc.id !== editingId)) { errors.yearNumber = "Year number already exists."; }
        } catch (e) { console.error("Year number check failed:", e); errors.yearNumber = "Could not verify year number uniqueness."; }
    }

    if (!formData.yearCode?.trim()) { errors.yearCode = "Year code is required."; }
    
    if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
    if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.endDate = "End date must be on or after start date.";
    }
    return errors;
};

export const validateSemesterForm = async (formData, options = {}) => {
    const errors = {};
    const parentYear = options.parentRecord;
    const editingId = options.editingId;

    if (!formData.semesterNumber?.trim()) { errors.semesterNumber = "Semester number is required."; }
    else if (parentYear?.semesters) {
         const duplicate = parentYear.semesters.some(s =>
              s.semesterNumber?.trim() === formData.semesterNumber?.trim() && s.semesterCode !== editingId
         );
         if (duplicate) { errors.semesterNumber = "Semester number already exists in this year."; }
    }

    if (!formData.semesterCode?.trim()) { errors.semesterCode = "Semester code is required."; }
    else if (parentYear?.semesters) {
         const duplicateCode = parentYear.semesters.some(s =>
              s.semesterCode?.trim() === formData.semesterCode?.trim() && s.semesterCode !== editingId
         );
         if (duplicateCode) { errors.semesterCode = "Semester code already exists in this year."; }
    }

    if (!formData.startDate?.trim()) errors.startDate = "Semester start date is required.";
    if (!formData.endDate?.trim()) errors.endDate = "Semester end date is required.";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.startDate = "Start date must be on or before end date.";
    }

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
  const editingId = options.editingId;

  // 🗑️ הוסר: הבדיקה if (!formData.id?.trim())
  // הסיבה: עבור מרצה חדש, אין ID בטופס, וזה תקין.
  // ה-ID נוצר על ידי Firestore.

  if (!formData.name?.trim()) {
    errors.name = "Lecturer name is required.";
  } else {
    try {
      const existingByName = await fetchDocumentsByQuery('lecturers', 'name', '==', formData.name.trim());
      // הבדיקה לוודא שהשם לא קיים אצל מרצה אחר
      if (existingByName.some(doc => doc.id !== editingId)) {
        errors.name = "Lecturer name already exists.";
      }
    } catch (e) {
      console.error("Lecturer name check failed:", e);
      errors.name = "Could not verify name uniqueness.";
    }
  }

  if (formData.email && formData.email.trim()) {
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = "Invalid email format.";
    } else {
      try {
        const existingByEmail = await fetchDocumentsByQuery('lecturers', 'email', '==', formData.email.trim());
        // הבדיקה לוודא שהאימייל לא קיים אצל מרצה אחר
        if (existingByEmail.some(doc => doc.id !== editingId)) {
          errors.email = "Email already registered.";
        }
      } catch (e) {
        console.error("Lecturer email check failed:", e);
        errors.email = "Could not verify email uniqueness.";
      }
    }
  }
  return errors;
};

export const validateCourseForm = async (formData, options = {}) => {
    const errors = {};
    const editingId = options.editingId;

    if (!formData.courseCode?.trim()) { errors.courseCode = "Course code is required."; }
    else {
         try {
            const existingByCode = await fetchDocumentsByQuery('courses', 'courseCode', '==', formData.courseCode.trim());
            if (existingByCode.some(doc => doc.id !== editingId)) {
                 errors.courseCode = "Course code already exists.";
            }
         } catch (e) { console.error("Course code check failed:", e); errors.courseCode = "Could not verify code uniqueness."; }
    }

    if (!formData.courseName?.trim()) errors.courseName = "Course name is required.";
    if (!formData.lecturerId?.trim()) errors.lecturerId = "Lecturer is required.";
    if (!formData.semesterCode?.trim()) errors.semesterCode = "Semester is required.";

    if (!Array.isArray(formData.hours) || formData.hours.length === 0) {
        errors.hours = "At least one weekly time slot is required.";
    } else {
        formData.hours.forEach((slot, index) => {
            if (!slot?.day) { errors[`hours[${index}].day`] = "Day required."; }
            if (!slot?.start) { errors[`hours[${index}].start`] = "Start required."; }
            if (!slot?.end) { errors[`hours[${index}].end`] = "End required."; }
            if (slot?.start && slot?.end) {
                if (slot.start >= slot.end) { errors[`hours[${index}].end`] = "End must be after start."; }
            }
        });
    }
    return errors;
};

export const validateCourseMeetingForm = async (formData, options = {}) => {
    const errors = {};
    const { parentSemester } = options;

    if (!formData.title?.trim()) {
      errors.title = "Meeting title is required.";
    }
    if (!formData.start) {
      errors.start = "Start date and time are required.";
    } else if (parentSemester) { // Only validate range if we have semester info
        try {
            const meetingStartDate = new Date(formData.start);
            const semesterInterval = {
                start: parseISO(parentSemester.startDate),
                end: parseISO(parentSemester.endDate)
            };
            if (!isWithinInterval(meetingStartDate, semesterInterval)) {
                errors.start = `Date must be within semester dates (${parentSemester.startDate} to ${parentSemester.endDate}).`;
            }
        } catch (e) {
            errors.start = "Invalid date format for validation.";
        }
    }

    if (!formData.end) {
      errors.end = "End date and time are required.";
    }

    if (formData.start && formData.end) {
        try {
            const startDate = new Date(formData.start);
            const endDate = new Date(formData.end);
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

export const validateTaskForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

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
  return errors;
};

export const validateSiteForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  if (!formData.siteCode?.trim()) { errors.siteCode = "Site code is required."; }

  if (!formData.siteName?.trim()) { errors.siteName = "Site name is required."; }
  else {
      try {
          const existingByName = await fetchDocumentsByQuery('sites', 'siteName', '==', formData.siteName.trim());
          if (existingByName.some(doc => doc.id !== editingId)) { errors.siteName = "Site name already exists."; }
      } catch (e) { console.error("Site name check failed:", e); errors.siteName = "Could not verify name uniqueness."; }
  }
  return errors;
};

export const validateRoomForm = async (formData, options = {}) => {
    const errors = {};
    const parentSite = options.parentRecord;
    // editingId יהיה null/undefined במצב 'new', ועם ערך במצב 'edit'
    const editingId = options.editingId; 

    // ✨ תיקון: הבדיקה על roomCode צריכה להתעלם מהחדר הנוכחי שאנחנו עורכים
    if (!formData.roomCode?.trim()) {
        errors.roomCode = "Room code is required.";
    } else if (parentSite?.rooms) {
        // ודא שהקוד לא שייך לחדר אחר באתר
        const duplicateCode = parentSite.rooms.some(r =>
             r.roomCode?.trim() === formData.roomCode?.trim() && r.roomCode !== editingId
        );
        if (duplicateCode) {
            errors.roomCode = "Room code already exists in this site.";
        }
    }

    if (!formData.roomName?.trim()) {
        errors.roomName = "Room name is required.";
    } else if (parentSite?.rooms) {
        // ודא שהשם לא שייך לחדר אחר באתר
        const duplicateName = parentSite.rooms.some(r =>
             r.roomName?.trim().toLowerCase() === formData.roomName?.trim().toLowerCase() && r.roomCode !== editingId
        );
        if (duplicateName) {
            errors.roomName = "Room name already exists in this site.";
        }
    }

    if (!formData.siteCode?.trim()) {
        errors.siteCode = "Parent site is required.";
    } else if (parentSite && formData.siteCode !== parentSite.siteCode) {
        errors.siteCode = "Site code mismatch with parent record.";
    }

    return errors;
};

export const validateHolidayForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  if (!formData.holidayCode?.trim()) { errors.holidayCode = "Holiday code is required."; }
  else {
       try {
          const existingByCode = await fetchDocumentsByQuery('holidays', 'holidayCode', '==', formData.holidayCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.holidayCode = "Holiday code already exists."; }
       } catch (e) { console.error("Holiday code check failed:", e); errors.holidayCode = "Could not verify code uniqueness."; }
  }

  if (!formData.holidayName?.trim()) errors.holidayName = "Holiday name is required.";
  
  const dateTimeErrors = validateDateTime(formData);
  return { ...errors, ...dateTimeErrors };
};

export const validateVacationForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  if (!formData.vacationCode?.trim()) { errors.vacationCode = "Vacation code is required."; }
  else {
      try {
          const existingByCode = await fetchDocumentsByQuery('vacations', 'vacationCode', '==', formData.vacationCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.vacationCode = "Vacation code already exists."; }
       } catch (e) { console.error("Vacation code check failed:", e); errors.vacationCode = "Could not verify code uniqueness."; }
  }

  if (!formData.vacationName?.trim()) errors.vacationName = "Vacation name is required.";

  const dateTimeErrors = validateDateTime(formData);
  return { ...errors, ...dateTimeErrors };
};

export const validateEventForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  if (!formData.eventCode?.trim()) { errors.eventCode = "Event code is required."; }
  else {
       try {
          const existingByCode = await fetchDocumentsByQuery('events', 'eventCode', '==', formData.eventCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.eventCode = "Event code already exists."; }
       } catch (e) { console.error("Event code check failed:", e); errors.eventCode = "Could not verify code uniqueness."; }
  }

  if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";

  const dateTimeErrors = validateDateTime(formData);
  return { ...errors, ...dateTimeErrors };
};

export const validatePersonalEventForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  if (!formData.eventCode?.trim()) { errors.eventCode = "Event code is required."; }
  else {
      try {
          const existingByCode = await fetchDocumentsByQuery('studentEvents', 'eventCode', '==', formData.eventCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.eventCode = "Event code already exists."; }
      } catch (e) { console.error("Student event code check failed:", e); errors.eventCode = "Could not verify code uniqueness."; }
  }

  if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";
  if (!formData.startDate?.trim()) errors.startDate = "Date is required.";
  
  const isAllDayBool = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';

  if (!isAllDayBool) {
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


export const validateFormByType = async (recordType, formData, extra = {}) => {
    console.log(`[validateFormByType:Async] Validating type: ${recordType}`);
    const options = {
         ...extra.options,
         editingId: extra.editingId,
         parentRecord: extra.parentRecord
    };

    try {
        switch (recordType) {
            case "student":       return await validateStudentForm(formData, options);
            case "year":          return await validateYearForm(formData, options);
            case "semester":      return await validateSemesterForm(formData, options);
            case "lecturer":      return await validateLecturerForm(formData, options);
            case "course":        return await validateCourseForm(formData, options);
            case "courseMeeting": return await validateCourseMeetingForm(formData, options);
            case "task":          return await validateTaskForm(formData, options);
            case "site":          return await validateSiteForm(formData, options);
            case "room":          return await validateRoomForm(formData, options);
            case "holiday":       return await validateHolidayForm(formData, options);
            case "vacation":      return await validateVacationForm(formData, options);
            case "event":         return await validateEventForm(formData, options);
            case "studentEvent":  return await validatePersonalEventForm(formData, options);
            default:
                console.warn(`Validation not implemented for type: ${recordType}`);
                return {};
        }
    } catch (error) {
         console.error(`[validateFormByType:Async] Error during validation for ${recordType}:`, error);
         return { _validationError: `Validation failed: ${error.message || 'Unknown error'}` };
    }
};