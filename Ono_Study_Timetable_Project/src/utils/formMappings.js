// src/utils/formMappings.js

/**
 * מאגר מרכזי לכל המטא-דאטה של הישויות במערכת.
 * משמש כמקור האמת היחיד עבור handlers, טפסים, וולידציות.
 * המפתח הוא ה-recordType הלוגי.
 */
export const formMappings = {
  // --- User & Personal Entities ---
  student: {
    collectionName: 'students',
    primaryKey: 'id', // Corresponds to Firebase Auth UID
    label: 'Student',
    recordType: 'student',
    initialData: (defaults = {}) => ({
      id: '', // Will be set to UID upon creation
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
      eventCode: '', // Will be generated on save
      eventName: '',
      notes: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      allDay: false,
      startHour: '09:00',
      endHour: '10:00',
      ...defaults,
    }),
  },

  // --- Academic Structure ---
  year: {
    collectionName: 'years',
    primaryKey: 'yearCode',
    label: 'Year',
    recordType: 'year',
    initialData: (defaults = {}) => ({
      yearCode: `YEAR-${Date.now()}`,
      yearNumber: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      semesters: [],
      ...defaults,
    }),
  },
  semester: {
    collectionName: 'years', // Lives inside a 'year' document
    primaryKey: 'semesterCode',
    label: 'Semester',
    recordType: 'semester',
    initialData: (defaults = {}) => ({
      semesterCode: `SEM-${Date.now()}`,
      yearCode: '', // Must be provided
      semesterNumber: '',
      startDate: '',
      endDate: '',
      ...defaults,
    }),
  },

  // --- Core Data Entities ---
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
      hours: [{ day: 1, start: '09:00', end: '12:00' }], // Default to one session
      notes: '',
      zoomMeetinglink: '',
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
      rooms: [],
      ...defaults,
    }),
  },
  room: {
    collectionName: 'sites', // Lives inside a 'site' document
    primaryKey: 'roomCode',
    label: 'Room',
    recordType: 'room',
    initialData: (defaults = {}) => ({
      roomCode: `ROOM-${Date.now()}`,
      siteCode: '', // Must be provided
      roomName: '',
      notes: '',
      ...defaults,
    }),
  },

  // --- General Calendar Events & Tasks ---
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
      courseCode: '', // Must be provided
      submissionDate: new Date().toISOString().slice(0, 10),
      submissionHour: '23:59',
      notes: '',
      type: 'task',
      ...defaults,
    }),
  },
};

/**
 * פונקציית עזר לייצור נתונים התחלתיים עבור טופס של ישות חדשה.
 * @param {string} recordType - סוג הרשומה (למשל, 'course', 'student').
 * @param {object} [defaultValues={}] - ערכים התחלתיים לדריסת ברירת המחדל (למשל, תאריך שנלחץ בלוח שנה).
 * @returns {object} אובייקט עם הנתונים ההתחלתיים לטופס.
 */
export const generateInitialFormData = (recordType, defaultValues = {}) => {
  if (formMappings[recordType] && typeof formMappings[recordType].initialData === 'function') {
    const initialData = formMappings[recordType].initialData(defaultValues);
    console.log(`[generateInitialFormData] Type: ${recordType}, Data:`, initialData);
    return initialData;
  }

  console.warn(`[generateInitialFormData] No mapping or initialData function found for recordType: ${recordType}`);
  return { id: `TEMP-${Date.now()}`, ...defaultValues }; // Fallback
};