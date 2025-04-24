const dummyData = {
    users: [
      {
        id: "admin1",
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        username: "adminuser",
        password: "hashedPassword1",
      },
      {
        id: "stud1",
        firstName: "Student",
        lastName: "One",
        email: "student1@example.com",
        username: "student1",
        password: "hashedPassword2",
      },
    ],
    years: [
      { code: "Y1", label: "Year A" },
      { code: "Y2", label: "Year B" },
    ],
    semesters: [
      { semesterCode: "S1", semesterNumber: "1", yearCode: "Y1" },
      { semesterCode: "S2", semesterNumber: "2", yearCode: "Y2" },
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
  
  export const seedLocalStorage = (force = false) => {
    Object.entries(dummyData).forEach(([key, value]) => {
      const existing = localStorage.getItem(key);
      if (!existing || force) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
    // Prepare allEvents list for calendar
    const studentEvents = JSON.parse(localStorage.getItem("studentEvents") || "[]");
    const events = (dummyData.events || []).map(e => ({
      ...e,
      title: e.eventName,
      type: "event",
      start: new Date(`${e.startDate || e.date}T08:00`),
      end: new Date(`${e.endDate || e.date}T16:00`),
    }));

    const holidays = (dummyData.holidays || []).map(h => ({
      ...h,
      title: h.holidayName,
      type: "holiday",
      start: new Date(`${h.date}T00:00`),
      end: new Date(`${h.date}T23:59`),
    }));

    const vacations = (dummyData.vacations || []).map(v => ({
      ...v,
      title: v.vacationName,
      type: "vacation",
      start: new Date(`${v.startDate}T00:00`),
      end: new Date(`${v.endDate}T23:59`),
    }));

    const allEvents = [...studentEvents, ...events, ...holidays, ...vacations];

    // Save allEvents in one key
    localStorage.setItem("allEvents", JSON.stringify(allEvents));
  };
  
  export const resetAndSeedLocalStorage = () => {
    localStorage.clear();
    seedLocalStorage(true);
  };
  