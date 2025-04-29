// src/utils/getStudentEvents.js
export const getStudentEvents = (studentId) => {
    const allEvents = JSON.parse(localStorage.getItem("allEvents")) || [];
    const students = JSON.parse(localStorage.getItem("students")) || [];
    const student = students.find((s) => s.id === studentId);
  
    if (!student) return [];
  
    return allEvents.filter((event) => {
      if (["holiday", "vacation", "year", "semester", "event"].includes(event.type)) {
        return true; // global events visible to all
      }
      if (event.type === "studentEvent" && event.studentId === studentId) {
        return true; // personal event
      }
      if (event.type === "courseMeeting" && student.courseCodes?.includes(event.courseCode)) {
        return true; // course meeting for student's courses
      }
      return false;
    });
  };
  