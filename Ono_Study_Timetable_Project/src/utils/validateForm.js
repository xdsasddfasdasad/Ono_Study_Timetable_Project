// src/utils/validateForm.js

// --- Helper for uniqueness check (ignoring self during edit) ---
// data: the array of existing records (e.g., existingYears)
// formData: the current form data being validated
// checkField: the field to check for uniqueness (e.g., 'yearNumber')
// idField: the primary key field of the entity (e.g., 'yearCode')
// editingId: the ID of the record being edited (passed in extra), null/undefined if adding
const isDuplicate = (data, formData, checkField, idField, editingId) => {
  if (!data || !formData || !checkField || !idField) return false;
  const valueToCheck = formData[checkField]?.trim().toLowerCase();
  if (!valueToCheck) return false; // Don't check empty values for duplication

  return data.some(item =>
      item[checkField]?.trim().toLowerCase() === valueToCheck && // Found a match
      item[idField] !== editingId // And it's not the record currently being edited
  );
};


// --- Specific Validation Functions (Updated with uniqueness) ---

export const validateStudentForm = (formData, existingStudents = [], options = {}) => {
  console.log("[validateStudentForm] Validating:", formData);
  console.log("[validateStudentForm] Options:", options);
  const errors = {};
  const editingId = options.editingId; // ID of the student being edited, null if adding
  const isEditMode = !!editingId;

  // --- ID Validation ---
  // Required (especially in Add), must be unique
  if (!formData.id?.trim()) {
      errors.id = "Student ID is required.";
  } else if (isDuplicate(existingStudents, formData, 'id', 'id', editingId)) {
      errors.id = "Student ID already exists.";
  }
  // Optional: Add format validation for ID if needed (e.g., must be numeric)
  // else if (!/^\d+$/.test(formData.id.trim())) { errors.id = "ID must be numeric."; }

  // --- Name Validation ---
  if (!formData.firstName?.trim()) errors.firstName = "First name is required.";
  if (!formData.lastName?.trim()) errors.lastName = "Last name is required.";

  // --- Email Validation ---
  if (!formData.email?.trim()) {
      errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) { // Added trim()
      errors.email = "Invalid email address format.";
  } else if (isDuplicate(existingStudents, formData, 'email', 'id', editingId)) {
      errors.email = "Email address already in use.";
  }

  // --- Username Validation ---
  if (!formData.username?.trim()) {
      errors.username = "Username is required.";
  } else if (formData.username.trim().length < 6) {
      errors.username = "Username must be at least 6 characters.";
  } else if (isDuplicate(existingStudents, formData, 'username', 'id', editingId)) {
      errors.username = "Username already exists.";
  }

  // --- Phone Validation (Optional) ---
  if (formData.phone && formData.phone.trim()) { // Validate only if provided
      // Add specific phone format validation if needed
      // Example: if (!/^\d{10}$/.test(formData.phone.trim())) errors.phone = "Invalid phone number format (e.g., 10 digits)."
  }

  // --- Password Validation ---
  // Check passwords only if NOT explicitly skipping (i.e., adding, or editing AND providing a new password)
  if (!options?.skipPassword) {
      // Password Field
      if (!formData.password) { // Check existence first
          errors.password = "Password is required.";
      } else if (formData.password.length < 6) {
          errors.password = "Password must be at least 6 characters.";
      }

      // Confirm Password Field (Only if password seems okay so far)
      if (!errors.password) { // Only validate confirm if password field itself passed basic checks
          if (!formData.confirmPassword) { // Check existence of confirmPassword
               // This check is crucial - ensure the field exists AND has value
              errors.confirmPassword = "Please confirm your password.";
          } else if (formData.password !== formData.confirmPassword) {
               // Comparison happens only if confirmPassword was provided
              errors.confirmPassword = "Passwords do not match.";
          }
      }
  } else {
       console.log("[validateStudentForm] Skipping password validation as requested.");
  }

  console.log("[validateStudentForm] Validation Errors:", errors);
  return errors;
};

export const validateYearForm = (formData, existingYears = [], extra = {}) => {
const errors = {};
const editingId = extra.editingId; // Get editing ID from extra

// Year Number Checks
if (!formData.yearNumber?.trim()) {
  errors.yearNumber = "Year number is required.";
} else if (isDuplicate(existingYears, formData, 'yearNumber', 'yearCode', editingId)) {
   errors.yearNumber = "Year number already exists.";
}

 // Year Code Checks (Optional - assuming yearCode might be auto-generated or user needs to ensure uniqueness if manual)
 if (!formData.yearCode?.trim()) {
   errors.yearCode = "Year code is required."; // Add if required
 } else if (isDuplicate(existingYears, formData, 'yearCode', 'yearCode', editingId)) {
    errors.yearCode = "Year code already exists.";
 }


// Date Checks
if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
  errors.endDate = "End date must be on or after start date."; // Allow same day
}

return errors;
};

export const validateSemesterForm = (formData, existingSemesters = [], extra = {}) => {
  const errors = {};
  const yearRecord = extra.yearRecord; // Parent year context
  const editingId = extra.editingId; // The semesterCode being edited

  // Semester Number Checks
  if (!formData.semesterNumber?.trim()) {
      errors.semesterNumber = "Semester number is required.";
  } else {
       // Check uniqueness *within the existing semesters of this specific year*
       const duplicate = (existingSemesters || []).some(s =>
            s.semesterNumber?.trim() === formData.semesterNumber?.trim() &&
            s.semesterCode !== editingId // Ignore self
       );
       if (duplicate) {
           errors.semesterNumber = "Semester number already exists in this year.";
       }
  }

  // Semester Code Checks (assuming it needs validation)
  if (!formData.semesterCode?.trim()) {
      errors.semesterCode = "Semester code is required.";
  } else {
       const duplicateCode = (existingSemesters || []).some(s =>
            s.semesterCode?.trim() === formData.semesterCode?.trim() &&
            s.semesterCode !== editingId
       );
       if (duplicateCode) {
           errors.semesterCode = "Semester code already exists in this year.";
       }
  }


  // Date Checks
  if (!formData.startDate?.trim()) errors.startDate = "Semester start date is required.";
  if (!formData.endDate?.trim()) errors.endDate = "Semester end date is required.";
  if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.startDate = "Start date must be on or before end date.";
  }

  // Date Range within Year Check
  if (yearRecord && formData.startDate && formData.endDate) {
      if (formData.startDate < yearRecord.startDate || formData.endDate > yearRecord.endDate) {
          errors.startDate = errors.startDate || `Dates must be within the year range (${yearRecord.startDate} - ${yearRecord.endDate}).`; // Append if no other error
          errors.endDate = errors.endDate || `Dates must be within the year range (${yearRecord.startDate} - ${yearRecord.endDate}).`;
      }
  } else if (!yearRecord) {
       // This shouldn't happen if handler provides yearRecord, but good to note
       console.warn("validateSemesterForm: Year record context missing for date range check.");
  }

   // Check yearCode existence
   if (!formData.yearCode?.trim()) errors.yearCode = "Parent year code is required.";


  return errors;
};

export const validateLecturerForm = (formData, existingLecturers = [], extra = {}) => {
const errors = {};
const editingId = extra.editingId;

if (!formData.name?.trim()) {
  errors.name = "Lecturer name is required.";
} else if (isDuplicate(existingLecturers, formData, 'name', 'id', editingId)) {
   errors.name = "Lecturer name already exists.";
}

// Validate ID (if it's meaningful and needs uniqueness)
if (!formData.id?.trim()) {
   errors.id = "Lecturer ID is required.";
} else if (isDuplicate(existingLecturers, formData, 'id', 'id', editingId)) {
    errors.id = "Lecturer ID already exists.";
}


// Optional: Validate email format/uniqueness if present
if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
  errors.email = "Invalid email format.";
} else if (formData.email && isDuplicate(existingLecturers, formData, 'email', 'id', editingId)) {
    errors.email = "Email already registered to another lecturer.";
}

return errors;
};

export const validateCourseForm = (formData, existingCourses = [], extra = {}) => {
  const errors = {};
  const editingId = extra.editingId; // courseCode

  if (!formData.courseCode?.trim()) {
      errors.courseCode = "Course code is required.";
  } else if (isDuplicate(existingCourses, formData, 'courseCode', 'courseCode', editingId)) {
       errors.courseCode = "Course code already exists.";
  }

  if (!formData.courseName?.trim()) errors.courseName = "Course name is required.";
  if (!formData.lecturerId?.trim()) errors.lecturerId = "Lecturer is required.";
  if (!formData.semesterCode?.trim()) errors.semesterCode = "Semester is required.";
  // Add checks for existence of lecturerId, semesterCode if needed (requires more 'extra' data)
  // Add basic validation for hours array if form handles it (e.g., at least one entry)
  if (!Array.isArray(formData.hours) || formData.hours.length === 0) {
     // errors.hours = "At least one time slot is required."; // Or handle in specific course modal
  } else {
      // Basic check within hours
      formData.hours.forEach((slot, index) => {
           if (!slot.day) errors[`hours[${index}].day`] = "Day is required.";
           if (!slot.start) errors[`hours[${index}].start`] = "Start time is required.";
           if (!slot.end) errors[`hours[${index}].end`] = "End time is required.";
           if (slot.start && slot.end && slot.start >= slot.end) {
                errors[`hours[${index}].end`] = "End time must be after start time.";
           }
      });
  }


  return errors;
};

// ✅ ADDED: Validation for a single Course Meeting
export const validateCourseMeetingForm = (formData, existingMeetings = [], extra = {}) => {
  const errors = {};
  const editingId = extra.editingId; // The 'id' of the specific meeting

   if (!formData.id?.trim()) errors.id = "Meeting ID is required."; // Should be generated
   else if (isDuplicate(existingMeetings, formData, 'id', 'id', editingId)) {
        errors.id = "Meeting ID conflict."; // Less likely if generated well
   }

  if (!formData.courseCode?.trim()) errors.courseCode = "Associated course code is required.";
  if (!formData.date?.trim()) errors.date = "Date is required.";
  if (!formData.startHour?.trim()) errors.startHour = "Start time is required.";
  if (!formData.endHour?.trim()) errors.endHour = "End time is required.";

  if (formData.startHour && formData.endHour && formData.startHour >= formData.endHour) {
      errors.endHour = "End time must be after start time.";
  }

   // Optional: Check for conflicts with other meetings/events at the same time/room/lecturer
   // This would require passing more context in 'extra' and complex logic.


  return errors;
};


export const validateTaskForm = (formData, existingTasks = [], extra = {}) => {
const errors = {};
 const editingId = extra.editingId; // assignmentCode

  if (!formData.assignmentCode?.trim()) {
       errors.assignmentCode = "Assignment code is required.";
  } else if (isDuplicate(existingTasks, formData, 'assignmentCode', 'assignmentCode', editingId)) {
       errors.assignmentCode = "Assignment code already exists.";
  }

if (!formData.assignmentName?.trim()) errors.assignmentName = "Assignment name is required.";
if (!formData.courseCode?.trim()) errors.courseCode = "Associated course is required.";
if (!formData.submissionDate?.trim()) errors.submissionDate = "Submission date is required.";
// Optional: validate submissionHour format if present

return errors;
};

export const validateSiteForm = (formData, existingSites = [], extra = {}) => {
const errors = {};
 const editingId = extra.editingId; // siteCode

  if (!formData.siteCode?.trim()) {
      errors.siteCode = "Site code is required.";
  } else if (isDuplicate(existingSites, formData, 'siteCode', 'siteCode', editingId)) {
      errors.siteCode = "Site code already exists.";
  }

if (!formData.siteName?.trim()) {
     errors.siteName = "Site name is required.";
} else if (isDuplicate(existingSites, formData, 'siteName', 'siteCode', editingId)) {
      // Optional: Check for duplicate names too
      // errors.siteName = "Site name already exists.";
}

return errors;
};

export const validateRoomForm = (formData, existingRooms = [], extra = {}) => {
  const errors = {};
  const editingId = extra.editingId; // roomCode
  const siteRecord = extra.siteRecord; // Parent site context

  if (!formData.roomCode?.trim()) {
      errors.roomCode = "Room code is required.";
  } else {
      // Check uniqueness *within the existing rooms of this specific site*
       const duplicateCode = (existingRooms || []).some(r =>
            r.roomCode?.trim() === formData.roomCode?.trim() &&
            r.roomCode !== editingId // Ignore self
       );
       if (duplicateCode) {
           errors.roomCode = "Room code already exists in this site.";
       }
  }


  if (!formData.roomName?.trim()) {
      errors.roomName = "Room name is required.";
  } else {
       // Optional: check name uniqueness within site
       const duplicateName = (existingRooms || []).some(r =>
            r.roomName?.trim().toLowerCase() === formData.roomName?.trim().toLowerCase() &&
            r.roomCode !== editingId
       );
       if (duplicateName) {
            errors.roomName = "Room name already exists in this site.";
       }
  }


  if (!formData.siteCode?.trim()) errors.siteCode = "Parent site code is required.";

  return errors;
};

export const validateHolidayForm = (formData, existingHolidays = [], extra = {}) => {
const errors = {};
const editingId = extra.editingId; // holidayCode

 if (!formData.holidayCode?.trim()) {
     errors.holidayCode = "Holiday code is required.";
 } else if (isDuplicate(existingHolidays, formData, 'holidayCode', 'holidayCode', editingId)) {
      errors.holidayCode = "Holiday code already exists.";
 }

if (!formData.holidayName?.trim()) errors.holidayName = "Holiday name is required.";
if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
  errors.endDate = "End date must be on or after start date.";
}
return errors;
};

export const validateVacationForm = (formData, existingVacations = [], extra = {}) => {
const errors = {};
const editingId = extra.editingId; // vacationCode

 if (!formData.vacationCode?.trim()) {
     errors.vacationCode = "Vacation code is required.";
 } else if (isDuplicate(existingVacations, formData, 'vacationCode', 'vacationCode', editingId)) {
      errors.vacationCode = "Vacation code already exists.";
 }

if (!formData.vacationName?.trim()) errors.vacationName = "Vacation name is required.";
if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
 if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
     errors.endDate = "End date must be on or after start date.";
 }

return errors;
};

export const validateEventForm = (formData, existingEvents = [], extra = {}) => {
const errors = {};
 const editingId = extra.editingId; // eventCode

  if (!formData.eventCode?.trim()) {
      errors.eventCode = "Event code is required.";
  } else if (isDuplicate(existingEvents, formData, 'eventCode', 'eventCode', editingId)) {
       errors.eventCode = "Event code already exists.";
  }

if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";
if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
// End date might be optional for single-day non-allDay events if start/end hour define duration
 if (formData.allDay && !formData.endDate?.trim()) {
     errors.endDate = "End date is required for all-day events spanning multiple days."; // Or default it to startDate if single day
 } else if (!formData.allDay && !formData.endDate?.trim() && formData.startHour && formData.endHour) {
      // If timed, endDate might default to startDate, but let's require it for clarity if provided range
      // Allow flexibility here maybe?
 }


// Time validation only if not allDay
const isAllDay = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';
if (!isAllDay) {
  if (!formData.startHour?.trim()) errors.startHour = "Start time is required.";
  if (!formData.endHour?.trim()) errors.endHour = "End time is required.";
  if (formData.startHour && formData.endHour) {
      const effectiveEndDate = formData.endDate || formData.startDate; // Use startDate if endDate is missing for timed
      if (formData.startDate && effectiveEndDate && formData.startDate > effectiveEndDate) {
           errors.endDate = errors.endDate || "End date cannot be before start date.";
      } else if (formData.startDate === effectiveEndDate && formData.startHour >= formData.endHour) {
          // Only check time order if dates are the same
          errors.endHour = "End time must be after start time on the same day.";
      }
      // Note: Cross-day time validation (e.g., 10 PM to 2 AM next day) is not handled here.
  }
} else {
     // For All Day events, ensure end date is not before start date
     if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
         errors.endDate = "End date must be on or after start date.";
     }
}

return errors;
};

// Personal event validation (seems okay, uses eventCode)
export const validatePersonalEventForm = (formData, existingEvents = [], extra = {}) => {
  const errors = {};
  const editingId = extra.editingId; // eventCode of the event being edited
  const { eventName, startDate, startHour, endHour, allDay, eventCode } = formData;

  if (!eventName?.trim()) errors.eventName = "Event name is required.";
  if (!startDate?.trim()) errors.startDate = "Date is required.";

  // ID check
   if (!eventCode?.trim()) {
       errors.eventCode = "Event code is missing."; // Should be generated if adding
   } else if (isDuplicate(existingEvents, formData, 'eventCode', 'eventCode', editingId)) {
        errors.eventCode = "Event code conflict detected."; // Less likely
   }


  const isAllDayBool = allDay === true || String(allDay).toLowerCase() === 'true';
  if (!isAllDayBool) {
      if (!startHour?.trim()) errors.startHour = "Start time is required.";
      if (!endHour?.trim()) errors.endHour = "End time is required.";
      if (startHour && endHour && startHour >= endHour) {
          errors.endHour = "End time must be after start time.";
      }
  }
  // Overlap check remains commented out - okay for now.
  // console.log("Personal Event Validation Errors:", errors);
  return errors;
};


// --- Central Dynamic Validation by Type ---
export const validateFormByType = (recordType, formData, extra = {}) => {
  // Ensure extra contains existing records for the specific type for uniqueness checks
  const entityKey = getEntityKeyByRecordType(recordType); // Get storage key
   let existingData = [];
   if (entityKey && extra[`existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]) {
       existingData = extra[`existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`];
   } else if (recordType === 'semester' && extra.existingSemesters) {
        existingData = extra.existingSemesters; // Special handling from handler
   } else if (recordType === 'room' && extra.existingRooms) {
        existingData = extra.existingRooms; // Special handling from handler
   }


  console.log(`[validateFormByType] Validating type: ${recordType}, existingData count: ${existingData?.length}, extra keys:`, Object.keys(extra));


  switch (recordType) {
      case "student":       return validateStudentForm(formData, existingData, extra.options || extra); // Pass editingId via options/extra
      case "year":          return validateYearForm(formData, existingData, extra);
      case "semester":      return validateSemesterForm(formData, extra.existingSemesters || [], extra); // Uses specific extra fields
      case "lecturer":      return validateLecturerForm(formData, existingData, extra);
      case "course":        return validateCourseForm(formData, existingData, extra);
      case "courseMeeting": return validateCourseMeetingForm(formData, existingData, extra); // ✅ Added
      case "task":          return validateTaskForm(formData, existingData, extra);
      case "site":          return validateSiteForm(formData, existingData, extra);
      case "room":          return validateRoomForm(formData, extra.existingRooms || [], extra); // Uses specific extra fields
      case "holiday":       return validateHolidayForm(formData, existingData, extra);
      case "vacation":      return validateVacationForm(formData, existingData, extra);
      case "event":         return validateEventForm(formData, existingData, extra);
      case "studentEvent":  return validatePersonalEventForm(formData, existingData, extra);
      default:
          console.warn(`Validation not implemented for type: ${recordType}`);
          return {};
  }
};


// Helper to get entity key - needed within this file for the central dispatcher
// (Duplicated from formMappings for self-containment, or import it)
const getEntityKeyByRecordType = (recordType) => {
   const map = { year: "years", semester: "years", lecturer: "lecturers", course: "courses", courseMeeting: "coursesMeetings", task: "tasks", site: "sites", room: "rooms", holiday: "holidays", vacation: "vacations", event: "events", studentEvent: "studentEvents"};
  return map[recordType] || null;
};