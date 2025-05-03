// src/utils/validateForm.js
const isDuplicate = (data, formData, checkField, idField, editingId) => {
  if (!data || !formData || !checkField || !idField) return false;
  const valueToCheck = formData[checkField]?.trim().toLowerCase();
  if (!valueToCheck) return false;
  return data.some(item =>
      item[checkField]?.trim().toLowerCase() === valueToCheck && 
      item[idField] !== editingId
  );
};

export const validateStudentForm = (formData, existingStudents = [], options = {}) => {
  console.log("[validateStudentForm] Validating:", formData);
  console.log("[validateStudentForm] Options:", options);
  const errors = {};
  const editingId = options.editingId;
  if (!formData.id?.trim()) {
      errors.id = "Student ID is required.";
  } else if (isDuplicate(existingStudents, formData, 'id', 'id', editingId)) {
      errors.id = "Student ID already exists.";
  }
  if (!formData.firstName?.trim()) errors.firstName = "First name is required.";
  if (!formData.lastName?.trim()) errors.lastName = "Last name is required.";
  if (!formData.email?.trim()) {
      errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = "Invalid email address format.";
  } else if (isDuplicate(existingStudents, formData, 'email', 'id', editingId)) {
      errors.email = "Email address already in use.";
  }
  if (!formData.username?.trim()) {
      errors.username = "Username is required.";
  } else if (formData.username.trim().length < 6) {
      errors.username = "Username must be at least 6 characters.";
  } else if (isDuplicate(existingStudents, formData, 'username', 'id', editingId)) {
      errors.username = "Username already exists.";
  }
  if (formData.phone && formData.phone.trim()) {
    if (!/^\d{10}$/.test(formData.phone.trim())) errors.phone = "Invalid phone number format (e.g., 10 digits)."
  }
  if (!options?.skipPassword) {
      if (!formData.password) {
          errors.password = "Password is required.";
      } else if (formData.password.length < 6) {
          errors.password = "Password must be at least 6 characters.";
      }
      if (!errors.password) {
          if (!formData.confirmPassword) {
              errors.confirmPassword = "Please confirm your password.";
          } else if (formData.password !== formData.confirmPassword) {
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
const editingId = extra.editingId;
if (!formData.yearNumber?.trim()) {
  errors.yearNumber = "Year number is required.";
} else if (isDuplicate(existingYears, formData, 'yearNumber', 'yearCode', editingId)) {
   errors.yearNumber = "Year number already exists.";
}
 if (!formData.yearCode?.trim()) {
   errors.yearCode = "Year code is required.";
 } else if (isDuplicate(existingYears, formData, 'yearCode', 'yearCode', editingId)) {
    errors.yearCode = "Year code already exists.";
 }
if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
  errors.endDate = "End date must be on or after start date.";
}

return errors;
};

export const validateSemesterForm = (formData, existingSemesters = [], extra = {}) => {
  const errors = {};
  const yearRecord = extra.yearRecord;
  const editingId = extra.editingId;
  if (!formData.semesterNumber?.trim()) {
      errors.semesterNumber = "Semester number is required.";
  } else {
       const duplicate = (existingSemesters || []).some(s =>
            s.semesterNumber?.trim() === formData.semesterNumber?.trim() &&
            s.semesterCode !== editingId
       );
       if (duplicate) {
           errors.semesterNumber = "Semester number already exists in this year.";
       }
  }
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
  if (!formData.startDate?.trim()) errors.startDate = "Semester start date is required.";
  if (!formData.endDate?.trim()) errors.endDate = "Semester end date is required.";
  if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.startDate = "Start date must be on or before end date.";
  }
  if (yearRecord && formData.startDate && formData.endDate) {
      if (formData.startDate < yearRecord.startDate || formData.endDate > yearRecord.endDate) {
          errors.startDate = errors.startDate || `Dates must be within the year range (${yearRecord.startDate} - ${yearRecord.endDate}).`; // Append if no other error
          errors.endDate = errors.endDate || `Dates must be within the year range (${yearRecord.startDate} - ${yearRecord.endDate}).`;
      }
  } else if (!yearRecord) {
       console.warn("validateSemesterForm: Year record context missing for date range check.");
  }
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
if (!formData.id?.trim()) {
   errors.id = "Lecturer ID is required.";
} else if (isDuplicate(existingLecturers, formData, 'id', 'id', editingId)) {
    errors.id = "Lecturer ID already exists.";
}
if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
  errors.email = "Invalid email format.";
} else if (formData.email && isDuplicate(existingLecturers, formData, 'email', 'id', editingId)) {
    errors.email = "Email already registered to another lecturer.";
}

return errors;
};
export const validateCourseForm = (formData, existingCourses = [], extra = {}) => {
  console.log("[validateCourseForm] Validating:", formData);
  const errors = {};
  const editingId = extra.editingId;
  if (!formData.courseCode?.trim()) {
      errors.courseCode = "Course code is required.";
  } else if (isDuplicate(existingCourses, formData, 'courseCode', 'courseCode', editingId)) {
      errors.courseCode = "Course code already exists.";
  }
  if (!formData.courseName?.trim()) errors.courseName = "Course name is required.";
  if (!formData.lecturerId?.trim()) errors.lecturerId = "Lecturer is required.";
  if (!formData.semesterCode?.trim()) errors.semesterCode = "Semester is required.";
  if (!Array.isArray(formData.hours) || formData.hours.length === 0) {
      errors.hours = "At least one weekly time slot is required.";
  } else {
      const daysUsed = new Set();
      formData.hours.forEach((slot, index) => {
          let slotHasError = false;
          if (!slot?.day) {
              errors[`hours[${index}].day`] = "Day is required.";
              slotHasError = true;
          }
          if (!slot?.start) {
               errors[`hours[${index}].start`] = "Start time is required.";
               slotHasError = true;
          }
          if (!slot?.end) {
               errors[`hours[${index}].end`] = "End time is required.";
               slotHasError = true;
          }
          if (slot?.start && slot?.end && !slotHasError) {
              if (slot.start >= slot.end) {
                   errors[`hours[${index}].end`] = "End time must be after start time.";
                   slotHasError = true;
              }
          }
          if (slot?.day && !slotHasError) {
              if (daysUsed.has(slot.day)) {
                  errors[`hours[${index}].day`] = `Day '${slot.day}' is already scheduled for this course.`;
                  slotHasError = true;
              } else {
                  daysUsed.add(slot.day);
              }
          }
           if (slot?.day && slot?.start && slot?.end && !slotHasError) {
               const overlap = formData.hours.some((otherSlot, otherIndex) => {
                    if (index === otherIndex || otherSlot.day !== slot.day || !otherSlot.start || !otherSlot.end) {
                         return false;
                    }
                    return slot.start < otherSlot.end && slot.end > otherSlot.start;
               });
               if (overlap) {
                    errors[`hours[${index}].start`] = "Time slot overlaps with another slot on the same day.";
                    errors[`hours[${index}].end`] = "Time slot overlaps with another slot on the same day.";
               }
           }

      }); 
  }
  console.log("[validateCourseForm] Validation Errors:", errors);
  return errors;
};

export const validateCourseMeetingForm = (formData, existingMeetings = [], extra = {}) => {
  const errors = {};
  const editingId = extra.editingId;
   if (!formData.id?.trim()) errors.id = "Meeting ID is required.";
   else if (isDuplicate(existingMeetings, formData, 'id', 'id', editingId)) {
        errors.id = "Meeting ID conflict.";
   }
  if (!formData.courseCode?.trim()) errors.courseCode = "Associated course code is required.";
  if (!formData.date?.trim()) errors.date = "Date is required.";
  if (!formData.startHour?.trim()) errors.startHour = "Start time is required.";
  if (!formData.endHour?.trim()) errors.endHour = "End time is required.";
  if (formData.startHour && formData.endHour && formData.startHour >= formData.endHour) {
      errors.endHour = "End time must be after start time.";
  }
  return errors;
};
export const validateTaskForm = (formData, existingTasks = [], extra = {}) => {
const errors = {};
 const editingId = extra.editingId;

  if (!formData.assignmentCode?.trim()) {
       errors.assignmentCode = "Assignment code is required.";
  } else if (isDuplicate(existingTasks, formData, 'assignmentCode', 'assignmentCode', editingId)) {
       errors.assignmentCode = "Assignment code already exists.";
  }
if (!formData.assignmentName?.trim()) errors.assignmentName = "Assignment name is required.";
if (!formData.courseCode?.trim()) errors.courseCode = "Associated course is required.";
if (!formData.submissionDate?.trim()) errors.submissionDate = "Submission date is required.";
return errors;
};

export const validateSiteForm = (formData, existingSites = [], extra = {}) => {
const errors = {};
 const editingId = extra.editingId;
  if (!formData.siteCode?.trim()) {
      errors.siteCode = "Site code is required.";
  } else if (isDuplicate(existingSites, formData, 'siteCode', 'siteCode', editingId)) {
      errors.siteCode = "Site code already exists.";
  }

if (!formData.siteName?.trim()) {
     errors.siteName = "Site name is required.";
} else if (isDuplicate(existingSites, formData, 'siteName', 'siteCode', editingId)) {
}
return errors;
};
export const validateRoomForm = (formData, existingRooms = [], extra = {}) => {
  const errors = {};
  const editingId = extra.editingId;
  const siteRecord = extra.siteRecord;

  if (!formData.roomCode?.trim()) {
      errors.roomCode = "Room code is required.";
  } else {
       const duplicateCode = (existingRooms || []).some(r =>
            r.roomCode?.trim() === formData.roomCode?.trim() &&
            r.roomCode !== editingId
       );
       if (duplicateCode) {
           errors.roomCode = "Room code already exists in this site.";
       }
  }


  if (!formData.roomName?.trim()) {
      errors.roomName = "Room name is required.";
  } else {
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
const editingId = extra.editingId;
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
const editingId = extra.editingId;
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
 const editingId = extra.editingId;

  if (!formData.eventCode?.trim()) {
      errors.eventCode = "Event code is required.";
  } else if (isDuplicate(existingEvents, formData, 'eventCode', 'eventCode', editingId)) {
       errors.eventCode = "Event code already exists.";
  }
if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";
if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
 if (formData.allDay && !formData.endDate?.trim()) {
     errors.endDate = "End date is required for all-day events spanning multiple days.";
 } else if (!formData.allDay && !formData.endDate?.trim() && formData.startHour && formData.endHour) {
 }
const isAllDay = formData.allDay === true || String(formData.allDay).toLowerCase() === 'true';
if (!isAllDay) {
  if (!formData.startHour?.trim()) errors.startHour = "Start time is required.";
  if (!formData.endHour?.trim()) errors.endHour = "End time is required.";
  if (formData.startHour && formData.endHour) {
      const effectiveEndDate = formData.endDate || formData.startDate;
      if (formData.startDate && effectiveEndDate && formData.startDate > effectiveEndDate) {
           errors.endDate = errors.endDate || "End date cannot be before start date.";
      } else if (formData.startDate === effectiveEndDate && formData.startHour >= formData.endHour) {
          errors.endHour = "End time must be after start time on the same day.";
      }  }
} else {
     if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
         errors.endDate = "End date must be on or after start date.";
     }
}
return errors;
};
export const validatePersonalEventForm = (formData, existingEvents = [], extra = {}) => {
  const errors = {};
  const editingId = extra.editingId;
  const { eventName, startDate, startHour, endHour, allDay, eventCode } = formData;
  if (!eventName?.trim()) errors.eventName = "Event name is required.";
  if (!startDate?.trim()) errors.startDate = "Date is required.";
   if (!eventCode?.trim()) {
       errors.eventCode = "Event code is missing.";
   } else if (isDuplicate(existingEvents, formData, 'eventCode', 'eventCode', editingId)) {
        errors.eventCode = "Event code conflict detected.";
   }
  const isAllDayBool = allDay === true || String(allDay).toLowerCase() === 'true';
  if (!isAllDayBool) {
      if (!startHour?.trim()) errors.startHour = "Start time is required.";
      if (!endHour?.trim()) errors.endHour = "End time is required.";
      if (startHour && endHour && startHour >= endHour) {
          errors.endHour = "End time must be after start time.";
      }
  }
  return errors;
};
export const validateFormByType = (recordType, formData, extra = {}) => {
  const entityKey = getEntityKeyByRecordType(recordType);
   let existingData = [];
   if (entityKey && extra[`existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]) {
       existingData = extra[`existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`];
   } else if (recordType === 'semester' && extra.existingSemesters) {
        existingData = extra.existingSemesters;
   } else if (recordType === 'room' && extra.existingRooms) {
        existingData = extra.existingRooms;
   }
  console.log(`[validateFormByType] Validating type: ${recordType}, existingData count: ${existingData?.length}, extra keys:`, Object.keys(extra));
  switch (recordType) {
      case "student":       return validateStudentForm(formData, existingData, extra.options || extra);
      case "year":          return validateYearForm(formData, existingData, extra);
      case "semester":      return validateSemesterForm(formData, extra.existingSemesters || [], extra);
      case "lecturer":      return validateLecturerForm(formData, existingData, extra);
      case "course":        return validateCourseForm(formData, existingData, extra);
      case "courseMeeting": return validateCourseMeetingForm(formData, existingData, extra);
      case "task":          return validateTaskForm(formData, existingData, extra);
      case "site":          return validateSiteForm(formData, existingData, extra);
      case "room":          return validateRoomForm(formData, extra.existingRooms || [], extra);
      case "holiday":       return validateHolidayForm(formData, existingData, extra);
      case "vacation":      return validateVacationForm(formData, existingData, extra);
      case "event":         return validateEventForm(formData, existingData, extra);
      case "studentEvent":  return validatePersonalEventForm(formData, existingData, extra);
      default:
          console.warn(`Validation not implemented for type: ${recordType}`);
          return {};
  }
};
const getEntityKeyByRecordType = (recordType) => {
   const map = { year: "years", semester: "years", lecturer: "lecturers", course: "courses", courseMeeting: "coursesMeetings", task: "tasks", site: "sites", room: "rooms", holiday: "holidays", vacation: "vacations", event: "events", studentEvent: "studentEvents"};
  return map[recordType] || null;
};