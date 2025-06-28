// src/utils/academicInfoService.js

import { parseISO, isWithinInterval } from 'date-fns';
import { fetchCollection } from '../firebase/firestoreService';

/**
 * אחזור מידע על כל השנים והסמסטרים מהמערכת.
 */
export const fetchAcademicInfo = async () => {
    try {
        const years = await fetchCollection("years");
        if (!years) return { error: "Could not fetch years data." };
        // ממפה את המידע לפורמט פשוט וברור עבור ה-AI
        return years.map(y => ({
            year: y.yearNumber,
            startDate: y.startDate,
            endDate: y.endDate,
            semesters: y.semesters.map(s => ({
                semesterCode: s.semesterCode,
                semesterNumber: s.semesterNumber,
                startDate: s.startDate,
                endDate: s.endDate,
            }))
        }));
    } catch (error) {
        console.error("Error in fetchAcademicInfo:", error);
        return { error: error.message };
    }
};

/**
 * אחזור כל הקורסים שהסטודנט המחובר רשום אליהם.
 * זו פונקציה שמדגימה קישור בין ישויות (students -> courses).
 */
export const fetchStudentCourses = async (currentUser) => {
    if (!currentUser?.uid) {
        return { error: "User is not logged in." };
    }

    try {
        const [students, allCourses] = await Promise.all([
            fetchCollection("students"),
            fetchCollection("courses")
        ]);

        if (!students || !allCourses) return { error: "Could not fetch students or courses data." };

        const studentProfile = students.find(s => s.id === currentUser.uid);
        if (!studentProfile) {
            return { error: `Student profile not found for UID: ${currentUser.uid}` };
        }

        const studentCourseCodes = studentProfile.courseCodes || [];
        if (studentCourseCodes.length === 0) {
            return { courses: [] }; // מחזיר רשימה ריקה אם הסטודנט לא רשום לקורסים
        }

        const registeredCourses = allCourses.filter(course => studentCourseCodes.includes(course.courseCode));
        return { courses: registeredCourses };

    } catch (error) {
        console.error("Error in fetchStudentCourses:", error);
        return { error: error.message };
    }
};

/**
 * אחזור כל הקורסים במערכת, עם אפשרות סינון לפי סמסטר.
 */
export const queryCourses = async (filters = {}) => {
    try {
        let courses = await fetchCollection("courses");
        if (!courses) return { error: "Could not fetch courses data." };

        if (filters.semesterCode) {
            courses = courses.filter(c => c.semesterCode === filters.semesterCode);
        }
        
        return { courses: courses, count: courses.length };

    } catch (error) {
        console.error("Error in queryCourses:", error);
        return { error: error.message };
    }
};
/**
 * פונקציית שירות פנימית למציאת הסמסטר הנוכחי לפי התאריך.
 */
const findCurrentSemester = (academicInfo) => {
    const now = new Date();
    for (const year of academicInfo) {
        for (const semester of year.semesters) {
            const interval = {
                start: parseISO(semester.startDate),
                end: parseISO(semester.endDate)
            };
            if (isWithinInterval(now, interval)) {
                return semester;
            }
        }
    }
    return null; // לא נמצא סמסטר נוכחי
};

/**
 * "כלי-העל" החדש: מאחזר את הקורסים של הסטודנט לסמסטר נתון.
 * אם לא סופק סמסטר, הוא מוצא את הסמסטר הנוכחי באופן אוטומטי.
 */
export const fetchStudentCoursesForSemester = async (currentUser, semesterCode = null) => {
    if (!currentUser?.uid) return { error: "User is not logged in." };

    try {
        let targetSemesterCode = semesterCode;

        // אם לא קיבלנו קוד סמסטר, נמצא אותו בעצמנו
        if (!targetSemesterCode) {
            const academicInfo = await fetchAcademicInfo();
            if (academicInfo.error) return academicInfo;

            const currentSemester = findCurrentSemester(academicInfo);
            if (!currentSemester) return { error: "Could not determine the current semester." };
            
            targetSemesterCode = currentSemester.semesterCode;
        }

        const [students, allCourses] = await Promise.all([
            fetchCollection("students"),
            fetchCollection("courses")
        ]);

        const studentProfile = students.find(s => s.id === currentUser.uid);
        if (!studentProfile) return { error: "Student profile not found." };

        const studentCourseCodes = studentProfile.courseCodes || [];
        const semesterCourses = allCourses.filter(course => 
            studentCourseCodes.includes(course.courseCode) && course.semesterCode === targetSemesterCode
        );

        return { 
            semesterCode: targetSemesterCode,
            courses: semesterCourses, 
            count: semesterCourses.length 
        };

    } catch (error) {
        console.error("Error in fetchStudentCoursesForSemester:", error);
        return { error: error.message };
    }
};