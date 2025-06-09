// src/config/aiTools.js

// This file defines the "toolbox" for our AI agent.
// Each tool is a function declaration that tells the Gemini model what actions
// it can request from our application. The descriptions are crucial for the AI
// to understand the purpose of each tool and its parameters.

export const agentTools = [
  {
    name: "findRecords",
    description: "כלי חיוני לענות על כל שאלה של משתמש לגבי לוח הזמנים. יש להשתמש בו כדי לחפש, למצוא, ולקבל מידע. זו הדרך היחידה לגשת לנתוני לוח השנה. חובה להשתמש בו לשאלות כמו 'מה יש לי השבוע?', 'מה החג הקרוב?', 'הצג את כל הקורסים שלי'. המשתמש המחובר כרגע מזוהה אוטומטית.",    parameters: {
      type: "OBJECT",
      properties: {
        recordType: {
          type: "STRING",
          description: "סוג הרשומה לחיפוש. חייב להיות אחד מ: 'studentEvent', 'courseMeeting', 'course', 'lecturer', 'site', 'room', 'semester', 'year', 'holiday', 'vacation', 'event', 'task'. כדי לראות לוח זמנים מלא, ייתכן שיהיה צורך לקרוא לפונקציה זו מספר פעמים עם סוגי רשומות שונים.",
        },
        // --- מסנני חיפוש גמישים ---
        searchText: {
          type: "STRING",
          description: "טקסט חופשי לחיפוש. יכול להכיל שם של קורס, שם אירוע, שם מרצה, או כל מונח אחר. לדוגמה: 'מבוא לריאקט', 'פגישת צוות', 'פרופ' בן כרטר'.",
        },
        dateQuery: {
          type: "STRING",
          description: "שאילתת תאריך בשפה טבעית. לדוגמה: 'מחר', 'השבוע הבא', 'היום', 'בחודש הבא', 'מחרתיים', '15.6.2025', 'יום ראשון הקרוב'."
        },
      },
      required: ["recordType"],
    },
  },
  {
    name: "saveOrUpdateRecord",
    description: "כלי להוספה, יצירה, קביעה או עריכה של כל פריט במערכת. הפרמטר 'recordType' הוא קריטי. לעריכה, חובה לספק את ה-'id' של הפריט הקיים.",
    parameters: {
      type: "OBJECT",
      properties: {
        recordType: { type: "STRING", description: "סוג הרשומה לשמירה. חייב להיות אחד מ: 'studentEvent', 'courseMeeting', 'course', 'year', וכו'." },
        id: { type: "STRING", description: "ה-ID של הפריט לעריכה. יש להשמיט עבור פריטים חדשים." },
        data: {
            type: "OBJECT",
            description: "אובייקט המכיל את כל הנתונים של הפריט לשמירה. לדוגמה: { title: 'פגישה חשובה', date: '2025-12-25', startHour: '11:00' }.",
            properties: { /* הגדרת השדות האפשריים כאן היא אופציונלית אך יכולה לעזור */ }
        }
      },
      required: ["recordType", "data"],
    },
  },

  // ====================================================================
  // TOOL 3: Universal "Delete" Tool
  // ====================================================================
  {
    name: "deleteRecord",
    description: "Use to DELETE, REMOVE, or CANCEL any item from the system. You MUST find the item's unique ID first using the 'findRecords' tool if you don't have it.",
    parameters: {
      type: "OBJECT",
      properties: {
        recordType: {
          type: "STRING",
          description: "The type of the record to delete, which helps find it in the right database collection. e.g. 'course', 'courseMeeting', 'studentEvent'.",
        },
        recordId: {
          type: "STRING",
          description: "The unique ID of the item to be deleted. This is the value of the primaryKey for that recordType (e.g., courseCode, holidayCode, or a firestore ID).",
        },
        // For nested items like semesters or rooms
        parentId: { type: "STRING", description: "The ID of the parent document for nested items. For a semester, this is the yearCode. For a room, this is the siteCode."}
      },
      required: ["recordType", "recordId"],
    },
  },
];