// src/utils/academicInfoService.js

// This file serves as a dedicated service for handling complex queries related to academic data.
// It contains functions that fetch and process information from multiple Firestore collections
// to answer specific business questions, like "Which courses is this student taking this semester?".

import { parseISO, isWithinInterval } from 'date-fns';
// Imports the generic service for fetching data from Firestore collections.
import { fetchCollection } from '../firebase/firestoreService';

/**
 * Fetches and formats information about all academic years and their nested semesters.
 * (Original comment: Retrieve information about all years and semesters from the system.)
 */
export const fetchAcademicInfo = async () => {
    try {
        const years = await fetchCollection("years");
        if (!years) return { error: "Could not fetch years data." };
        
        // Maps the raw data to a cleaner format, which can be easier for other parts
        // of the application (like the AI) to understand.
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
 * Fetches all courses that the currently logged-in student is registered for.
 * This function demonstrates linking entities (students -> courses).
 * (Original comment: Retrieve all courses the logged-in student is registered for.)
 */
export const fetchStudentCourses = async (currentUser) => {
    if (!currentUser?.uid) {
        return { error: "User is not logged in." };
    }

    try {
        // Fetch both the students and courses collections in parallel for efficiency.
        const [students, allCourses] = await Promise.all([
            fetchCollection("students"),
            fetchCollection("courses")
        ]);

        if (!students || !allCourses) return { error: "Could not fetch students or courses data." };

        // Find the specific profile for the current user.
        const studentProfile = students.find(s => s.id === currentUser.uid);
        if (!studentProfile) {
            return { error: `Student profile not found for UID: ${currentUser.uid}` };
        }

        // Get the list of course codes the student is enrolled in from their profile.
        const studentCourseCodes = studentProfile.courseCodes || [];
        if (studentCourseCodes.length === 0) {
            // Returns an empty list if the student is not registered for any courses.
            return { courses: [] };
        }

        // Filter the master list of all courses to find only those matching the student's course codes.
        const registeredCourses = allCourses.filter(course => studentCourseCodes.includes(course.courseCode));
        return { courses: registeredCourses };

    } catch (error) {
        console.error("Error in fetchStudentCourses:", error);
        return { error: error.message };
    }
};

/**
 * Fetches all courses from the system, with an option to filter by semester.
 * (Original comment: Retrieve all courses in the system, with optional filtering by semester.)
 */
export const queryCourses = async (filters = {}) => {
    try {
        let courses = await fetchCollection("courses");
        if (!courses) return { error: "Could not fetch courses data." };

        // If a semester code is provided in the filters, apply the filter.
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
 * An internal helper function to find the current semester based on today's date.
 * (Original comment: Internal helper function to find the current semester by date.)
 */
const findCurrentSemester = (academicInfo) => {
    const now = new Date();
    // Iterate through all years and their semesters.
    for (const year of academicInfo) {
        for (const semester of year.semesters) {
            const interval = {
                start: parseISO(semester.startDate),
                end: parseISO(semester.endDate)
            };
            // Check if today's date falls within the semester's interval.
            if (isWithinInterval(now, interval)) {
                return semester;
            }
        }
    }
    // Return null if no current semester is found.
    return null;
};

/**
 * The new "master tool": Retrieves a student's courses for a given semester.
 * If no semester is provided, it automatically finds the current semester.
 * (Original comment: The new "master tool": retrieves the student's courses for a given semester. If no semester is provided, it finds the current semester automatically.)
 */
export const fetchStudentCoursesForSemester = async (currentUser, semesterCode = null) => {
    if (!currentUser?.uid) return { error: "User is not logged in." };

    try {
        let targetSemesterCode = semesterCode;

        // If no semester code was provided, we need to find it ourselves.
        if (!targetSemesterCode) {
            const academicInfo = await fetchAcademicInfo();
            if (academicInfo.error) return academicInfo;

            const currentSemester = findCurrentSemester(academicInfo);
            if (!currentSemester) return { error: "Could not determine the current semester." };
            
            targetSemesterCode = currentSemester.semesterCode;
        }

        // Fetch the necessary data collections.
        const [students, allCourses] = await Promise.all([
            fetchCollection("students"),
            fetchCollection("courses")
        ]);

        const studentProfile = students.find(s => s.id === currentUser.uid);
        if (!studentProfile) return { error: "Student profile not found." };

        // Filter the student's courses by the target semester code.
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