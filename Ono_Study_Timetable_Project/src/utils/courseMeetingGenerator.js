import { dayMap } from "../data/dummyData"; // Keep dayMap for day conversion
// Import Firestore service functions and DB instance
import { getFirestore, collection, query, where, getDocs, writeBatch, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { fetchCollection, fetchDocumentById } from "../firebase/firestoreService"; // Use helpers

// Helper function to check if a date falls within any blocked range (remains the same)
const isDateBlocked = (date, blockedRanges) => {
  if (!blockedRanges || blockedRanges.length === 0) return false;
  const dateString = date.toISOString().slice(0, 10);
  return blockedRanges.some(({ startDate, endDate }) => startDate && endDate && dateString >= startDate && dateString <= endDate);
};

// Generate course meeting objects in memory (logic remains the same)
// מגדיר ומייצא פונקציה שמייצרת מפגשי קורס על בסיס הגדרת קורס, סמסטר ורשימת חגים.
export const generateCourseMeetings = (courseDefinition, semester, holidaysAndVacations = []) => {
  // מאתחל מערך ריק שיאכלס את כל מפגשי הקורס שייווצרו.
  const meetings = [];
  // בודק תנאי סף חיוניים: האם קיימים הגדרת קורס, מערך שעות, ותאריכי התחלה וסוף לסמסטר.
  if (!courseDefinition?.courseCode || !Array.isArray(courseDefinition.hours) || !semester?.startDate || !semester.endDate) {
    // אם אחד התנאים לא מתקיים, מחזיר מערך ריק כי אי אפשר לייצר מפגשים.
    return meetings;
  }
  // פותח בלוק try-catch כדי לטפל בשגיאות שעלולות להתרחש במהלך עיבוד התאריכים.
  try {
    // ממיר את תאריך ההתחלה של הסמסטר (שהוא מחרוזת) לאובייקט Date מלא, בתחילת היום ב-UTC.
    const semesterStart = new Date(semester.startDate + 'T00:00:00Z');
    // ממיר את תאריך הסיום של הסמסטר לאובייקט Date מלא, בסוף היום ב-UTC.
    const semesterEnd = new Date(semester.endDate + 'T23:59:59Z');
    // מוודא שהמרת התאריכים הצליחה ושהתאריכים תקינים; אחרת, יוצא מהפונקציה.
    if (isNaN(semesterStart.getTime()) || isNaN(semesterEnd.getTime())) return meetings;
    // מגדיר "מונה" תאריכים שיתחיל מתחילת הסמסטר וירוץ יום-יום.
    let currentDate = new Date(semesterStart);
    // מתחיל לולאה שעוברת על כל יום ויום, החל מתחילת הסמסטר ועד סופו.
    while (currentDate <= semesterEnd) {
      // מפרמט את התאריך הנוכחי למחרוזת בפורמט 'YYYY-MM-DD'.
      const dateStr = currentDate.toISOString().slice(0, 10);
      // מקבל את מספר היום בשבוע (0 עבור יום ראשון, 1 לשני וכו') לפי UTC.
      const jsDay = currentDate.getUTCDay();
      // ממיר את מספר היום בשבוע לשם של היום (למשל, 'Sunday', 'Monday') בעזרת אובייקט מיפוי חיצוני.
      const weekDay = Object.keys(dayMap).find(key => dayMap[key] === jsDay);
      // בודק שני תנאים: האם היום הנוכחי הוא יום שבו מתקיימים לימודים, והאם הוא לא חג או חופשה.
      if (weekDay && !isDateBlocked(currentDate, holidaysAndVacations)) {
        // אם היום תקין, מסנן ומוצא את כל שיבוצי השעות של הקורס שמתאימים ליום הספציפי הזה בשבוע.
        const matchingSlots = courseDefinition.hours.filter(h => h.day === weekDay && h.start && h.end);
        // עובר על כל שיבוץ שנמצא ויוצר עבורו מפגש קורס נפרד.
        matchingSlots.forEach(slot => {
          // יוצר מזהה ייחודי (ID) לכל מפגש על בסיס קוד הקורס, התאריך ושעת ההתחלה.
          const meetingId = `CM-${courseDefinition.courseCode}-${dateStr}-${slot.start.replace(':', '')}`;
          // --- שינוי מרכזי: יוצר אובייקטי Date מלאים בפורמט UTC ---
          const startDateTime = new Date(`${dateStr}T${slot.start}:00Z`);
          const endDateTime = new Date(`${dateStr}T${slot.end}:00Z`);
          // מוודא שוב שתאריכי ההתחלה והסיום של המפגש הספציפי הם תאריכים חוקיים.
          if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
            // דוחף (push) אובייקט חדש למערך ה-'meetings' עם כל פרטי המפגש המלאים.
            meetings.push({
              id: meetingId,
              title: courseDefinition.courseName || `Meeting for ${courseDefinition.courseCode}`,
              courseCode: courseDefinition.courseCode,
              type: "courseMeeting",
              // --- שומר את שדות התאריך כאובייקטי Date מלאים במקום כמחרוזות נפרדות ---
              start: startDateTime,
              end: endDateTime,
              allDay: false,
              semesterCode: semester.semesterCode,
              lecturerId: courseDefinition.lecturerId || null,
              roomCode: courseDefinition.roomCode || null,
              notes: courseDefinition.notes || "",
              zoomMeetinglink: courseDefinition.zoomMeetinglink || "",
            });
          }
        });
      }
      // מקדם את "מונה" התאריכים ביום אחד כדי לעבור ליום הבא בלולאה.
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  } catch (error) { 
    // אם התרחשה שגיאה כלשהי בבלוק ה-try, מדפיס אותה לקונסול ומחזיר מערך ריק.
    console.error(`[Generator] Error generating meetings for course ${courseDefinition?.courseCode}:`, error); 
    return []; 
  }
  
  // לאחר סיום מוצלח, מדפיס הודעה לקונסול המציינת כמה מפגשים נוצרו בזיכרון.
  console.log(`[Generator] Generated ${meetings.length} meetings in memory for ${courseDefinition.courseCode}.`);
  
  // מחזיר את המערך המלא של כל מפגשי הקורס שנוצרו.
  return meetings;
};



// --- Firestore Interaction Functions ---

/**
 * Deletes all meetings for a specific course from Firestore using a batch delete.
 * @param {string} courseCode - The course code.
 * @returns {Promise<boolean>} True on success, false on failure.
 */
export const deleteMeetingsForCourseFirestore = async (courseCode) => {
    if (!courseCode) return false;
    console.log(`[Generator:DeleteFirestore] Deleting meetings for course ${courseCode}...`);
    const meetingsCollectionRef = collection(db, "coursesMeetings");
    // Query for all meetings matching the course code
    const q = query(meetingsCollectionRef, where("courseCode", "==", courseCode));
    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            console.log(`[Generator:DeleteFirestore] No existing meetings found for ${courseCode}.`);
            return true; // Nothing to delete, considered success
        }
        // Create a batch write operation
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnapshot => {
            batch.delete(docSnapshot.ref); // Add each document deletion to the batch
        });
        // Commit the batch
        await batch.commit();
        console.log(`[Generator:DeleteFirestore] Successfully deleted ${snapshot.size} meetings for ${courseCode}.`);
        return true;
    } catch (error) {
        console.error(`[Generator:DeleteFirestore] Error deleting meetings for ${courseCode}:`, error);
        return false;
    }
};

/**
 * Regenerates and saves meetings for a specific course to Firestore.
 * Fetches required data from Firestore, generates meetings, deletes old ones, and saves new ones.
 * @param {string} courseCode - The course code.
 * @returns {Promise<boolean>} True on success, false on failure.
 */
export const regenerateMeetingsForCourse = async (courseCode) => {
    if (!courseCode) return false;
    console.log(`[Generator:RegenerateFirestore] Regenerating meetings for course: ${courseCode}`);
    try {
        // 1. Fetch necessary data from Firestore
        const courseDef = await fetchDocumentById("courses", courseCode);
        if (!courseDef) throw new Error(`Course definition ${courseCode} not found.`);

        const years = await fetchCollection("years");
        const semesterData = years.flatMap(y => y.semesters || []).find(s => s.semesterCode === courseDef.semesterCode);
        if (!semesterData) throw new Error(`Semester ${courseDef.semesterCode} not found.`);

        const holidays = await fetchCollection("holidays");
        const vacations = await fetchCollection("vacations");
        const blockedRanges = [...(holidays || []), ...(vacations || [])];

        // 2. Generate new meetings in memory
        const newMeetings = generateCourseMeetings(courseDef, semesterData, blockedRanges);

        // 3. Delete existing meetings for this course
        const deleteSuccess = await deleteMeetingsForCourseFirestore(courseCode);
        if (!deleteSuccess) {
            // Don't proceed if deletion failed
            throw new Error(`Failed to delete existing meetings for ${courseCode} before regenerating.`);
        }

        // 4. Write new meetings using batch write
        if (newMeetings.length > 0) {
            const batch = writeBatch(db);
            const meetingsCollectionRef = collection(db, "coursesMeetings");
            newMeetings.forEach(meeting => {
                if (meeting.id) {
                    // Create a reference using the generated meeting ID
                    const docRef = doc(meetingsCollectionRef, meeting.id);
                    batch.set(docRef, meeting); // Use set to create/overwrite
                } else {
                    console.warn("[Generator:RegenerateFirestore] Skipping meeting without ID:", meeting);
                }
            });
            await batch.commit();
            console.log(`[Generator:RegenerateFirestore] Successfully wrote ${newMeetings.length} new meetings for ${courseCode}.`);
        } else {
            console.log(`[Generator:RegenerateFirestore] No new meetings generated for ${courseCode}.`);
        }

        return true; // Overall success

    } catch (error) {
        console.error(`[Generator:RegenerateFirestore] Error during regeneration for ${courseCode}:`, error);
        return false;
    }
};

// Keep the original delete function name, but implement it using the Firestore version
export const deleteMeetingsForCourse = async (courseCode) => {
     return deleteMeetingsForCourseFirestore(courseCode);
};