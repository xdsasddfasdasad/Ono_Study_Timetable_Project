// src/utils/seedBaseData.js

import { dummyData } from "../data/dummyData";
import { hashPassword } from "./hash";
import { saveRecords, getRecords } from "./storage";
export const seedBaseData = async (force = false) => {
  console.log("Attempting to seed base data...");
  try {
    if (force || !localStorage.getItem("students")) {
      const studentsToSave = await Promise.all(
        (dummyData.students || []).map(async (student) => {
          if (!student.password) {
            console.warn(`Student ${student.username || student.id} has no password to hash.`);
            return student;
          }
          try {
             const hashed = await hashPassword(student.password);
             return { ...student, password: hashed };
          } catch (hashError) {
             console.error(`Failed to hash password for student ${student.username || student.id}:`, hashError);
             return { ...student, password: null };
          }
        })
      );
      saveRecords("students", studentsToSave);
      console.log("Seeded students (passwords hashed where possible).");
    } else {
      console.log("Students data already exists, skipping.");
    }
  } catch (error) {
    console.error("Error processing or saving students:", error);
  }
  const baseEntityKeys = [
      "years",
      "lecturers",
      "sites",
      "courses",
      "holidays",
      "vacations",
      "events",
      "tasks"
  ];

  baseEntityKeys.forEach(key => {
      try {
          if (force || !localStorage.getItem(key)) {
              saveRecords(key, dummyData[key] || []);
              console.log(`Seeded ${key}.`);
          } else {
              console.log(`${key} data already exists, skipping.`);
          }
      } catch (error) {
          console.error(`Error saving base entity ${key}:`, error);
      }
  });
  try {
      console.log("Checking if seeding for 'studentEvents' is needed...");
      if (force || !localStorage.getItem("studentEvents")) {
          console.log("'studentEvents' does not exist or force=true. Proceeding to seed.");
          const rawEvents = dummyData.studentEvents || [];
          console.log("Raw student events from dummyData:", rawEvents);
          const validatedStudentEvents = rawEvents.filter(e => e && e.studentId);
          console.log("Validated student events (with studentId):", validatedStudentEvents);
          if (validatedStudentEvents.length !== rawEvents.length) {
              console.warn("Some dummy student events were missing studentId and were skipped during seeding.");
          }
          saveRecords("studentEvents", validatedStudentEvents);
          console.log("Seeded raw studentEvents successfully.");
      } else {
          console.log("Raw studentEvents data already exists, skipping.");
      }
  } catch (error) {
      console.error("Error saving raw studentEvents:", error);
  }
  try {
    if (force || !localStorage.getItem("rooms")) {
        const sitesData = getRecords("sites");
        const rooms = sitesData.flatMap(site =>
            (site.rooms || []).map(room => ({
                ...room,
                siteCode: site.siteCode,
            }))
        );
        if (rooms.length > 0) {
            saveRecords("rooms", rooms);
            console.log("Seeded flat rooms array.");
        } else {
            console.log("No rooms found in sites data to create flat array.");
        }
    } else {
        console.log("Flat rooms array already exists, skipping generation.");
    }
  } catch (error) {
    console.error("Error creating or saving flat rooms array:", error);
  }

  console.log("Base data seeding process finished.");
};