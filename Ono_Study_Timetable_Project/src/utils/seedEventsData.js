// src/utils/seedEventsData.js
import { dummyData, dayMap } from "../data/dummyData";

// ✅ Helper: Check overlap with holiday/vacation
const isDateInRange = (date, ranges) => {
  return ranges.some(({ startDate, endDate }) => {
    const d = new Date(date).toISOString().slice(0, 10);
    return d >= startDate && d <= endDate;
  });
};

// ✅ Helper: Generate course meetings
const generateCourseMeetings = (courses, semesters, holidays, vacations) => {
  const meetings = [];

  courses.forEach((course) => {
    const semester = semesters.find((s) => s.semesterCode === course.semesterCode);
    if (!semester || !Array.isArray(course.hours)) return;

    const start = new Date(semester.startDate);
    const end = new Date(semester.endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const jsDay = date.getDay();
      const weekDay = Object.keys(dayMap).find((k) => dayMap[k] === jsDay);

      const matchingSlot = course.hours.find((h) => h.day === weekDay);
      if (!matchingSlot) continue;

      const dateStr = date.toISOString().slice(0, 10);
      if (isDateInRange(dateStr, [...holidays, ...vacations])) continue;

      meetings.push({
        id: `${course.courseCode}-${dateStr}`,
        courseCode: course.courseCode,
        courseName: course.courseName,
        date: dateStr,
        startHour: matchingSlot.start,
        endHour: matchingSlot.end,
        roomCode: course.roomCode,
        lecturerId: course.lecturerId,
        semesterCode: course.semesterCode,
        notes: course.notes || "",
        zoomMeetinglink: course.zoomMeetinglink || "",
      });
    }
  });

  return meetings;
};

export const seedEventsData = async (force = false) => {
  const studentEvents = dummyData.studentEvents || [];

  const events = (dummyData.events || []).map((e) => ({
    id: e.eventCode,
    title: e.eventName,
    type: "event",
    start: `${e.startDate}T${String(e.allDay).toLowerCase() === "true" ? "00:00" : e.startHour}`,
    end: `${e.endDate}T${String(e.allDay).toLowerCase() === "true" ? "23:59" : e.endHour}`,
    allDay: String(e.allDay).toLowerCase() === "true",
  }));

  const holidays = (dummyData.holidays || []).map((h) => ({
    id: h.holidayCode,
    title: h.holidayName,
    type: "holiday",
    start: `${h.startDate}T00:00`,
    end: `${h.endDate}T23:59`,
    allDay: true,
  }));

  const vacations = (dummyData.vacations || []).map((v) => ({
    id: v.vacationCode,
    title: v.vacationName,
    type: "vacation",
    start: `${v.startDate}T00:00`,
    end: `${v.endDate}T23:59`,
    allDay: true,
  }));

  const yearSemesterEvents = (dummyData.years || []).flatMap((year) => {
    const entries = [
      {
        id: `${year.yearCode}-start`,
        title: `Year ${year.yearNumber} Start`,
        type: "year",
        start: `${year.startDate}T00:00`,
        end: `${year.startDate}T23:59`,
        allDay: true,
      },
      {
        id: `${year.yearCode}-end`,
        title: `Year ${year.yearNumber} End`,
        type: "year",
        start: `${year.endDate}T00:00`,
        end: `${year.endDate}T23:59`,
        allDay: true,
      },
    ];
    (year.semesters || []).forEach((s) => {
      entries.push({
        id: `${s.semesterCode}-start`,
        title: `Semester ${s.semesterNumber} Start`,
        type: "semester",
        start: `${s.startDate}T00:00`,
        end: `${s.startDate}T23:59`,
        allDay: true,
      });
      entries.push({
        id: `${s.semesterCode}-end`,
        title: `Semester ${s.semesterNumber} End`,
        type: "semester",
        start: `${s.endDate}T00:00`,
        end: `${s.endDate}T23:59`,
        allDay: true,
      });
    });
    return entries;
  });

  // ✅ Generate course meetings
  const semesters = dummyData.years.flatMap((y) => y.semesters);
  const courseMeetings = generateCourseMeetings(dummyData.courses, semesters, dummyData.holidays, dummyData.vacations);

  // ✅ Save coursesMeetings to localStorage
  if (force || !localStorage.getItem("coursesMeetings")) {
    localStorage.setItem("coursesMeetings", JSON.stringify(courseMeetings));
  }

  // ✅ Map course meetings into calendar format
  const courseMeetingEvents = (courseMeetings || []).map((meeting) => ({
    id: meeting.id,
    title: meeting.courseName,
    type: "courseMeeting",
    courseCode: meeting.courseCode,
    start: `${meeting.date}T${meeting.startHour}`,
    end: `${meeting.date}T${meeting.endHour}`,
    allDay: false,
  }));

  // ✅ Build allEvents
  const allEvents = [
    ...studentEvents,
    ...events,
    ...holidays,
    ...vacations,
    ...yearSemesterEvents,
    ...courseMeetingEvents,
  ];

  localStorage.setItem("allEvents", JSON.stringify(allEvents));
};
