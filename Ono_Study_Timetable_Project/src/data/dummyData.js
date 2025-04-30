export const dummyData = {
  students: [
    {
      id: "admin1",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      username: "adminuser",
      password: "admin123",
      courseCodes: ["C1", "C2"], // 🔥 Admin enrolled to all
    },
    {
      id: "stud1",
      firstName: "Student",
      lastName: "One",
      email: "student1@example.com",
      username: "student1",
      password: "student123",
      courseCodes: ["C1"], // 🔥 Student enrolled only to "Intro to React"
    },
  ],
  years: [
    {
      yearCode: "Y1",
      yearNumber: "1",
      startDate: "2025-04-01",
      endDate: "2025-04-30",
      semesters: [
        {
          semesterCode: "S1",
          semesterNumber: "1",
          startDate: "2025-04-01",
          endDate: "2025-04-28",
        },
        {
          semesterCode: "S2",
          semesterNumber: "2",
          startDate: "2025-07-01",
          endDate: "2025-12-31",
        },
      ],
    },
    {
      yearCode: "Y2",
      yearNumber: "2",
      startDate: "2026-09-01",
      endDate: "2027-06-30",
      semesters: [],
    },
  ],
  lecturers: [
    { id: "L1", name: "Dr. Smith" },
    { id: "L2", name: "Prof. Jane" },
  ],
  sites: [
    {
      siteCode: "S1",
      siteName: "Main Campus",
      notes: "",
      rooms: [
        { roomCode: "R1", roomName: "Room 101", notes: "" },
        { roomCode: "R2", roomName: "Room 202", notes: "" },
      ],
    },
    {
      siteCode: "S2",
      siteName: "Sciences Campus",
      notes: "",
      rooms: [
        { roomCode: "R3", roomName: "Room 101", notes: "" },
        { roomCode: "R4", roomName: "Room 202", notes: "" },
      ],
    },
  ],
  courses: [
    {
      courseCode: "C1",
      courseName: "Intro to React",
      roomCode: "R1",
      lecturerId: "L1",
      semesterCode: "S1",
      notes: "",
      zoomMeetinglink: "",
      weekDays: ["Mon", "Wed"],
      hours: [
        { day: "Mon", start: "09:00", end: "10:30" },
        { day: "Wed", start: "12:00", end: "13:30" }
      ]
    },
    {
      courseCode: "C2",
      courseName: "Data Structures",
      roomCode: "R2",
      lecturerId: "L2",
      semesterCode: "S2",
      notes: "",
      zoomMeetinglink: "",
      weekDays: ["Tue"],
      hours: [
        { day: "Tue", start: "11:00", end: "12:30" }
      ]
    },
  ],
  holidays: [
    {
      holidayCode: "H1",
      holidayName: "New Year's Day",
      notes: "",
      startDate: "2026-09-01",
      endDate: "2027-06-30",
    },
    {
      holidayCode: "H2",
      holidayName: "New HaHa Day",
      notes: "",
      startDate: "2025-04-28",
      endDate: "2025-04-28",
    },
  ],
  vacations: [
    {
      vacationCode: "V1",
      vacationName: "Summer Break",
      notes: "",
      startDate: "2025-07-01",
      endDate: "2025-08-31",
    },
  ],
  events: [
    {
      eventCode: "E1",
      eventName: "Hackathon",
      notes: "",
      startDate: "2025-05-10",
      endDate: "2025-05-12",
      allDay: true,
      startHour: "00:00",
      endHour: "00:00",
    },
    {
      eventCode: "E2",
      eventName: "Memorial Day",
      notes: "",
      startDate: "2025-04-30",
      endDate: "2025-04-30",
      allDay: true,
      startHour: "00:00",
      endHour: "00:00",
    },
    {
      eventCode: "E3",
      eventName: "Memorial Day Evening",
      notes: "",
      startDate: "2025-04-29",
      endDate: "2025-04-29",
      allDay: false,
      startHour: "16:00",
      endHour: "23:59",
    },
  ],
  tasks: [
    {
      assignmentCode: "T2",
      assignmentName: "Project 1 task",
      courseCode: "C1",
      notes: "",
      submissionDate: "2025-04-27",
      submissionHour: "09:00",
    },
  ],
  coursesMeetings: [
    {
      courseCode: "C1",
      courseName: "Intro to React",
      roomCode: "R1",
      lecturerId: "L1",
      semesterCode: "S1",
      notes: "",
      zoomMeetinglink: "",
      weekDays: ["Mon", "Wed"],
      hours: [
        { day: "Mon", start: "09:00", end: "10:30" },
        { day: "Wed", start: "12:00", end: "13:30" }
      ]
    },
    {
      courseCode: "C2",
      courseName: "Data Structures",
      roomCode: "R2",
      lecturerId: "L2",
      semesterCode: "S2",
      notes: "",
      zoomMeetinglink: "",
      weekDays: ["Tue"],
      hours: [
        { day: "Tue", start: "11:00", end: "12:30" }
      ]
    },
  ],
  coursesMeetings: [ 
    // EACH item here is a SINGLE date instance for the course
    {
      id: "C1-2025-04-07",
      courseCode: "C1",
      courseName: "Intro to React",
      date: "2025-04-07",
      startHour: "09:00",
      endHour: "10:30",
      roomCode: "R1",
      lecturerId: "L1",
      semesterCode: "S1",
      notes: "",
      zoomMeetinglink: ""
    },
    {
      id: "C1-2025-04-09",
      courseCode: "C1",
      courseName: "Intro to React",
      date: "2025-04-09",
      startHour: "12:00",
      endHour: "13:30",
      roomCode: "R1",
      lecturerId: "L1",
      semesterCode: "S1",
      notes: "",
      zoomMeetinglink: ""
    },
    {
      id: "C2-2025-07-02",
      courseCode: "C2",
      courseName: "Data Structures",
      date: "2025-07-02",
      startHour: "11:00",
      endHour: "12:30",
      roomCode: "R2",
      lecturerId: "L2",
      semesterCode: "S2",
      notes: "",
      zoomMeetinglink: ""
    },
    // More meetings...
  ],
  studentEvents: []
};

  export const dayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };