// src/utils/formMappings.js

// This file is a central configuration object that acts as a "single source of truth"
// for the metadata of every data entity in the application (e.g., student, course, semester).
// This mapping is crucial for enabling the generic management components (modals, handlers)
// to work with different types of data without needing large switch statements or duplicated logic.

export const formMappings = {
  // Each key in this object represents a `recordType`.
  student: {
    collectionName: 'students',      // The name of the Firestore collection where this entity is stored.
    primaryKey: 'id',                // The name of the field that serves as the unique identifier.
    label: 'Student',                // A user-friendly label for this entity type.
    recordType: 'student',           // The unique type identifier for this entity.
    // A function that returns a default "empty" object for creating a new record of this type.
    // It can accept `defaults` to pre-populate fields (e.g., from a calendar click).
    initialData: (defaults = {}) => ({
      id: '',
      studentIdCard: '',
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      phone: '',
      password: '',
      confirmPassword: '',
      courseCodes: [],
      eventCodes: [],
      ...defaults,
    }),
  },
  studentEvent: {
    collectionName: 'studentEvents',
    primaryKey: 'eventCode',
    label: 'Personal Event',
    recordType: 'studentEvent',
    initialData: (defaults = {}) => ({
      eventCode: '',
      eventName: '',
      notes: '',
      startDate: new Date().toISOString().slice(0, 10), // Defaults to today's date.
      endDate: new Date().toISOString().slice(0, 10),
      allDay: false,
      startHour: '09:00',
      endHour: '10:00',
      ...defaults,
    }),
  },
  year: {
    collectionName: 'years',
    primaryKey: 'yearCode',
    label: 'Year',
    recordType: 'year',
    initialData: (defaults = {}) => ({
      yearCode: `YEAR-${Date.now()}`, // Provides a default, temporary unique ID.
      yearNumber: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      semesters: [], // An array to hold nested semester objects.
      ...defaults,
    }),
  },
  // Note that `semester` and `room` are "nested" entities. They are stored inside
  // their parent documents ('years' and 'sites') but are managed as distinct record types.
  semester: {
    collectionName: 'years', // The collection of the PARENT document.
    primaryKey: 'semesterCode',
    label: 'Semester',
    recordType: 'semester',
    initialData: (defaults = {}) => ({
      semesterCode: `SEM-${Date.now()}`,
      yearCode: '', // The ID of the parent year.
      semesterNumber: '',
      startDate: '',
      endDate: '',
      ...defaults,
    }),
  },
  course: {
    collectionName: 'courses',
    primaryKey: 'courseCode',
    label: 'Course',
    recordType: 'course',
    initialData: (defaults = {}) => ({
      courseCode: `C-${Date.now()}`,
      courseName: '',
      semesterCode: '',
      lecturerId: '',
      roomCode: '',
      hours: [{ day: '', start: '09:00', end: '12:00' }], // Starts with one default time slot.
      notes: '',
      zoomMeetinglink: '',
      ...defaults,
    }),
  },
  courseMeeting: {
    collectionName: 'coursesMeetings',
    primaryKey: 'id',
    label: 'Course Meeting',
    recordType: 'courseMeeting',
    initialData: (defaults = {}) => ({
      id: `CM-${Date.now()}`,
      title: '',
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      lecturerId: '',
      roomCode: '',
      courseCode: '',
      semesterCode: '',
      notes: '',
      zoomMeetinglink: '',
      type: 'courseMeeting', // Explicitly sets the event type.
      allDay: false,
      ...defaults,
    }),
  },
  lecturer: {
    collectionName: 'lecturers',
    primaryKey: 'id',
    label: 'Lecturer',
    recordType: 'lecturer',
    initialData: (defaults = {}) => ({
      id: `L-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      ...defaults,
    }),
  },
  site: {
    collectionName: 'sites',
    primaryKey: 'siteCode',
    label: 'Site',
    recordType: 'site',
    initialData: (defaults = {}) => ({
      siteCode: `SITE-${Date.now()}`,
      siteName: '',
      notes: '',
      rooms: [], // An array to hold nested room objects.
      ...defaults,
    }),
  },
  room: {
    collectionName: 'sites', // The collection of the PARENT document.
    primaryKey: 'roomCode',
    label: 'Room',
    recordType: 'room',
    initialData: (defaults = {}) => ({
      roomCode: `ROOM-${Date.now()}`,
      siteCode: '', // The ID of the parent site.
      roomName: '',
      notes: '',
      ...defaults,
    }),
  },
  holiday: {
    collectionName: 'holidays',
    primaryKey: 'holidayCode',
    label: 'Holiday',
    recordType: 'holiday',
    initialData: (defaults = {}) => ({
      holidayCode: `HOL-${Date.now()}`,
      holidayName: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      notes: '',
      type: 'holiday',
      allDay: true, // Holidays typically default to being all-day events.
      ...defaults,
    }),
  },
  vacation: {
    collectionName: 'vacations',
    primaryKey: 'vacationCode',
    label: 'Vacation',
    recordType: 'vacation',
    initialData: (defaults = {}) => ({
      vacationCode: `VAC-${Date.now()}`,
      vacationName: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      notes: '',
      type: 'vacation',
      allDay: true, // Vacations are also typically all-day events.
      ...defaults,
    }),
  },
  event: {
    collectionName: 'events',
    primaryKey: 'eventCode',
    label: 'General Event',
    recordType: 'event',
    initialData: (defaults = {}) => ({
      eventCode: `EVT-${Date.now()}`,
      eventName: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      allDay: false,
      startHour: '09:00',
      endHour: '10:00',
      notes: '',
      type: 'event',
      ...defaults,
    }),
  },
  task: {
    collectionName: 'tasks',
    primaryKey: 'assignmentCode',
    label: 'Task',
    recordType: 'task',
    initialData: (defaults = {}) => ({
      assignmentCode: `TASK-${Date.now()}`,
      assignmentName: '',
      courseCode: '',
      submissionDate: new Date().toISOString().slice(0, 10),
      submissionHour: '23:59', // A common default for assignment deadlines.
      notes: '',
      type: 'task',
      ...defaults,
    }),
  },
};

/**
 * A helper function that uses the mapping to dynamically generate a blank
 * data object for any given record type.
 * @param {string} recordType - The type of record (e.g., 'course', 'student').
 * @param {object} [defaultValues={}] - An object with any values to override the defaults.
 * @returns {object} A blank data object ready to be used in a form.
 */
export const generateInitialFormData = (recordType, defaultValues = {}) => {
  // Check if a mapping exists for the requested type.
  if (formMappings[recordType] && typeof formMappings[recordType].initialData === 'function') {
    const initialData = formMappings[recordType].initialData(defaultValues);
    console.log(`[generateInitialFormData] Type: ${recordType}, Data:`, initialData);
    return initialData;
  }

  // If no mapping is found, log a warning and return a generic object.
  console.warn(`[generateInitialFormData] No mapping or initialData function found for recordType: ${recordType}`);
  return { id: `TEMP-${Date.now()}`, ...defaultValues };
};