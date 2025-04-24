// src/utils/seedData.js

const dummyData = {
    users: [
      {
        id: "stu001",
        firstName: "Alice",
        lastName: "Doe",
        email: "alice@example.com",
        username: "alice01",
        password: "hashed_password_1", // you can use real hashed values if needed
      },
      {
        id: "stu002",
        firstName: "Bob",
        lastName: "Smith",
        email: "bob@example.com",
        username: "bobsmith",
        password: "hashed_password_2",
      },
    ],
  
    years: [
      { code: "Y1", label: "Year A", yearNumber: "1" },
      { code: "Y2", label: "Year B", yearNumber: "2" },
    ],
  
    semesters: [
      { semesterCode: "S1", semesterNumber: "1", yearCode: "Y1" },
      { semesterCode: "S2", semesterNumber: "2", yearCode: "Y2" },
    ],
  
    lecturers: [
      { id: "L1", name: "Dr. Smith" },
      { id: "L2", name: "Prof. Johnson" },
    ],
  
    courses: [
      { courseCode: "C1", courseName: "Intro to Programming", lecturerId: "L1", semesterCode: "S1" },
      { courseCode: "C2", courseName: "Algorithms", lecturerId: "L2", semesterCode: "S2" },
    ],
  
    tasks: [
      { assignmentCode: "T1", assignmentName: "Homework 1", courseCode: "C1" },
      { assignmentCode: "T2", assignmentName: "Final Project", courseCode: "C2" },
    ],
  
    rooms: [
      { roomCode: "R1", roomName: "Room A", siteCode: "ST1" },
      { roomCode: "R2", roomName: "Room B", siteCode: "ST2" },
    ],
  
    sites: [
      { siteCode: "ST1", siteName: "Main Campus" },
      { siteCode: "ST2", siteName: "Tech Park" },
    ],
  
    onlineClasses: [
      {
        courseCode: "C1",
        date: "2025-06-01",
        hourCode: "H1",
        isOnline: true,
        link: "https://zoom.us/class-c1",
      },
    ],
  
    personalEvents: [
      {
        title: "Study Session",
        date: "2025-06-03",
        startTime: "14:00",
        endTime: "16:00",
        description: "Group study with peers",
      },
    ],
  };
  
  export const seedLocalStorage = () => {
    Object.entries(dummyData).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  };
  