// utils/validateForm.js

export const validateStudentForm = (formData, existingStudents = [], options = {}) => {
  const errors = {};

  if (!formData.id) {
    errors.id = "ID is required";
  } else if (existingStudents.some((s) => s.id === formData.id)) {
    errors.id = "ID already exists";
  }

  if (!formData.firstName?.trim()) {
    errors.firstName = "First name is required";
  }

  if (!formData.lastName?.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
    errors.email = "Invalid email address";
  }

  if (!formData.username) {
    errors.username = "Username is required";
  } else if (formData.username.length < 6) {
    errors.username = "Username must be at least 6 characters";
  }

  if (!options.skipPassword) {
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  return errors;
};

export const validateYearForm = (formData, existingYears = []) => {
  const errors = {};

  if (!formData.yearNumber?.trim()) {
    errors.yearNumber = "Year number is required.";
  } else {
    const yearCode = `Y${formData.yearNumber.trim()}`; // generate yearCode for check
    if (existingYears.some((year) => year.yearCode === yearCode)) {
      errors.yearNumber = "Year number already exists.";
    }
  }
  if (!formData.startDate?.trim()) {
    errors.startDate = "Start date is required.";
  }
  if (!formData.endDate?.trim()) {
    errors.endDate = "End date is required.";
  }
  if (formData.startDate && formData.endDate) {
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = "End date must be after start date.";
    }
  }
  return errors;
};

export const validateSemesterForm = (formData, existingSemesters = [], yearRecord = null) => {
  const errors = {};
  if (!formData.semesterNumber?.trim()) errors.semesterNumber = "Semester number is required.";
  if (!formData.yearCode?.trim()) errors.yearCode = "Year code is required.";
  if (!formData.startDate) errors.startDate = "Semester start date is required.";
  if (!formData.endDate) errors.endDate = "Semester end date is required.";
  if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
    errors.startDate = "Start date must be before end date.";
    errors.endDate = "End date must be after start date.";
  }
  //  Check duplicate semester number under the same year
  const duplicate = existingSemesters.find(
    (sem) => sem.semesterNumber === formData.semesterNumber && sem.yearCode === formData.yearCode
  );
  if (duplicate) {
    errors.semesterNumber = `Semester ${formData.semesterNumber} already exists for the selected year.`;
  }
  //  Validate inside selected year range
  if (yearRecord) {
    if (formData.startDate < yearRecord.startDate || formData.endDate > yearRecord.endDate) {
      errors.startDate = `Semester must be inside year period (${yearRecord.startDate} to ${yearRecord.endDate}).`;
      errors.endDate = `Semester must be inside year period (${yearRecord.startDate} to ${yearRecord.endDate}).`;
    }
  }
  return errors;
};

export const validateLecturerForm = (formData, existingLecturers = []) => {
  const errors = {};
  if (!formData.name?.trim()) {
    errors.name = "Lecturer name is required.";
  } else {
    const nameExists = existingLecturers.some(
      (lec) => lec.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
    );
    if (nameExists) {
      errors.name = "Lecturer name already exists.";
    }
  }
  return errors;
};


export const validateCourseForm = (formData) => {
  const errors = {};
  if (!formData.courseCode?.trim()) errors.courseCode = "Course code is required.";
  if (!formData.courseName?.trim()) errors.courseName = "Course name is required.";
  if (!formData.lecturerId?.trim()) errors.lecturerId = "Lecturer is required.";
  if (!formData.semesterCode?.trim()) errors.semesterCode = "Semester is required.";
  return errors;
};

export const validateTaskForm = (formData) => {
  const errors = {};
  if (!formData.assignmentCode?.trim()) errors.assignmentCode = "Assignment code is required.";
  if (!formData.assignmentName?.trim()) errors.assignmentName = "Assignment name is required.";
  if (!formData.courseCode?.trim()) errors.courseCode = "Course is required.";
  return errors;
};

export const validateHolidayForm = (formData) => {
  const errors = {};
  if (!formData.holidayCode?.trim()) errors.holidayCode = "Holiday code is required.";
  if (!formData.holidayName?.trim()) errors.holidayName = "Holiday name is required.";
  if (!formData.date?.trim()) errors.date = "Holiday date is required.";
  return errors;
};

export const validateVacationForm = (formData) => {
  const errors = {};
  if (!formData.vacationCode?.trim()) errors.vacationCode = "Vacation code is required.";
  if (!formData.vacationName?.trim()) errors.vacationName = "Vacation name is required.";
  if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
  if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
  return errors;
};

export const validateRoomForm = (formData) => {
  const errors = {};
  if (!formData.roomCode?.trim()) errors.roomCode = "Room code is required.";
  if (!formData.roomName?.trim()) errors.roomName = "Room name is required.";
  if (!formData.siteCode?.trim()) errors.siteCode = "Site is required.";
  return errors;
};

export const validateSiteForm = (formData) => {
  const errors = {};
  if (!formData.siteCode?.trim()) errors.siteCode = "Site code is required.";
  if (!formData.siteName?.trim()) errors.siteName = "Site name is required.";
  return errors;
};

export const validateEventForm = (formData) => {
  const errors = {};
  if (!formData.eventCode?.trim()) errors.eventCode = "Event code is required.";
  if (!formData.eventName?.trim()) errors.eventName = "Event name is required.";
  if (!formData.startDate?.trim()) errors.startDate = "Start date is required.";
  if (!formData.endDate?.trim()) errors.endDate = "End date is required.";
  return errors;
};

export const validateOnlineClassForm = (formData) => {
  const errors = {};
  if (!formData.courseCode?.trim()) errors.courseCode = "Course is required.";
  if (!formData.date?.trim()) errors.date = "Date is required.";
  if (!formData.hourCode?.trim()) errors.hourCode = "Hour is required.";
  if (formData.isOnline && !formData.link?.trim()) errors.link = "Link is required for online sessions.";
  return errors;
};

export const validatePersonalEventForm = (formData, existingEvents = []) => {
  const errors = {};
  const { title, date, startTime, endTime } = formData;

  if (!title?.trim()) errors.title = "Title is required.";
  if (!date?.trim()) errors.date = "Date is required.";
  if (!startTime?.trim()) errors.startTime = "Start time is required.";
  if (!endTime?.trim()) errors.endTime = "End time is required.";

  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);

  if (start >= end) {
    errors.endTime = "End time must be after start time.";
  }

  // Check for overlaps
  const overlap = existingEvents.some((ev) => {
    if (ev.date !== date || ev.title === title) return false;

    const evStart = new Date(`${ev.date}T${ev.startTime}`);
    const evEnd = new Date(`${ev.date}T${ev.endTime}`);

    return (start < evEnd && end > evStart);
  });

  if (overlap) {
    errors.startTime = "This time overlaps with an existing event.";
    errors.endTime = "This time overlaps with an existing event.";
  }

  return errors;
};


