// src/utils/seedBaseData.js
import { dummyData } from "../data/dummyData"; 
import { hashPassword } from "./hash";

export const seedBaseData = async (force = false) => {
  // ✅ Hash and Save Students
  const hashedStudents = await Promise.all(
    dummyData.students.map(async (student) => {
      const hashed = await hashPassword(student.password);
      return { ...student, password: hashed };
    })
  );

  if (force || !localStorage.getItem("students")) {
    localStorage.setItem("students", JSON.stringify(hashedStudents));
  }

  // ✅ Save All Other Base Entities (excluding coursesMeetings, studentEvents)
  const keysToSkip = ["students", "coursesMeetings", "studentEvents"];
  Object.entries(dummyData).forEach(([key, value]) => {
    if (keysToSkip.includes(key)) return;
    if (force || !localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });

  // ✅ Save lecturers
  if (force || !localStorage.getItem("lecturers")) {
    localStorage.setItem("lecturers", JSON.stringify(dummyData.lecturers));
  }

  // ✅ Save sites
  if (force || !localStorage.getItem("sites")) {
    localStorage.setItem("sites", JSON.stringify(dummyData.sites));
  }

  // ✅ Save rooms (optional flat rooms array)
  const rooms = dummyData.sites.flatMap(site =>
    site.rooms.map(room => ({
      ...room,
      siteCode: site.siteCode,
    }))
  );
  if (rooms.length > 0 && (force || !localStorage.getItem("rooms"))) {
    localStorage.setItem("rooms", JSON.stringify(rooms));
  }
};

