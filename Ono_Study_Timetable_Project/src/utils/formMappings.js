// src/utils/formMappings.js

// Map from the recordType used in the UI/Modals to the actual entityKey used in storage/handlers
export const entityKeyMap = {
    year: "years",
    semester: "years", // Nested
    lecturer: "lecturers",
    course: "courses", // Represents the Course Definition
    courseMeeting: "coursesMeetings", // Represents a single meeting instance
    task: "tasks",
    site: "sites",
    room: "sites", // Nested
    holiday: "holidays",
    vacation: "vacations",
    event: "events", // General public event
};

// Map to display labels used in the AddModal dropdown
export const recordTypeLabels = {
    year: "Year",
    semester: "Semester",
    lecturer: "Lecturer",
    course: "Course Definition", // Managed via dedicated modal (future)
    courseMeeting: "Specific Course Meeting", // Single instance, managed via generic modals
    task: "Task",
    site: "Site",
    room: "Room",
    holiday: "Holiday",
    vacation: "Vacation",
    event: "General Event",
};

// Map from recordType to the name of its primary key field
// MUST align with `matchKeyMap` in `formHandlers.js`
export const primaryKeyFieldMap = {
    year: "yearCode",
    semester: "semesterCode",
    lecturer: "id",
    course: "courseCode",
    courseMeeting: "id", // Assuming the generated meeting in coursesMeetings has a unique 'id'
    task: "assignmentCode",
    site: "siteCode",
    room: "roomCode",
    holiday: "holidayCode",
    vacation: "vacationCode",
    event: "eventCode",
};

// Function to get the correct storage key
export const getEntityKeyByRecordType = (recordType) => {
    return entityKeyMap[recordType] || null;
};

// Function to get the primary key field name
export const getPrimaryKeyFieldByRecordType = (recordType) => {
    return primaryKeyFieldMap[recordType] || null;
}

// Generate initial form data structure for the ADD modal
export const generateInitialFormData = (recordType, defaultDate = null) => {
    const timestamp = Date.now();
    const dateStr = defaultDate ? new Date(defaultDate).toISOString().slice(0, 10) : "";
    let initialData = {};
    const primaryKeyField = getPrimaryKeyFieldByRecordType(recordType);

    if (primaryKeyField) {
      initialData[primaryKeyField] = `${recordType.toUpperCase()}-TEMP-${timestamp}`;
    } else {
        initialData.id = `TEMP-${timestamp}`;
        console.warn(`Primary key not defined for type ${recordType} in primaryKeyFieldMap`);
    }

    // Add other common fields based on type (for the ADD modal)
    switch (recordType) {
        case "year":
            initialData = { ...initialData, yearNumber: "", startDate: dateStr, endDate: "" };
            break;
        case "semester":
            initialData = { ...initialData, semesterNumber: "", yearCode: "", startDate: dateStr, endDate: "" }; // Needs year selection in form
            break;
        case "lecturer":
            initialData = { ...initialData, name: "", email: "", phone: "" };
            break;
        // 'course' definition is handled by dedicated modal, not generated here
        case "courseMeeting": // For adding a single ad-hoc meeting manually
             initialData = { ...initialData, type: 'courseMeeting', courseCode: "", courseName: "", date: dateStr, startHour: "09:00", endHour: "10:00", roomCode: "", lecturerId: "", notes: "" }; // Needs course selection etc. in form
            break;
        case "task":
            initialData = { ...initialData, assignmentName: "", courseCode: "", submissionDate: dateStr, submissionHour: "23:59", notes: "" }; // Needs course selection
            break;
        case "site":
            initialData = { ...initialData, siteName: "", notes: "" };
            break;
        case "room":
            initialData = { ...initialData, roomName: "", siteCode: "", notes: "" }; // Needs site selection
            break;
        case "holiday":
            initialData = { ...initialData, holidayName: "", startDate: dateStr, endDate: dateStr, notes: "" };
            break;
        case "vacation":
            initialData = { ...initialData, vacationName: "", startDate: dateStr, endDate: dateStr, notes: "" };
            break;
        case "event":
            initialData = { ...initialData, eventName: "", startDate: dateStr, endDate: dateStr, allDay: false, startHour: "09:00", endHour: "10:00", notes: "" };
            break;
        // No default case needed
    }
    // console.log(`[generateInitialFormData] Type: ${recordType}, Initial Data:`, initialData);
    return initialData;
};