// src/utils/formMappings.js

export const entityKeyMap = {
    year: "years",
    semester: "years",
    lecturer: "lecturers",
    course: "courses",
    courseMeeting: "coursesMeetings",
    task: "tasks",
    site: "sites",
    room: "sites",
    holiday: "holidays",
    vacation: "vacations",
    event: "events",
};
export const recordTypeLabels = {
    year: "Year",
    semester: "Semester",
    lecturer: "Lecturer",
    course: "Course Definition",
    courseMeeting: "Specific Course Meeting",
    task: "Task",
    site: "Site",
    room: "Room",
    holiday: "Holiday",
    vacation: "Vacation",
    event: "General Event",
};

export const primaryKeyFieldMap = {
    year: "yearCode",
    semester: "semesterCode",
    lecturer: "id",
    course: "courseCode",
    courseMeeting: "id",
    task: "assignmentCode",
    site: "siteCode",
    room: "roomCode",
    holiday: "holidayCode",
    vacation: "vacationCode",
    event: "eventCode",
};
export const getEntityKeyByRecordType = (recordType) => {
    return entityKeyMap[recordType] || null;
};
export const getPrimaryKeyFieldByRecordType = (recordType) => {
    return primaryKeyFieldMap[recordType] || null;
}
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
    switch (recordType) {
        case "year":
            initialData = { ...initialData, yearNumber: "", startDate: dateStr, endDate: "" };
            break;
        case "semester":
            initialData = { ...initialData, semesterNumber: "", yearCode: "", startDate: dateStr, endDate: "" };
            break;
        case "lecturer":
            initialData = { ...initialData, name: "", email: "", phone: "" };
            break;
        case "courseMeeting":
             initialData = { ...initialData, type: 'courseMeeting', courseCode: "", courseName: "", date: dateStr, startHour: "09:00", endHour: "10:00", roomCode: "", lecturerId: "", notes: "" };
            break;
        case "task":
            initialData = { ...initialData, assignmentName: "", courseCode: "", submissionDate: dateStr, submissionHour: "23:59", notes: "" };
            break;
        case "site":
            initialData = { ...initialData, siteName: "", notes: "" };
            break;
        case "room":
            initialData = { ...initialData, roomName: "", siteCode: "", notes: "" };
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
    }
    console.log(`[generateInitialFormData] Type: ${recordType}, Initial Data:`, initialData);
    return initialData;
};