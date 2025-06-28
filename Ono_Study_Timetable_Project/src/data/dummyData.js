// src/data/dummyData.js

// This file contains a comprehensive set of mock data for various collections in the application.
// This data is essential for development, testing, and populating a local or staging
// database with a realistic and interconnected set of records.

// A helper map for converting day names to their numeric index (Sunday = 0).
export const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Helper functions to generate consistent and formatted IDs for new data.
const generateStudentId = (index) => `${123456780 + index}`.padStart(9, '0');
const generateCourseId = (index) => `CRS${String(1000 + index).padStart(7, '0')}`; // e.g., CRS0001000
const studentUsernamesForGeneration = Array.from({ length: 18 }, (_, i) => `student_${i + 2}`);

// The main data object, structured to mirror the expected Firestore collections.
export const dummyData = {
  // A list of student users, including an admin, a primary test user, and generated students.
  students: [
    { id: "000000001", firstName: "Admin", lastName: "User", email: "admin@example.com", username: "adminuser", password: "admin123", courseCodes: [] },
    { id: "111111111", firstName: "Alice", lastName: "Smith", email: "alice.s@example.com", username: "alice_s", password: "password123", courseCodes: [] },
    // `Array.from` is used to programmatically generate a larger set of test students.
    ...Array.from({ length: 18 }, (_, i) => {
        const index = i + 2;
        return {
            id: generateStudentId(index),
            firstName: `StudentFName${index}`, lastName: `StudentLName${index}`,
            email: `student${index}@example.com`, username: `student_${index}`,
            password: "password123", courseCodes: []
        };
    })
  ],
  // A list of academic years, each containing an array of nested semester objects.
  years: [
    { yearCode: "Y2024", yearNumber: "2024", startDate: "2024-09-01", endDate: "2025-06-30", semesters: [
        { semesterCode: "S24A", semesterNumber: "A", startDate: "2024-10-27", endDate: "2025-02-07" },
        { semesterCode: "S24B", semesterNumber: "B", startDate: "2025-03-02", endDate: "2025-06-20" }
    ]},
    { yearCode: "Y2025", yearNumber: "2025", startDate: "2025-09-01", endDate: "2026-06-30", semesters: [
        { semesterCode: "S25A", semesterNumber: "A", startDate: "2025-10-26", endDate: "2026-02-06" },
        { semesterCode: "S25B", semesterNumber: "B", startDate: "2026-03-01", endDate: "2026-06-19" }
    ]},
    { yearCode: "Y2023", yearNumber: "2023", startDate: "2023-09-01", endDate: "2024-06-30", semesters: [
        { semesterCode: "S23A", semesterNumber: "A", startDate: "2023-10-29", endDate: "2024-02-09" },
        { semesterCode: "S23B", semesterNumber: "B", startDate: "2024-03-03", endDate: "2024-06-21" }
    ]},
    // Procedurally generate future years for robust testing.
    ...Array.from({ length: 17 }, (_, i) => ({
        yearCode: `Y${2026 + i}`, yearNumber: `${2026 + i}`, startDate: `${2026 + i}-09-01`, endDate: `${2027 + i}-06-30`,
        semesters: [
             { semesterCode: `S${26 + i}A`, semesterNumber: "A", startDate: `${2026 + i}-10-20`, endDate: `${2027 + i}-02-01` },
             { semesterCode: `S${26 + i}B`, semesterNumber: "B", startDate: `${2027 + i}-03-01`, endDate: `${2027 + i}-06-15` }
        ]
    }))
  ],
  // A list of lecturers.
  lecturers: [
    { id: "L01", name: "Dr. Evelyn Reed", email: "e.reed@example.edu", phone: "555-1001" },
    { id: "L02", name: "Prof. Ben Carter", email: "b.carter@example.edu", phone: "555-1002" },
    { id: "L03", name: "Dr. Chloe Davis", email: "c.davis@example.edu", phone: "555-1003" },
    ...Array.from({ length: 17 }, (_, i) => ({
        id: `L${String(i + 4).padStart(2, '0')}`,
        name: `Lecturer ${String.fromCharCode(68 + i)} Name`, // Generates names starting with D, E, F...
        email: `lecturer.${String.fromCharCode(97 + i + 3)}@example.edu`, // Generates emails with d, e, f...
        phone: `555-${1004 + i}`
    }))
  ],
  // A list of sites (campuses), each with a nested array of room objects.
  sites: [
    { siteCode: "MAIN", siteName: "Main Campus", notes: "Central administration and humanities.", rooms: [ { roomCode: "MAIN101", roomName: "Room 101", notes: "Standard classroom" }, { roomCode: "MAIN102", roomName: "Room 102", notes: "" }, { roomCode: "MAIN201", roomName: "Seminar Room A", notes: "Projector" } ] },
    { siteCode: "SCI", siteName: "Science Building", notes: "Labs and research facilities.", rooms: [ { roomCode: "SCI-L1", roomName: "Chem Lab 1", notes: "Fume hoods" }, { roomCode: "SCI-L2", roomName: "Bio Lab", notes: "" }, { roomCode: "SCI-210", roomName: "Lecture Hall 210", notes: "" } ] },
    { siteCode: "ARTS", siteName: "Arts Center", notes: "Studios and performance spaces.", rooms: [ { roomCode: "ART-S1", roomName: "Studio 1 (Painting)", notes: "" }, { roomCode: "ART-TH", roomName: "Black Box Theater", notes: "" } ] },
    { siteCode: "LIB", siteName: "Library Building", notes: "", rooms: [ { roomCode: "LIB-G1", roomName: "Group Study 1", notes: "" }, { roomCode: "LIB-CR", roomName: "Computer Room", notes: "" } ] },
    { siteCode: "ENG", siteName: "Engineering Block", notes: "", rooms: [ { roomCode: "ENG-W1", roomName: "Workshop A", notes: "" }, { roomCode: "ENG-305", roomName: "CAD Lab", notes: "" } ] },
    ...Array.from({ length: 15 }, (_, i) => ({
      siteCode: `SITE${i + 6}`, siteName: `Campus ${String.fromCharCode(65 + i)}`, notes: `Notes for Campus ${String.fromCharCode(65 + i)}`,
      rooms: [ { roomCode: `R${i + 6}-1`, roomName: `Room ${i + 6}01`, notes: "" }, { roomCode: `R${i + 6}-2`, roomName: `Room ${i + 6}02`, notes: "" } ]
    }))
  ],
  // A list of course definitions, which reference lecturers, rooms, and semesters by their codes/IDs.
  courses: [
    { courseCode: "CRS0000001", courseName: "Intro to React", roomCode: "MAIN101", lecturerId: "L01", semesterCode: "S25A", notes: "Frontend basics", zoomMeetinglink: "", hours: [ { day: "Mon", start: "09:00", end: "10:30" }, { day: "Wed", start: "12:00", end: "13:30" } ] },
    { courseCode: "CRS0000002", courseName: "Data Structures", roomCode: "SCI-210", lecturerId: "L02", semesterCode: "S25A", notes: "", zoomMeetinglink: "", hours: [ { day: "Tue", start: "11:00", end: "12:30" }, { day: "Thu", start: "14:00", end: "15:30" } ] },
    { courseCode: "CRS0000003", courseName: "Algorithms", roomCode: "SCI-210", lecturerId: "L02", semesterCode: "S25B", notes: "Follow-up to C2", zoomMeetinglink: "", hours: [ { day: "Tue", start: "11:00", end: "12:30" }, { day: "Thu", start: "14:00", end: "15:30" } ] },
    { courseCode: "CRS0000004", courseName: "Database Systems", roomCode: "LIB-CR", lecturerId: "L03", semesterCode: "S25A", notes: "", zoomMeetinglink: "", hours: [ { day: "Fri", start: "10:00", end: "13:00" } ] },
    { courseCode: "CRS0000005", courseName: "Linear Algebra", roomCode: "MAIN102", lecturerId: "L04", semesterCode: "S25A", notes: "", zoomMeetinglink: "", hours: [ { day: "Mon", start: "14:00", end: "15:30" }, { day: "Wed", start: "09:00", end: "10:30" } ] },
    // Procedurally generate more courses, cycling through the available lecturers, rooms, and semesters.
    ...Array.from({ length: 15 }, (_, i) => ({
        courseCode: generateCourseId(i + 6), // Generate ID using helper
        courseName: `Advanced Topic ${i + 1}`,
        roomCode: ["MAIN101", "SCI-L1", "LIB-CR", "ENG-305", "ART-S1"][i % 5],
        lecturerId: `L${String((i % 18) + 3).padStart(2, '0')}`, // Cycle through L03-L20
        semesterCode: (i % 4 < 2) ? "S25A" : "S25B", // Distribute between semesters
        notes: `Course notes ${i + 6}`,
        zoomMeetinglink: `https://zoom.us/j/${generateStudentId(i)}`, // Example zoom link
        hours: [
            { day: ["Mon", "Tue", "Wed", "Thu", "Fri"][i % 5], start: `${9 + (i % 8)}:00`, end: `${10 + (i % 8)}:30` }
        ]
    }))
  ],
  // Public, system-wide holiday events.
  holidays: [
    { holidayCode: "H-NY25", holidayName: "New Year's Day '25", startDate: "2025-01-01", endDate: "2025-01-01", notes: "" },
    { holidayCode: "H-MLK25", holidayName: "MLK Day '25", startDate: "2025-01-20", endDate: "2025-01-20", notes: "" },
    { holidayCode: "H-PRES25", holidayName: "Presidents' Day '25", startDate: "2025-02-17", endDate: "2025-02-17", notes: "" },
    { holidayCode: "H-GOODFRI25", holidayName: "Good Friday '25", startDate: "2025-04-18", endDate: "2025-04-18", notes: "" },
    { holidayCode: "H-EASTER25", holidayName: "Easter Monday '25", startDate: "2025-04-21", endDate: "2025-04-21", notes: "" },
    { holidayCode: "H-MEM25", holidayName: "Memorial Day '25", startDate: "2025-05-26", endDate: "2025-05-26", notes: "" },
    { holidayCode: "H-JUN25", holidayName: "Juneteenth '25", startDate: "2025-06-19", endDate: "2025-06-19", notes: "" },
    { holidayCode: "H-IND25", holidayName: "Independence Day '25", startDate: "2025-07-04", endDate: "2025-07-04", notes: "" },
    { holidayCode: "H-LAB25", holidayName: "Labor Day '25", startDate: "2025-09-01", endDate: "2025-09-01", notes: "" },
    { holidayCode: "H-VET25", holidayName: "Veterans Day '25", startDate: "2025-11-11", endDate: "2025-11-11", notes: "" },
    { holidayCode: "H-THX25", holidayName: "Thanksgiving '25", startDate: "2025-11-27", endDate: "2025-11-28", notes: "Thu & Fri" },
    { holidayCode: "H-XMAS25", holidayName: "Christmas Break '25", startDate: "2025-12-24", endDate: "2025-12-26", notes: "" },
    { holidayCode: "H-NY26", holidayName: "New Year's Day '26", startDate: "2026-01-01", endDate: "2026-01-01", notes: "" },
    { holidayCode: "H-MLK26", holidayName: "MLK Day '26", startDate: "2026-01-19", endDate: "2026-01-19", notes: "" },
    { holidayCode: "H-PRES26", holidayName: "Presidents' Day '26", startDate: "2026-02-16", endDate: "2026-02-16", notes: "" },
    { holidayCode: "H-GOODFRI26", holidayName: "Good Friday '26", startDate: "2026-04-03", endDate: "2026-04-03", notes: "" },
    { holidayCode: "H-EASTER26", holidayName: "Easter Monday '26", startDate: "2026-04-06", endDate: "2026-04-06", notes: "" },
    { holidayCode: "H-MEM26", holidayName: "Memorial Day '26", startDate: "2026-05-25", endDate: "2026-05-25", notes: "" },
    { holidayCode: "H-JUN26", holidayName: "Juneteenth '26", startDate: "2026-06-19", endDate: "2026-06-19", notes: "" },
    { holidayCode: "H-IND26", holidayName: "Independence Day '26", startDate: "2026-07-03", endDate: "2026-07-03", notes: "Observed" }
  ],
  // Public, system-wide vacation periods.
  vacations: [
    { vacationCode: "V-SB25", vacationName: "Spring Break '25", startDate: "2025-03-24", endDate: "2025-03-28", notes: "Week long break" },
    { vacationCode: "V-SUM25", vacationName: "Summer Break '25", startDate: "2025-06-21", endDate: "2025-08-31", notes: "Between Sem B and Year Start" },
    { vacationCode: "V-WIN25", vacationName: "Winter Break '25-'26", startDate: "2025-12-22", endDate: "2026-01-02", notes: "Includes New Year" },
    { vacationCode: "V-SB26", vacationName: "Spring Break '26", startDate: "2026-03-23", endDate: "2026-03-27", notes: "" },
    { vacationCode: "V-SUM26", vacationName: "Summer Break '26", startDate: "2026-06-20", endDate: "2026-08-31", notes: "" },
    { vacationCode: "V-WIN26", vacationName: "Winter Break '26-'27", startDate: "2026-12-21", endDate: "2027-01-01", notes: "" },
    ...Array.from({ length: 14 }, (_, i) => ({
      vacationCode: `V-GEN${i + 7}`, vacationName: `Other Break ${i + 1}`, startDate: `${2027 + i}-07-10`, endDate: `${2027 + i}-07-15`, notes: `Misc vacation ${i+1}`
    }))
  ],
  // Public, general campus events.
  events: [
    { eventCode: "E-HACK25", eventName: "Annual Hackathon", startDate: "2025-04-11", endDate: "2025-04-13", allDay: true, notes: "Teams compete all weekend" },
    { eventCode: "E-JOB25A", eventName: "Job Fair - Fall '25", startDate: "2025-10-15", endDate: "2025-10-15", allDay: false, startHour: "10:00", endHour: "15:00", notes: "Main Hall" },
    { eventCode: "E-JOB26S", eventName: "Job Fair - Spring '26", startDate: "2026-03-18", endDate: "2026-03-18", allDay: false, startHour: "10:00", endHour: "15:00", notes: "Main Hall" },
    { eventCode: "E-CONF25", eventName: "Tech Conference '25", startDate: "2025-11-08", endDate: "2025-11-09", allDay: true, notes: "Guest speakers" },
    { eventCode: "E-OPEN25", eventName: "Open House '25", startDate: "2025-09-20", endDate: "2025-09-20", allDay: false, startHour: "11:00", endHour: "14:00", notes: "Prospective students" },
    { eventCode: "E-GRAD25", eventName: "Graduation '25", startDate: "2025-06-15", endDate: "2025-06-15", allDay: false, startHour: "14:00", endHour: "16:00", notes: "Arena" },
    { eventCode: "E-ALUM25", eventName: "Alumni Homecoming '25", startDate: "2025-10-04", endDate: "2025-10-04", allDay: true, notes: "Football game" },
    { eventCode: "E-ART25", eventName: "Art Exhibit Opening", startDate: "2025-03-15", endDate: "2025-03-15", allDay: false, startHour: "18:00", endHour: "20:00", notes: "Arts Center Gallery" },
    { eventCode: "E-SPORT25", eventName: "Championship Game", startDate: "2025-11-22", endDate: "2025-11-22", allDay: false, startHour: "19:00", endHour: "21:30", notes: "Stadium" },
    { eventCode: "E-MUSIC25", eventName: "Spring Music Concert", startDate: "2025-05-03", endDate: "2025-05-03", allDay: false, startHour: "19:30", endHour: "21:00", notes: "Theater" },
    { eventCode: "E-CLUB25", eventName: "Club Sign-up Day", startDate: "2025-09-10", endDate: "2025-09-10", allDay: false, startHour: "10:00", endHour: "16:00", notes: "Student Union" },
    ...Array.from({ length: 9 }, (_, i) => {
        const month = (8 + i % 3).toString().padStart(2, '0'); // '08', '09', '10'
        const day = (10 + i * 2).toString().padStart(2, '0');   // '10', '12', ... '26'
        const dateStr = `2025-${month}-${day}`;
        return {
            eventCode: `E-GEN${i + 12}`, eventName: `Campus Seminar ${i + 1}`,
            startDate: dateStr, endDate: dateStr,
            allDay: i % 4 === 0, startHour: "13:00", endHour: "14:30", notes: `Seminar details ${i + 1}`
        };
})
  ],
  // A list of tasks (assignments), each linked to a specific course.
  tasks: [
    { assignmentCode: "T1-CRS0000001", assignmentName: "React Component", courseCode: "CRS0000001", submissionDate: "2025-11-10", submissionHour: "23:59", notes: "Build a functional component" },
    { assignmentCode: "T1-CRS0000002", assignmentName: "Linked List Impl.", courseCode: "CRS0000002", submissionDate: "2025-11-15", submissionHour: "17:00", notes: "" },
    { assignmentCode: "T1-CRS0000004", assignmentName: "SQL Queries", courseCode: "CRS0000004", submissionDate: "2025-11-20", submissionHour: "23:59", notes: "Normalization exercise" },
    { assignmentCode: "T1-CRS0000005", assignmentName: "Matrix Operations", courseCode: "CRS0000005", submissionDate: "2025-11-25", submissionHour: "12:00", notes: "Use NumPy if allowed" },
    { assignmentCode: "T2-CRS0000001", assignmentName: "State Management", courseCode: "CRS0000001", submissionDate: "2025-12-01", submissionHour: "23:59", notes: "Context API vs Redux" },
    { assignmentCode: "T2-CRS0000002", assignmentName: "Tree Traversal", courseCode: "CRS0000002", submissionDate: "2025-12-05", submissionHour: "17:00", notes: "" },
    { assignmentCode: "T1-CRS0000007", assignmentName: "Python Basics", courseCode: "CRS0000007", submissionDate: "2025-12-10", submissionHour: "23:59", notes: "Loops and functions" },
    { assignmentCode: "T1-CRS0000003", assignmentName: "Sorting Algorithms", courseCode: "CRS0000003", submissionDate: "2026-03-10", submissionHour: "17:00", notes: "" },
    { assignmentCode: "T1-CRS0000008", assignmentName: "Simple Website", courseCode: "CRS0000008", submissionDate: "2026-03-20", submissionHour: "23:59", notes: "HTML/CSS only" },
    { assignmentCode: "T1-CRS0000009", assignmentName: "Process Scheduling", courseCode: "CRS0000009", submissionDate: "2026-04-01", submissionHour: "23:59", notes: "" },
    ...Array.from({ length: 10 }, (_, i) => {
        const month = (4 + i % 3).toString().padStart(2, '0'); // '04', '05', '06'
        const day = (10 + i).toString().padStart(2, '0');     // '10', '11', ... '19'
        const dateStr = `2026-${month}-${day}`;
        return {
            assignmentCode: `T-GEN${i + 11}`, assignmentName: `Generated Task ${i + 11}`,
            courseCode: generateCourseId(i % 15), submissionDate: dateStr,
            submissionHour: "18:00", notes: `Submit via portal ${i + 11}`
        };
      })
  ],
  // A list of personal events, each linked to a specific student by their `studentId` (username).
  studentEvents: [
    { studentId: "adminuser", eventCode: "SE-ADMIN-1", eventName: "Dentist", startDate: "2025-11-05", allDay: false, startHour: "14:00", endHour: "15:00" },
    { studentId: "alice_s", eventCode: "SE-S1-1", eventName: "Study Group C1", startDate: "2025-11-06", allDay: false, startHour: "18:00", endHour: "20:00" },
    { studentId: "alice_s", eventCode: "SE-S1-2", eventName: "Movie Night", startDate: "2025-11-09", allDay: false, startHour: "20:00", endHour: "22:30" },
    // Procedurally generate more personal events, assigning them to the generated student usernames.
    ...Array.from({ length: 10 }, (_, i) => {
        const day = (20 + i).toString().padStart(2, '0'); // '20', '21', ... '29'
        return {
            studentId: studentUsernamesForGeneration[i % studentUsernamesForGeneration.length], // Cycle through the defined usernames.
            eventCode: `SE-GEN${i + 11}`, eventName: `Personal Errand ${i + 11}`,
            startDate: `2025-11-${day}`, endDate: `2025-11-${day}`,
            allDay: i % 4 === 0, startHour: "11:00", endHour: "11:30", notes: ""
        };
      })
  ]
};