// src/config/aiTools.js

// This file defines the "toolbox" for our AI agent.
// Each tool is a function declaration that tells the Gemini model what actions
// it can request from our application. The descriptions, written in Hebrew,
// are crucial for the AI to understand the purpose of each tool and its parameters.

export const agentTools = [
  // ====================================================================
  // TOOL 1: Universal "Find/Search" Tool
  // This is a read-only tool to help the AI find information before
  // deciding to act or answering user questions.
  // ====================================================================
  {
    name: "findRecords",
    description: "כלי חיוני לענות על כל שאלה של משתמש. יש להשתמש בו כדי לחפש, למצוא, לקבל או להציג מידע על כל ישות במערכת. זו הדרך היחידה לגשת לנתונים. חובה להשתמש בו לשאלות כמו 'מה האירועים שלי היום?', 'כמה קורסים יש לי בסמסטר א'?', 'מה החג הקרוב?', או 'הצג את כל המרצים'.",
    parameters: {
      type: "OBJECT",
      properties: {
        recordType: {
          type: "STRING",
          description: "סוג הרשומה לחיפוש. חייב להיות אחד מ: 'studentEvent', 'courseMeeting', 'course', 'lecturer', 'site', 'room', 'semester', 'year', 'holiday', 'vacation', 'event', 'task'.",
        },
        // --- Flexible Search Filters ---
        filters: {
            type: "OBJECT",
            description: "אובייקט המכיל את כל מסנני החיפוש. לדוגמה: { searchText: 'מבוא', dateQuery: 'השבוע הבא' }",
            properties: {
                searchText: {
                  type: "STRING",
                  description: "טקסט חופשי לחיפוש בשדות כמו שם או כותרת (למשל, שם קורס, שם אירוע, שם מרצה).",
                },
                dateQuery: {
                  type: "STRING",
                  description: "שאילתת תאריך בשפה טבעית, למשל: 'מחר', 'השבוע', 'היום', 'בחודש הבא', '15.6.2025'."
                },
                // Add specific ID filters for relational queries
                courseId: { type: "STRING", description: "סנן לפי מזהה קורס ספציפי." },
                lecturerId: { type: "STRING", description: "סנן לפי מזהה מרצה ספציפי." },
                studentId: { type: "STRING", description: "סנן לפי מזהה סטודנט ספציפי." },
            }
        }
      },
      required: ["recordType"],
    },
  },

  // ====================================================================
  // TOOL 2: Universal "Save or Update" Tool
  // This tool performs all create and update operations.
  // ====================================================================
  {
    name: "saveOrUpdateRecord",
    description: "כלי להוספה, יצירה, קביעה או עריכה של כל ישות במערכת (אירוע, פגישה, קורס, סטודנט וכו'). יש להשתמש בו רק לאחר איסוף כל המידע הנחוץ מהמשתמש. הפרמטר 'recordType' הוא קריטי. לעריכה, חובה לספק את ה-'id' של הפריט הקיים.",
    parameters: {
      type: "OBJECT",
      properties: {
        recordType: {
          type: "STRING",
          description: "סוג הרשומה לשמירה. חייב להיות אחד מ: 'studentEvent', 'courseMeeting', 'course', 'lecturer', 'site', 'room', 'semester', 'year', 'holiday', 'vacation', 'event', 'task'.",
        },
        id: { type: "STRING", description: "ה-ID הייחודי של הפריט אותו רוצים לערוך. יש להשמיט עבור יצירת פריט חדש." },
        data: {
            type: "OBJECT",
            description: "אובייקט המכיל את כל השדות והערכים של הרשומה לשמירה. לדוגמה: { eventName: 'פגישה חשובה', date: '2025-12-25', startHour: '11:00' }. יש לכלול את כל שדות החובה הרלוונטיים לסוג הרשומה.",
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
    description: "כלי למחיקה, הסרה או ביטול של כל ישות מהמערכת. לפני השימוש, יש לוודא שיש לך את המזהה הייחודי (ID) של הפריט למחיקה. אם אין לך, השתמש קודם בכלי 'findRecords' כדי למצוא אותו.",
    parameters: {
      type: "OBJECT",
      properties: {
        recordType: {
          type: "STRING",
          description: "סוג הרשומה למחיקה, למשל 'course', 'courseMeeting', 'studentEvent'.",
        },
        recordId: {
          type: "STRING",
          description: "ה-ID הייחודי של הפריט למחיקה. זהו הערך של המפתח הראשי של אותה ישות.",
        },
        parentId: { type: "STRING", description: "עבור ישויות מקוננות, זהו ה-ID של פריט האב. לדוגמה, עבור סמסטר, זהו ה-yearCode."}
      },
      required: ["recordType", "recordId"],
    },
  },
];