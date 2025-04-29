// src/utils/seedData.js
import { hashPassword } from "./hash";

//  1. Define dummyData first
const dummyData = {
  students: [
    {
      id: "admin1",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      username: "adminuser",
      password: "admin123", // will be hashed
    },
    {
      id: "stud1",
      firstName: "Student",
      lastName: "One",
      email: "student1@example.com",
      username: "student1",
      password: "student123", // will be hashed
    },
  ],
  years: [
    { yearCode: "Y1", label: "Year 1", yearNumber: "1", startDate: "2025-09-01", endDate: "2026-06-30" },
    { yearCode: "Y2", label: "Year 2", yearNumber: "2", startDate: "2026-09-01", endDate: "2027-06-30" },
  ],
  semesters: [
    { semesterCode: "S1", semesterNumber: "1", yearCode: "Y1", startDate: "2025-01-01", endDate: "2025-06-30" },
    { semesterCode: "S2", semesterNumber: "2", yearCode: "Y1", startDate: "2025-07-01", endDate: "2025-12-31" },
  ],
  lecturers: [
    { id: "L1", name: "Dr. Smith" },
    { id: "L2", name: "Prof. Jane" },
  ],
  courses: [
    { courseCode: "C1", courseName: "Intro to React", lecturerId: "L1", semesterCode: "S1" },
    { courseCode: "C2", courseName: "Data Structures", lecturerId: "L2", semesterCode: "S2" },
  ],
  rooms: [
    { roomCode: "R1", roomName: "Room 101", siteCode: "S1" },
    { roomCode: "R2", roomName: "Room 202", siteCode: "S1" },
  ],
  sites: [
    { siteCode: "S1", siteName: "Main Campus" },
  ],
  holidays: [
    { holidayCode: "H1", holidayName: "New Year's Day", date: "2025-01-01" },
  ],
  vacations: [
    {
      vacationCode: "V1",
      vacationName: "Summer Break",
      startDate: "2025-07-01",
      endDate: "2025-08-31",
    },
  ],
  events: [
    {
      eventCode: "E1",
      eventName: "Hackathon",
      startDate: "2025-05-10",
      endDate: "2025-05-12",
    },
  ],
  tasks: [
    {
      assignmentCode: "T1",
      assignmentName: "Final Project",
      courseCode: "C1",
    },
  ],
};

//
// 2. Define seedLocalStorage
//
export const seedLocalStorage = async (force = false) => {
  // Hash passwords for students
  const hashedStudents = await Promise.all(
    dummyData.students.map(async (student) => {
      const hashed = await hashPassword(student.password);
      return { ...student, password: hashed };
    })
  );

  // Store students
  if (force || !localStorage.getItem("students")) {
    localStorage.setItem("students", JSON.stringify(hashedStudents));
  }

  // Store other entities (years, semesters, lecturers, courses, etc.)
  Object.entries(dummyData).forEach(([key, value]) => {
    if (key === "students") return; // already handled
    const existing = localStorage.getItem(key);
    if (!existing || force) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });

  //
  // Create allEvents
  //
  const studentEvents = JSON.parse(localStorage.getItem("studentEvents") || "[]");

  const events = (dummyData.events || []).map((e) => ({
    id: e.eventCode,
    title: e.eventName,
    type: "event",
    start: new Date(`${e.startDate}T08:00`),
    end: new Date(`${e.endDate}T16:00`),
    allDay: true,
  }));

  const holidays = (dummyData.holidays || []).map((h) => ({
    id: h.holidayCode,
    title: h.holidayName,
    type: "holiday",
    start: new Date(`${h.date}T00:00`),
    end: new Date(`${h.date}T23:59`),
    allDay: true,
  }));

  const vacations = (dummyData.vacations || []).map((v) => ({
    id: v.vacationCode,
    title: v.vacationName,
    type: "vacation",
    start: new Date(`${v.startDate}T00:00`),
    end: new Date(`${v.endDate}T23:59`),
    allDay: true,
  }));

  const years = (dummyData.years || []).flatMap((y, index) => ([
    {
      id: `year-start-${index}`,
      title: `Year ${y.yearNumber} Start`,
      type: "year",
      start: new Date(`${y.startDate}T00:00`),
      end: new Date(`${y.startDate}T23:59`),
      allDay: true,
    },
    {
      id: `year-end-${index}`,
      title: `Year ${y.yearNumber} End`,
      type: "year",
      start: new Date(`${y.endDate}T00:00`),
      end: new Date(`${y.endDate}T23:59`),
      allDay: true,
    }
  ]));

  const semesters = (dummyData.semesters || []).flatMap((s, index) => ([
    {
      id: `semester-start-${index}`,
      title: `Semester ${s.semesterNumber} Start`,
      type: "semester",
      start: new Date(`${s.startDate}T00:00`),
      end: new Date(`${s.startDate}T23:59`),
      allDay: true,
    },
    {
      id: `semester-end-${index}`,
      title: `Semester ${s.semesterNumber} End`,
      type: "semester",
      start: new Date(`${s.endDate}T00:00`),
      end: new Date(`${s.endDate}T23:59`),
      allDay: true,
    }
  ]));

  const allEvents = [
    ...studentEvents,
    ...events,
    ...holidays,
    ...vacations,
    ...years,
    ...semesters,
  ];

  localStorage.setItem("allEvents", JSON.stringify(allEvents));
};

//
// 3. Define resetAndSeedLocalStorage
//
export const resetAndSeedLocalStorage = async () => {
  localStorage.clear();
  await seedLocalStorage(true);
};

//
// 4. Expose to window (for easy dev tools testing)
//
window.seedLocalStorage = seedLocalStorage;
window.resetAndSeedLocalStorage = resetAndSeedLocalStorage;
