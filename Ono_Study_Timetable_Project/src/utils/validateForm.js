// src/utils/validateForm.js

// Import the function needed to query the Firestore database.
import { fetchDocumentsByQuery } from '../firebase/firestoreService';

/**
 * ✨ NEW: Reusable validation logic for date/time fields in calendar entries.
 * @param {object} data - The form data for the entry.
 * @returns {object} An object with date/time validation errors.
 */
const validateDateTime = (data) => {
    // Create an empty object to store any validation errors.
    const errors = {};
    // Check if a start date is provided.
    if (!data.startDate) {
        // If not, add an error message.
        errors.startDate = "Start date is required.";
        // Return immediately since other date validations depend on the start date.
        return errors; 
    }

    // Determine if the event is marked as an "all-day" event.
    const isAllDay = data.allDay === true || String(data.allDay).toLowerCase() === 'true';

    // If the event is not an all-day event, start and end times are required.
    if (!isAllDay) {
        // Check for the start time.
        if (!data.startHour) errors.startHour = "Start time is required.";
        // Check for the end time.
        if (!data.endHour) errors.endHour = "End time is required.";
    }

    // If an end date is provided, ensure it's not before the start date.
    if (data.endDate && data.endDate < data.startDate) {
        errors.endDate = "End date cannot be before the start date.";
    }

    // For single-day events that are not all-day, check if the end time is after the start time.
    if (!isAllDay && data.startHour && data.endHour) {
        // Use the end date if provided, otherwise assume it's the same as the start date.
        const effectiveEndDate = data.endDate || data.startDate;
        // If the event is on a single day, the start time must be before the end time.
        if (effectiveEndDate === data.startDate && data.startHour >= data.endHour) {
            errors.endHour = "End time must be after the start time on the same day.";
        }
    }
    
    // Return the object containing any validation errors found.
    return errors;
};


/**
 * Validates the student form data against business rules and database uniqueness.
 * @param {object} formData - The current state of the form.
 * @param {object} options - Options like editingId to skip self-comparison.
 * @returns {Promise<object>} An object containing validation errors.
 */
export const validateStudentForm = async (formData, options = {}) => {
    // Create an empty object to hold validation errors.
    const errors = {};
    // Get the ID of the student being edited, if any.
    const editingId = options.editingId; 
    // A flag to indicate if we are in edit mode.
    const isEditMode = !!editingId;

    // Validate the student's ID card number.
    if (!formData.studentIdCard?.trim()) {
        errors.studentIdCard = "שדה ת.ז. הוא חובה.";
    } else if (!/^\d{9}$/.test(formData.studentIdCard.trim())) {
        // Check if the ID card number has exactly 9 digits.
        errors.studentIdCard = "ת.ז. חייבת להכיל 9 ספרות בדיוק.";
    } else if (!isEditMode) {
        // If creating a new student, check if the ID card number already exists in the database.
        try {
            const existingStudent = await fetchDocumentsByQuery('students', 'studentIdCard', '==', formData.studentIdCard.trim());
            if (existingStudent.length > 0) {
                errors.studentIdCard = "מספר ת.ז. זה כבר קיים במערכת.";
            }
        } catch (e) {
            // Handle any errors during the database check.
            console.error("Student ID Card check failed:", e);
            errors.studentIdCard = "שגיאה בבדיקת ייחודיות של ת.ז.";
        }
    }

    // Check for required fields: first name, last name, and username.
    if (!formData.firstName?.trim()) errors.firstName = "שם פרטי הוא חובה.";
    if (!formData.lastName?.trim()) errors.lastName = "שם משפחה הוא חובה.";
    if (!formData.username?.trim()) errors.username = "שם משתמש הוא חובה.";

    // Validate the email address.
    if (!formData.email?.trim()) {
        errors.email = "אימייל הוא חובה.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        // Check if the email format is valid.
        errors.email = "פורמט אימייל לא תקין.";
    } else {
        // Check if the email address is already in use by another student.
        try {
            const existingByEmail = await fetchDocumentsByQuery('students', 'email', '==', formData.email.trim());
            // Ensure the found document does not belong to the student being edited.
            if (existingByEmail.some(doc => doc.id !== editingId)) {
                errors.email = "כתובת אימייל זו כבר בשימוש.";
            }
        } catch (e) {
            // Handle any errors during the database check.
            console.error("Email check failed:", e);
            errors.email = "שגיאה בבדיקת ייחודיות של אימייל.";
        }
    }
    
    // Check if a password has been entered.
    const isPasswordFilled = !!formData.password?.trim();
    
    // For new students, a password is required.
    if (!isEditMode && !isPasswordFilled) {
        errors.password = "סיסמה היא חובה.";
    }

    // If a password was entered, validate it.
    if (isPasswordFilled) {
        // Check for minimum password length.
        if (formData.password.length < 6) {
            errors.password = "סיסמה חייבת להכיל לפחות 6 תווים.";
        } else {
            // Check if the password and confirmation password match.
            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = "הסיסמאות אינן תואמות.";
            }
        }
    }
    
    // Log the validation errors for debugging purposes.
    console.log("[validateStudentForm:Async] Validation Errors:", errors);
    // Return the errors object.
    return errors;
};

// Validates the form data for a new academic year.
export const validateYearForm = async (formData, options = {}) => {
    const errors = {};
    const editingId = options.editingId;

    // Check if year number is provided.
    if (!formData.yearNumber?.trim()) { errors.yearNumber = "Year number is required."; }
    else {
        // Check if the year number already exists.
        try {
            const existingByNumber = await fetchDocumentsByQuery('years', 'yearNumber', '==', formData.yearNumber.trim());
            // If a year with this number exists and it's not the one being edited, add an error.
            if (existingByNumber.some(doc => doc.id !== editingId)) { errors.yearNumber = "Year number already exists."; }
        } catch (e) { console.error("Year number check failed:", e); errors.yearNumber = "Could not verify year number uniqueness."; }
    }

    // Check if year code is provided.
    if (!formData.yearCode?.trim()) { errors.yearCode = "Year code is required."; }
    
    // Check for required date fields.
    if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
    if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
    // Ensure the end date is not before the start date.
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.endDate = "End date must be on or after start date.";
    }
    // Return all found errors.
    return errors;
};

// Validates the form data for a new semester.
export const validateSemesterForm = async (formData, options = {}) => {
    const errors = {};
    // Get the parent year record and the ID of the semester being edited.
    const parentYear = options.parentRecord;
    const editingId = options.editingId;

    // Validate the semester number.
    if (!formData.semesterNumber?.trim()) { errors.semesterNumber = "Semester number is required."; }
    else if (parentYear?.semesters) {
         // Check if the semester number already exists within the same academic year.
         const duplicate = parentYear.semesters.some(s =>
              s.semesterNumber?.trim() === formData.semesterNumber?.trim() && s.semesterCode !== editingId
         );
         if (duplicate) { errors.semesterNumber = "Semester number already exists in this year."; }
    }

    // Validate the semester code.
    if (!formData.semesterCode?.trim()) { errors.semesterCode = "Semester code is required."; }
    else if (parentYear?.semesters) {
         // Check if the semester code already exists within the same academic year.
         const duplicateCode = parentYear.semesters.some(s =>
              s.semesterCode?.trim() === formData.semesterCode?.trim() && s.semesterCode !== editingId
         );
         if (duplicateCode) { errors.semesterCode = "Semester code already exists in this year."; }
    }

    // Validate the start and end dates.
    if (!formData.startDate?.trim()) errors.startDate = "Semester start date is required.";
    if (!formData.endDate?.trim()) errors.endDate = "Semester end date is required.";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.startDate = "Start date must be on or before end date.";
    }

    // Ensure the semester dates are within the parent academic year's date range.
    if (parentYear && formData.startDate && formData.endDate) {
        if (formData.startDate < parentYear.startDate || formData.endDate > parentYear.endDate) {
            errors.startDate = errors.startDate || `Dates must be within year range (${parentYear.startDate} - ${parentYear.endDate}).`;
            errors.endDate = errors.endDate || `Dates must be within year range (${parentYear.startDate} - ${parentYear.endDate}).`;
        }
    }

    // Ensure the parent year code is provided.
    if (!formData.yearCode?.trim()) errors.yearCode = "Parent year code is required.";

    // Return all found errors.
    return errors;
};

// Validates the form data for a lecturer.
export const validateLecturerForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  // The ID is generated by Firestore on creation, so no need to validate its presence on the form.

  // Validate the lecturer's name.
  if (!formData.name?.trim()) {
    errors.name = "Lecturer name is required.";
  } else {
    // Check for name uniqueness.
    try {
      const existingByName = await fetchDocumentsByQuery('lecturers', 'name', '==', formData.name.trim());
      // If a lecturer with this name exists and it's not the one being edited, add an error.
      if (existingByName.some(doc => doc.id !== editingId)) {
        errors.name = "Lecturer name already exists.";
      }
    } catch (e) {
      console.error("Lecturer name check failed:", e);
      errors.name = "Could not verify name uniqueness.";
    }
  }

  // If an email is provided, validate it.
  if (formData.email && formData.email.trim()) {
    // Check for valid email format.
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = "Invalid email format.";
    } else {
      // Check for email uniqueness.
      try {
        const existingByEmail = await fetchDocumentsByQuery('lecturers', 'email', '==', formData.email.trim());
        // If a lecturer with this email exists and it's not the one being edited, add an error.
        if (existingByEmail.some(doc => doc.id !== editingId)) {
          errors.email = "Email already registered.";
        }
      } catch (e) {
        console.error("Lecturer email check failed:", e);
        errors.email = "Could not verify email uniqueness.";
      }
    }
  }
  // Return all found errors.
  return errors;
};

// Validates the form data for a course.
export const validateCourseForm = async (formData, options = {}) => {
    const errors = {};
    const editingId = options.editingId;

    // Validate the course code.
    if (!formData.courseCode?.trim()) { errors.courseCode = "Course code is required."; }
    else {
         // Check for course code uniqueness.
         try {
            const existingByCode = await fetchDocumentsByQuery('courses', 'courseCode', '==', formData.courseCode.trim());
            if (existingByCode.some(doc => doc.id !== editingId)) {
                 errors.courseCode = "Course code already exists.";
            }
         } catch (e) { console.error("Course code check failed:", e); errors.courseCode = "Could not verify code uniqueness."; }
    }

    // Validate required fields.
    if (!formData.courseName?.trim()) errors.courseName = "Course name is required.";
    if (!formData.lecturerId?.trim()) errors.lecturerId = "Lecturer is required.";
    if (!formData.semesterCode?.trim()) errors.semesterCode = "Semester is required.";

    // Validate the weekly time slots.
    if (!Array.isArray(formData.hours) || formData.hours.length === 0) {
        errors.hours = "At least one weekly time slot is required.";
    } else {
        // Loop through each time slot to validate it.
        formData.hours.forEach((slot, index) => {
            if (!slot?.day) { errors[`hours[${index}].day`] = "Day required."; }
            if (!slot?.start) { errors[`hours[${index}].start`] = "Start required."; }
            if (!slot?.end) { errors[`hours[${index}].end`] = "End required."; }
            // Ensure the end time is after the start time.
            if (slot?.start && slot?.end) {
                if (slot.start >= slot.end) { errors[`hours[${index}].end`] = "End must be after start."; }
            }
        });
    }
    // Return all found errors.
    return errors;
};

// Validates the form data for a specific course meeting.
export const validateCourseMeetingForm = async (formData, options = {}) => {
    const errors = {};
    const { parentSemester } = options;

    // Validate the meeting title.
    if (!formData.title?.trim()) {
      errors.title = "Meeting title is required.";
    }
    // Validate the start date and time.
    if (!formData.start) {
      errors.start = "Start date and time are required.";
    } else if (parentSemester) { // If semester info is available, validate the date range.
        try {
            const meetingStartDate = new Date(formData.start);
            // Define the semester's date interval.
            const semesterInterval = {
                start: parseISO(parentSemester.startDate),
                end: parseISO(parentSemester.endDate)
            };
            // Check if the meeting date is within the semester's interval.
            if (!isWithinInterval(meetingStartDate, semesterInterval)) {
                errors.start = `Date must be within semester dates (${parentSemester.startDate} to ${parentSemester.endDate}).`;
            }
        } catch (e) {
            // Handle invalid date formats.
            errors.start = "Invalid date format for validation.";
        }
    }

    // Validate the end date and time.
    if (!formData.end) {
      errors.end = "End date and time are required.";
    }

    // If both start and end times are present, validate them.
    if (formData.start && formData.end) {
        try {
            const startDate = new Date(formData.start);
            const endDate = new Date(formData.end);
            // Check if dates are valid.
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error("Invalid date format detected.");
            }
            // Ensure the end time is after the start time.
            if (startDate >= endDate) {
                errors.end = "End time must be after start time.";
            }
        } catch (e) {
            // Add errors for invalid date formats.
            errors.start = errors.start || "Invalid date format.";
            errors.end = errors.end || "Invalid date format.";
        }
    }

    // Validate required IDs and codes.
    if (!formData.lecturerId) {
      errors.lecturerId = "Lecturer is required.";
    }
    if (!formData.roomCode) {
      errors.roomCode = "Room is required.";
    }
    if (!formData.courseCode?.trim()) {
      errors.courseCode = "Associated course code is required. This should be automatic.";
    }
    
    // Return all found errors.
    return errors;
};

// Validates the form data for a task or assignment.
export const validateTaskForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  // Validate the assignment code.
  if (!formData.assignmentCode?.trim()) { errors.assignmentCode = "Assignment code is required."; }
  else {
       // Check for code uniqueness.
       try {
          const existingByCode = await fetchDocumentsByQuery('tasks', 'assignmentCode', '==', formData.assignmentCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.assignmentCode = "Assignment code already exists."; }
       } catch (e) { console.error("Task code check failed:", e); errors.assignmentCode = "Could not verify code uniqueness."; }
  }

  // Validate required fields.
  if (!formData.assignmentName?.trim()) errors.assignmentName = "Assignment name is required.";
  if (!formData.courseCode?.trim()) errors.courseCode = "Associated course is required.";
  if (!formData.submissionDate?.trim()) errors.submissionDate = "Submission date is required.";
  // Return all found errors.
  return errors;
};

// Validates the form data for a site or campus.
export const validateSiteForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  // Validate the site code.
  if (!formData.siteCode?.trim()) { errors.siteCode = "Site code is required."; }

  // Validate the site name.
  if (!formData.siteName?.trim()) { errors.siteName = "Site name is required."; }
  else {
      // Check for name uniqueness.
      try {
          const existingByName = await fetchDocumentsByQuery('sites', 'siteName', '==', formData.siteName.trim());
          if (existingByName.some(doc => doc.id !== editingId)) { errors.siteName = "Site name already exists."; }
      } catch (e) { console.error("Site name check failed:", e); errors.siteName = "Could not verify name uniqueness."; }
  }
  // Return all found errors.
  return errors;
};

// Validates the form data for a room within a site.
export const validateRoomForm = async (formData, options = {}) => {
    const errors = {};
    const parentSite = options.parentRecord;
    // The ID of the room being edited (null if new).
    const editingId = options.editingId; 

    // Validate the room code for presence and uniqueness within the site.
    if (!formData.roomCode?.trim()) {
        errors.roomCode = "Room code is required.";
    } else if (parentSite?.rooms) {
        // Check if the code is already used by another room in the same site.
        const duplicateCode = parentSite.rooms.some(r =>
             r.roomCode?.trim() === formData.roomCode?.trim() && r.roomCode !== editingId
        );
        if (duplicateCode) {
            errors.roomCode = "Room code already exists in this site.";
        }
    }

    // Validate the room name for presence and uniqueness within the site.
    if (!formData.roomName?.trim()) {
        errors.roomName = "Room name is required.";
    } else if (parentSite?.rooms) {
        // Check if the name is already used by another room in the same site (case-insensitive).
        const duplicateName = parentSite.rooms.some(r =>
             r.roomName?.trim().toLowerCase() === formData.roomName?.trim().toLowerCase() && r.roomCode !== editingId
        );
        if (duplicateName) {
            errors.roomName = "Room name already exists in this site.";
        }
    }

    // Validate that the parent site code is present and correct.
    if (!formData.siteCode?.trim()) {
        errors.siteCode = "Parent site is required.";
    } else if (parentSite && formData.siteCode !== parentSite.siteCode) {
        // This is a consistency check.
        errors.siteCode = "Site code mismatch with parent record.";
    }

    // Return all found errors.
    return errors;
};

// Validates the form data for a holiday.
export const validateHolidayForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  // Validate the holiday code.
  if (!formData.holidayCode?.trim()) { errors.holidayCode = "Holiday code is required."; }
  else {
       // Check for code uniqueness.
       try {
          const existingByCode = await fetchDocumentsByQuery('holidays', 'holidayCode', '==', formData.holidayCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.holidayCode = "Holiday code already exists."; }
       } catch (e) { console.error("Holiday code check failed:", e); errors.holidayCode = "Could not verify code uniqueness."; }
  }

  // Validate the holiday name.
  if (!formData.holidayName?.trim()) errors.holidayName = "Holiday name is required.";
  
  // Use the reusable function to validate date and time fields.
  const dateTimeErrors = validateDateTime(formData);
  // Merge the general errors with the date/time errors.
  return { ...errors, ...dateTimeErrors };
};

// Validates the form data for a vacation period.
export const validateVacationForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  // Validate the vacation code.
  if (!formData.vacationCode?.trim()) { errors.vacationCode = "Vacation code is required."; }
  else {
      // Check for code uniqueness.
      try {
          const existingByCode = await fetchDocumentsByQuery('vacations', 'vacationCode', '==', formData.vacationCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.vacationCode = "Vacation code already exists."; }
       } catch (e) { console.error("Vacation code check failed:", e); errors.vacationCode = "Could not verify code uniqueness."; }
  }

  // Validate the vacation name.
  if (!formData.vacationName?.trim()) errors.vacationName = "Vacation name is required.";

  // Use the reusable function to validate date and time fields.
  const dateTimeErrors = validateDateTime(formData);
  // Merge and return all errors.
  return { ...errors, ...dateTimeErrors };
};

// Validates the form data for a general event.
export const validateEventForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  // Validate the event code.
  if (!formData.eventCode?.trim()) { errors.eventCode = "Event code is required."; }
  else {
       // Check for code uniqueness.
       try {
          const existingByCode = await fetchDocumentsByQuery('events', 'eventCode', '==', formData.eventCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.eventCode = "Event code already exists."; }
       } catch (e) { console.error("Event code check failed:", e); errors.eventCode = "Could not verify code uniqueness."; }
  }

  // Validate the event name.
  if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";

  // Use the reusable function to validate date and time fields.
  const dateTimeErrors = validateDateTime(formData);
  // Merge and return all errors.
  return { ...errors, ...dateTimeErrors };
};

// Validates the form data for a student's personal event.
export const validatePersonalEventForm = async (formData, options = {}) => {
  const errors = {};
  const editingId = options.editingId;

  // Validate the event code.
  if (!formData.eventCode?.trim()) { errors.eventCode = "Event code is required."; }
  else {
      // Check for code uniqueness within student-specific events.
      try {
          const existingByCode = await fetchDocumentsByQuery('studentEvents', 'eventCode', '==', formData.eventCode.trim());
          if (existingByCode.some(doc => doc.id !== editingId)) { errors.eventCode = "Event code already exists."; }
      } catch (e) { console.error("Student event code check failed:", e); errors.eventCode = "Could not verify code uniqueness."; }
  }

  // Validate required fields.
  if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";
  if (!formData.startDate?.trim()) errors.startDate = "Date is required.";
  
  // Determine if it's an all-day event.
  const isAllDayBool = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';

  // If not an all-day event, validate the time fields.
  if (!isAllDayBool) {
      if (!formData.startHour?.trim()) {
          errors.startHour = "Start time is required.";
      }
      if (!formData.endHour?.trim()) {
          errors.endHour = "End time is required.";
      }
      // Ensure end time is after start time.
      if (formData.startHour && formData.endHour && formData.startHour >= formData.endHour) {
          errors.endHour = "End time must be after start time.";
      }
  }
  // Return all found errors.
  return errors;
};


// A central dispatcher function that calls the correct validation function based on the record type.
export const validateFormByType = async (recordType, formData, extra = {}) => {
    // Log which type of form is being validated.
    console.log(`[validateFormByType:Async] Validating type: ${recordType}`);
    // Consolidate all options into a single object.
    const options = {
         ...extra.options,
         editingId: extra.editingId,
         parentRecord: extra.parentRecord
    };

    try {
        // Use a switch statement to call the appropriate validation logic.
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
                // If the record type is unknown, log a warning and return no errors.
                console.warn(`Validation not implemented for type: ${recordType}`);
                return {};
        }
    } catch (error) {
         // Catch any unexpected errors during the validation process.
         console.error(`[validateFormByType:Async] Error during validation for ${recordType}:`, error);
         // Return a generic error message to the user.
         return { _validationError: `Validation failed: ${error.message || 'Unknown error'}` };
    }
};