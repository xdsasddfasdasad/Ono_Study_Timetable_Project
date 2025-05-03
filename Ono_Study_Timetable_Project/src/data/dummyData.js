export const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export const dummyData = {
  students: [
    { id: "admin1", firstName: "Admin", lastName: "Main", email: "admin@example.com", username: "adminuser", password: "admin123", courseCodes: ["C1", "C2", "C3"], eventCodes: ["SE-ADMIN-1"] },
    { id: "stud1", firstName: "Alice", lastName: "Smith", email: "alice.s@example.com", username: "alice_s", password: "password123", courseCodes: ["C1", "C4"] },
    { id: "stud2", firstName: "Bob", lastName: "Jones", email: "bob.j@example.com", username: "bob_j", password: "password123", courseCodes: ["C2", "C5"] },
    { id: "stud3", firstName: "Charlie", lastName: "Brown", email: "charlie.b@example.com", username: "charlie_b", password: "password123", courseCodes: ["C3", "C6"] },
    { id: "stud4", firstName: "Diana", lastName: "Prince", email: "diana.p@example.com", username: "diana_p", password: "password123", courseCodes: ["C4", "C7"] },
    { id: "stud5", firstName: "Ethan", lastName: "Hunt", email: "ethan.h@example.com", username: "ethan_h", password: "password123", courseCodes: ["C5", "C8"] },
    { id: "stud6", firstName: "Fiona", lastName: "Glenanne", email: "fiona.g@example.com", username: "fiona_g", password: "password123", courseCodes: ["C6", "C9"] },
    { id: "stud7", firstName: "George", lastName: "Costanza", email: "george.c@example.com", username: "george_c", password: "password123", courseCodes: ["C7", "C10"] },
    { id: "stud8", firstName: "Hannah", lastName: "Montana", email: "hannah.m@example.com", username: "hannah_m", password: "password123", courseCodes: ["C8", "C11"] },
    { id: "stud9", firstName: "Ian", lastName: "Malcolm", email: "ian.m@example.com", username: "ian_m", password: "password123", courseCodes: ["C9", "C12"] },
    { id: "stud10", firstName: "Julia", lastName: "Roberts", email: "julia.r@example.com", username: "julia_r", password: "password123", courseCodes: ["C10", "C13"] },
    { id: "stud11", firstName: "Kevin", lastName: "McCallister", email: "kevin.m@example.com", username: "kevin_m", password: "password123", courseCodes: ["C11", "C14"] },
    { id: "stud12", firstName: "Linda", lastName: "Hamilton", email: "linda.h@example.com", username: "linda_h", password: "password123", courseCodes: ["C12", "C15"] },
    { id: "stud13", firstName: "Michael", lastName: "Scott", email: "michael.s@example.com", username: "michael_s", password: "password123", courseCodes: ["C13", "C1"] },
    { id: "stud14", firstName: "Nora", lastName: "Ephron", email: "nora.e@example.com", username: "nora_e", password: "password123", courseCodes: ["C14", "C2"] },
    { id: "stud15", firstName: "Oscar", lastName: "Martinez", email: "oscar.m@example.com", username: "oscar_m", password: "password123", courseCodes: ["C15", "C3"] },
    { id: "stud16", firstName: "Pam", lastName: "Beesly", email: "pam.b@example.com", username: "pam_b", password: "password123", courseCodes: ["C1", "C4"] },
    { id: "stud17", firstName: "Quentin", lastName: "Tarantino", email: "quentin.t@example.com", username: "quentin_t", password: "password123", courseCodes: ["C2", "C5"] },
    { id: "stud18", firstName: "Rachel", lastName: "Green", email: "rachel.g@example.com", username: "rachel_g", password: "password123", courseCodes: ["C3", "C6"] },
    { id: "stud19", firstName: "Steve", lastName: "Carell", email: "steve.c@example.com", username: "steve_c", password: "password123", courseCodes: ["C4", "C7"] },
    { id: "stud20", firstName: "Tina", lastName: "Fey", email: "tina.f@example.com", username: "tina_f", password: "password123", courseCodes: ["C5", "C8"] }
  ],
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
    { yearCode: "Y-Past1", yearNumber: "2022", startDate: "2022-09-01", endDate: "2023-06-30", semesters: [] },
    { yearCode: "Y-Past2", yearNumber: "2021", startDate: "2021-09-01", endDate: "2022-06-30", semesters: [] },
    { yearCode: "Y-Future1", yearNumber: "2026", startDate: "2026-09-01", endDate: "2027-06-30", semesters: [] },
    { yearCode: "Y-Future2", yearNumber: "2027", startDate: "2027-09-01", endDate: "2028-06-30", semesters: [] },
    { yearCode: "Y-Short", yearNumber: "Short", startDate: "2025-07-01", endDate: "2025-08-31", semesters: [{ semesterCode: "S-Sum25", semesterNumber: "Summer", startDate: "2025-07-01", endDate: "2025-08-29" }]},
    ...Array.from({ length: 12 }, (_, i) => ({
        yearCode: `Y-Gen${i + 1}`, yearNumber: `${2028 + i}`, startDate: `${2028 + i}-09-01`, endDate: `${2029 + i}-06-30`,
        semesters: [
             { semesterCode: `S${28 + i}A`, semesterNumber: "A", startDate: `${2028 + i}-10-20`, endDate: `${2029 + i}-02-01` },
             { semesterCode: `S${28 + i}B`, semesterNumber: "B", startDate: `${2029 + i}-03-01`, endDate: `${2029 + i}-06-15` }
        ]
    }))
  ],
  lecturers: [
    { id: "L1", name: "Dr. Evelyn Reed", email: "e.reed@example.edu", phone: "555-1001" },
    { id: "L2", name: "Prof. Ben Carter", email: "b.carter@example.edu", phone: "555-1002" },
    { id: "L3", name: "Dr. Chloe Davis", email: "c.davis@example.edu", phone: "555-1003" },
    { id: "L4", name: "Prof. Samuel Green", email: "s.green@example.edu", phone: "555-1004" },
    { id: "L5", name: "Dr. Olivia White", email: "o.white@example.edu", phone: "555-1005" },
    { id: "L6", name: "Prof. Isaac Moore", email: "i.moore@example.edu", phone: "555-1006" },
    { id: "L7", name: "Dr. Maya Patel", email: "m.patel@example.edu", phone: "555-1007" },
    { id: "L8", name: "Prof. Leo Kim", email: "l.kim@example.edu", phone: "555-1008" },
    { id: "L9", name: "Dr. Sophia Chen", email: "s.chen@example.edu", phone: "555-1009" },
    { id: "L10", name: "Prof. Noah Garcia", email: "n.garcia@example.edu", phone: "555-1010" },
    { id: "L11", name: "Dr. Ava Smith", email: "a.smith@example.edu", phone: "555-1011" },
    { id: "L12", name: "Prof. Liam Brown", email: "l.brown@example.edu", phone: "555-1012" },
    { id: "L13", name: "Dr. Mia Johnson", email: "m.johnson@example.edu", phone: "555-1013" },
    { id: "L14", name: "Prof. Owen Davis", email: "o.davis@example.edu", phone: "555-1014" },
    { id: "L15", name: "Dr. Isla Wilson", email: "i.wilson@example.edu", phone: "555-1015" },
    { id: "L16", name: "Prof. Ethan Miller", email: "e.miller@example.edu", phone: "555-1016" },
    { id: "L17", name: "Dr. Zoe Taylor", email: "z.taylor@example.edu", phone: "555-1017" },
    { id: "L18", name: "Prof. Caleb Anderson", email: "c.anderson@example.edu", phone: "555-1018" },
    { id: "L19", name: "Dr. Aria Thomas", email: "a.thomas@example.edu", phone: "555-1019" },
    { id: "L20", name: "Prof. Ryan Jackson", email: "r.jackson@example.edu", phone: "555-1020" }
  ],
  sites: [
    { siteCode: "MAIN", siteName: "Main Campus", notes: "Central administration and humanities.", rooms: [ { roomCode: "MAIN101", roomName: "Room 101", notes: "Standard classroom" }, { roomCode: "MAIN102", roomName: "Room 102", notes: "" }, { roomCode: "MAIN201", roomName: "Seminar Room A", notes: "Projector" } ] },
    { siteCode: "SCI", siteName: "Science Building", notes: "Labs and research facilities.", rooms: [ { roomCode: "SCI-L1", roomName: "Chem Lab 1", notes: "Fume hoods" }, { roomCode: "SCI-L2", roomName: "Bio Lab", notes: "" }, { roomCode: "SCI-210", roomName: "Lecture Hall 210", notes: "" } ] },
    { siteCode: "ARTS", siteName: "Arts Center", notes: "Studios and performance spaces.", rooms: [ { roomCode: "ART-S1", roomName: "Studio 1 (Painting)", notes: "" }, { roomCode: "ART-TH", roomName: "Black Box Theater", notes: "" } ] },
    { siteCode: "LIB", siteName: "Library Building", notes: "", rooms: [ { roomCode: "LIB-G1", roomName: "Group Study 1", notes: "" }, { roomCode: "LIB-G2", roomName: "Group Study 2", notes: "" }, { roomCode: "LIB-CR", roomName: "Computer Room", notes: "" } ] },
    { siteCode: "ENG", siteName: "Engineering Block", notes: "", rooms: [ { roomCode: "ENG-W1", roomName: "Workshop A", notes: "" }, { roomCode: "ENG-305", roomName: "CAD Lab", notes: "" } ] },
    ...Array.from({ length: 15 }, (_, i) => ({
      siteCode: `SITE${i + 6}`, siteName: `Campus ${String.fromCharCode(65 + i)}`, notes: `Notes for Campus ${String.fromCharCode(65 + i)}`,
      rooms: [ { roomCode: `R${i + 6}-1`, roomName: `Room ${i + 6}01`, notes: "" }, { roomCode: `R${i + 6}-2`, roomName: `Room ${i + 6}02`, notes: "" } ]
    }))
  ],
  courses: [
    { courseCode: "C1", courseName: "Intro to React", roomCode: "MAIN101", lecturerId: "L1", semesterCode: "S25A", notes: "Frontend basics", zoomMeetinglink: "", hours: [ { day: "Mon", start: "09:00", end: "10:30" }, { day: "Wed", start: "12:00", end: "13:30" } ] },
    { courseCode: "C2", courseName: "Data Structures", roomCode: "SCI-210", lecturerId: "L2", semesterCode: "S25A", notes: "", zoomMeetinglink: "", hours: [ { day: "Tue", start: "11:00", end: "12:30" }, { day: "Thu", start: "14:00", end: "15:30" } ] },
    { courseCode: "C3", courseName: "Algorithms", roomCode: "SCI-210", lecturerId: "L2", semesterCode: "S25B", notes: "Follow-up to C2", zoomMeetinglink: "", hours: [ { day: "Tue", start: "11:00", end: "12:30" }, { day: "Thu", start: "14:00", end: "15:30" } ] },
    { courseCode: "C4", courseName: "Database Systems", roomCode: "LIB-CR", lecturerId: "L3", semesterCode: "S25A", notes: "", zoomMeetinglink: "", hours: [ { day: "Fri", start: "10:00", end: "13:00" } ] },
    { courseCode: "C5", courseName: "Linear Algebra", roomCode: "MAIN102", lecturerId: "L4", semesterCode: "S25A", notes: "", zoomMeetinglink: "", hours: [ { day: "Mon", start: "14:00", end: "15:30" }, { day: "Wed", start: "09:00", end: "10:30" } ] },
    { courseCode: "C6", courseName: "Calculus II", roomCode: "MAIN102", lecturerId: "L4", semesterCode: "S25B", notes: "", zoomMeetinglink: "", hours: [ { day: "Mon", start: "14:00", end: "15:30" }, { day: "Wed", start: "09:00", end: "10:30" } ] },
    { courseCode: "C7", courseName: "Intro to Python", roomCode: "LIB-CR", lecturerId: "L5", semesterCode: "S25A", notes: "For beginners", zoomMeetinglink: "", hours: [ { day: "Tue", start: "16:00", end: "17:30" } ] },
    { courseCode: "C8", courseName: "Web Development", roomCode: "MAIN101", lecturerId: "L1", semesterCode: "S25B", notes: "HTML, CSS, JS", zoomMeetinglink: "", hours: [ { day: "Mon", start: "11:00", end: "12:30" }, { day: "Wed", start: "14:00", end: "15:30" } ] },
    { courseCode: "C9", courseName: "Operating Systems", roomCode: "ENG-305", lecturerId: "L6", semesterCode: "S25B", notes: "", zoomMeetinglink: "", hours: [ { day: "Fri", start: "13:00", end: "16:00" } ] },
    { courseCode: "C10", courseName: "Art History 101", roomCode: "ART-S1", lecturerId: "L7", semesterCode: "S25A", notes: "", zoomMeetinglink: "", hours: [ { day: "Thu", start: "10:00", end: "11:30" } ] },
     ...Array.from({ length: 10 }, (_, i) => ({
         courseCode: `GEN${i + 1}`, courseName: `General Elective ${i + 1}`, roomCode: `MAIN${101 + i % 2}`, lecturerId: `L${3 + i % 8}`, semesterCode: i % 2 === 0 ? "S25A" : "S25B", notes: "", zoomMeetinglink: "",
         hours: [ { day: ["Mon", "Tue", "Wed", "Thu", "Fri"][i % 5], start: `${10 + i % 4}:00`, end: `${11 + i % 4}:30` } ]
     }))
  ],
  holidays: [
    { holidayCode: "H-NY25", holidayName: "New Year's Day", startDate: "2025-01-01", endDate: "2025-01-01", notes: "" },
    { holidayCode: "H-MLK25", holidayName: "MLK Day", startDate: "2025-01-20", endDate: "2025-01-20", notes: "" },
    { holidayCode: "H-PRES25", holidayName: "Presidents' Day", startDate: "2025-02-17", endDate: "2025-02-17", notes: "" },
    { holidayCode: "H-MEM25", holidayName: "Memorial Day", startDate: "2025-05-26", endDate: "2025-05-26", notes: "" },
    { holidayCode: "H-JUN25", holidayName: "Juneteenth", startDate: "2025-06-19", endDate: "2025-06-19", notes: "" },
    { holidayCode: "H-IND25", holidayName: "Independence Day", startDate: "2025-07-04", endDate: "2025-07-04", notes: "" },
    { holidayCode: "H-LAB25", holidayName: "Labor Day", startDate: "2025-09-01", endDate: "2025-09-01", notes: "" },
    { holidayCode: "H-VET25", holidayName: "Veterans Day", startDate: "2025-11-11", endDate: "2025-11-11", notes: "" },
    { holidayCode: "H-THX25", holidayName: "Thanksgiving", startDate: "2025-11-27", endDate: "2025-11-28", notes: "Thu & Fri" },
    { holidayCode: "H-XMAS25", holidayName: "Christmas Break", startDate: "2025-12-24", endDate: "2025-12-26", notes: "" },
    { holidayCode: "H-NY26", holidayName: "New Year's Day", startDate: "2026-01-01", endDate: "2026-01-01", notes: "" },
    { holidayCode: "H-MLK26", holidayName: "MLK Day", startDate: "2026-01-19", endDate: "2026-01-19", notes: "" },
    { holidayCode: "H-PRES26", holidayName: "Presidents' Day", startDate: "2026-02-16", endDate: "2026-02-16", notes: "" },
    { holidayCode: "H-MEM26", holidayName: "Memorial Day", startDate: "2026-05-25", endDate: "2026-05-25", notes: "" },
    { holidayCode: "H-JUN26", holidayName: "Juneteenth", startDate: "2026-06-19", endDate: "2026-06-19", notes: "" },
    { holidayCode: "H-IND26", holidayName: "Independence Day", startDate: "2026-07-03", endDate: "2026-07-03", notes: "Observed on Friday" },
    { holidayCode: "H-LAB26", holidayName: "Labor Day", startDate: "2026-09-07", endDate: "2026-09-07", notes: "" },
    { holidayCode: "H-VET26", holidayName: "Veterans Day", startDate: "2026-11-11", endDate: "2026-11-11", notes: "" },
    { holidayCode: "H-THX26", holidayName: "Thanksgiving", startDate: "2026-11-26", endDate: "2026-11-27", notes: "Thu & Fri" },
    { holidayCode: "H-XMAS26", holidayName: "Christmas Break", startDate: "2026-12-24", endDate: "2026-12-25", notes: "" }
  ],
  vacations: [
    { vacationCode: "V-SB25", vacationName: "Spring Break '25", startDate: "2025-03-24", endDate: "2025-03-28", notes: "" },
    { vacationCode: "V-SUM25", vacationName: "Summer Break '25", startDate: "2025-06-23", endDate: "2025-08-29", notes: "Between Sem B and Year Start" },
    { vacationCode: "V-WIN25", vacationName: "Winter Break '25", startDate: "2025-12-22", endDate: "2026-01-02", notes: "" },
    { vacationCode: "V-SB26", vacationName: "Spring Break '26", startDate: "2026-03-23", endDate: "2026-03-27", notes: "" },
    { vacationCode: "V-SUM26", vacationName: "Summer Break '26", startDate: "2026-06-22", endDate: "2026-08-28", notes: "" },
    { vacationCode: "V-WIN26", vacationName: "Winter Break '26", startDate: "2026-12-21", endDate: "2027-01-01", notes: "" },
    ...Array.from({ length: 14 }, (_, i) => ({
      vacationCode: `V-GEN${i + 7}`, vacationName: `Generated Vacation ${i + 7}`, startDate: `${2027 + i}-07-01`, endDate: `${2027 + i}-07-07`, notes: ""
    }))
  ],
  events: [
    { eventCode: "E-HACK25", eventName: "Annual Hackathon", startDate: "2025-04-11", endDate: "2025-04-13", allDay: true, notes: "Teams compete all weekend" },
    { eventCode: "E-JOB25A", eventName: "Job Fair - Fall", startDate: "2025-10-15", endDate: "2025-10-15", allDay: false, startHour: "10:00", endHour: "15:00", notes: "Main Hall" },
    { eventCode: "E-CONF25", eventName: "Tech Conference", startDate: "2025-11-08", endDate: "2025-11-09", allDay: true, notes: "Guest speakers" },
    { eventCode: "E-OPEN25", eventName: "Open House", startDate: "2025-09-20", endDate: "2025-09-20", allDay: false, startHour: "11:00", endHour: "14:00", notes: "" },
    { eventCode: "E-GRAD25", eventName: "Graduation Ceremony", startDate: "2025-06-15", endDate: "2025-06-15", allDay: false, startHour: "14:00", endHour: "16:00", notes: "Arena" },
    { eventCode: "E-ALUM25", eventName: "Alumni Homecoming", startDate: "2025-10-04", endDate: "2025-10-04", allDay: true, notes: "" },
    { eventCode: "E-ART25", eventName: "Art Exhibit Opening", startDate: "2025-03-15", endDate: "2025-03-15", allDay: false, startHour: "18:00", endHour: "20:00", notes: "Arts Center Gallery" },
    { eventCode: "E-SPORT25", eventName: "Championship Game", startDate: "2025-11-22", endDate: "2025-11-22", allDay: false, startHour: "19:00", endHour: "21:30", notes: "Stadium" },
    { eventCode: "E-MUSIC25", eventName: "Spring Music Concert", startDate: "2025-05-03", endDate: "2025-05-03", allDay: false, startHour: "19:30", endHour: "21:00", notes: "Theater" },
    { eventCode: "E-CLUB25", eventName: "Club Sign-up Day", startDate: "2025-09-10", endDate: "2025-09-10", allDay: false, startHour: "10:00", endHour: "16:00", notes: "Student Union" },
     ...Array.from({ length: 10 }, (_, i) => ({
         eventCode: `E-GEN${i + 11}`, eventName: `Campus Event ${i + 11}`, startDate: `2025-0${5 + i % 5}-${10 + i}`, endDate: `2025-0${5 + i % 5}-${10 + i}`, allDay: i % 3 === 0, startHour: "12:00", endHour: "14:00", notes: `Details for event ${i + 11}`
     }))
  ],
  tasks: [
    { assignmentCode: "T1-C1", assignmentName: "React Component", courseCode: "C1", submissionDate: "2025-11-10", submissionHour: "23:59", notes: "Build a functional component" },
    { assignmentCode: "T1-C2", assignmentName: "Linked List Impl.", courseCode: "C2", submissionDate: "2025-11-15", submissionHour: "17:00", notes: "" },
    { assignmentCode: "T1-C4", assignmentName: "SQL Queries", courseCode: "C4", submissionDate: "2025-11-20", submissionHour: "23:59", notes: "Normalization exercise" },
    { assignmentCode: "T1-C5", assignmentName: "Matrix Operations", courseCode: "C5", submissionDate: "2025-11-25", submissionHour: "12:00", notes: "Use NumPy if allowed" },
    { assignmentCode: "T2-C1", assignmentName: "State Management", courseCode: "C1", submissionDate: "2025-12-01", submissionHour: "23:59", notes: "Context API vs Redux" },
    { assignmentCode: "T2-C2", assignmentName: "Tree Traversal", courseCode: "C2", submissionDate: "2025-12-05", submissionHour: "17:00", notes: "" },
    { assignmentCode: "T1-C7", assignmentName: "Python Basics", courseCode: "C7", submissionDate: "2025-12-10", submissionHour: "23:59", notes: "Loops and functions" },
    { assignmentCode: "T1-C3", assignmentName: "Sorting Algorithms", courseCode: "C3", submissionDate: "2026-03-10", submissionHour: "17:00", notes: "" },
    { assignmentCode: "T1-C8", assignmentName: "Simple Website", courseCode: "C8", submissionDate: "2026-03-20", submissionHour: "23:59", notes: "HTML/CSS only" },
    { assignmentCode: "T1-C9", assignmentName: "Process Scheduling", courseCode: "C9", submissionDate: "2026-04-01", submissionHour: "23:59", notes: "" },
    ...Array.from({ length: 10 }, (_, i) => ({
      assignmentCode: `T-GEN${i + 11}`, assignmentName: `Generated Task ${i + 11}`, courseCode: `GEN${1 + i % 10}`, submissionDate: `2026-0${4 + i % 3}-${10 + i}`, submissionHour: "18:00", notes: `Submit via portal`
    }))
  ],
  studentEvents: [
    { studentId: "admin1", eventCode: "SE-ADMIN-1", eventName: " Dentist", startDate: "2025-11-05", endDate: "2025-11-05", allDay: false, startHour: "14:00", endHour: "15:00", notes: "Checkup" },
    { studentId: "stud1", eventCode: "SE-S1-1", eventName: "Study Group C1", startDate: "2025-11-06", endDate: "2025-11-06", allDay: false, startHour: "18:00", endHour: "20:00", notes: "Library LIB-G1" },
    { studentId: "stud2", eventCode: "SE-S2-1", eventName: "Gym Session", startDate: "2025-11-07", endDate: "2025-11-07", allDay: false, startHour: "07:00", endHour: "08:30", notes: "" },
    { studentId: "stud3", eventCode: "SE-S3-1", eventName: "Part-time Job", startDate: "2025-11-08", endDate: "2025-11-08", allDay: false, startHour: "16:00", endHour: "20:00", notes: "Bookstore" },
    { studentId: "stud1", eventCode: "SE-S1-2", eventName: "Movie Night", startDate: "2025-11-09", endDate: "2025-11-09", allDay: false, startHour: "20:00", endHour: "22:30", notes: "" },
    { studentId: "admin1", eventCode: "SE-ADMIN-2", eventName: "Project Meeting", startDate: "2025-11-12", endDate: "2025-11-12", allDay: false, startHour: "10:00", endHour: "11:00", notes: "Zoom" },
    { studentId: "stud4", eventCode: "SE-S4-1", eventName: "Volunteer Work", startDate: "2025-11-15", endDate: "2025-11-15", allDay: true, notes: "Community center" },
    { studentId: "stud5", eventCode: "SE-S5-1", eventName: "Driving Lesson", startDate: "2025-11-18", endDate: "2025-11-18", allDay: false, startHour: "13:00", endHour: "14:00", notes: "" },
    { studentId: "stud2", eventCode: "SE-S2-2", eventName: "Presentation Prep", startDate: "2025-11-19", endDate: "2025-11-19", allDay: false, startHour: "19:00", endHour: "21:00", notes: "Library" },
    { studentId: "stud1", eventCode: "SE-S1-3", eventName: "Friend's Birthday", startDate: "2025-11-21", endDate: "2025-11-21", allDay: false, startHour: "19:00", endHour: "23:00", notes: "" },
    ...Array.from({ length: 10 }, (_, i) => ({
        studentId: `stud${1 + i % 10}`, eventCode: `SE-GEN${i + 11}`, eventName: `Personal Errand ${i + 11}`, startDate: `2025-11-${20 + i}`, endDate: `2025-11-${20 + i}`, allDay: i % 4 === 0, startHour: "11:00", endHour: "11:30", notes: ""
    }))
  ]
};