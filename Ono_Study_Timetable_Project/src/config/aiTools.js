// src/config/aiTools.js

export const agentTools = [
  {
    name: "findRecords",
    description: "כלי חיוני לענות על כל שאלה של משתמש לגבי לוח הזמנים, קורסים, חגים, או כל נתון אחר במערכת. יש להשתמש בכלי זה כדי לחפש, למצוא, ולקבל מידע. זו הדרך היחידה שלך לגשת לנתונים. חובה להשתמש בו לשאלות כמו 'מה האירועים שלי היום?', 'כמה קורסים יש לי?', 'מה החג הקרוב?'. זכור, המערכת כבר יודעת מי המשתמש המחובר, אין צורך לבקש ממנו מזהה.",
    parameters: {
      type: "OBJECT",
      properties: {
        recordType: {
          type: "STRING",
          description: "סוג הרשומה לחיפוש. חייב להיות אחד מ: 'studentEvent', 'courseMeeting', 'course', 'lecturer', 'site', 'room', 'semester', 'year', 'holiday', 'vacation', 'event', 'task'.",
        },
        searchText: {
          type: "STRING",
          description: "טקסט חופשי לחיפוש כללי. יכול להכיל שם של קורס, שם אירוע, או כל מונח אחר שהמשתמש ציין. לדוגמה: 'מבוא לריאקט', 'חופשת חנוכה'.",
        },
        dateQuery: {
          type: "STRING",
          description: "שאילתת תאריך בשפה טבעית, למשל: 'מחר', 'השבוע הבא', 'היום', 'בחודש הבא', '15.6.2025', 'סמסטר א 2025'."
        },
      },
      required: ["recordType"],
    },
  },
  {
    name: "saveOrUpdateRecord",
    description: "כלי להוספה, יצירה, קביעה או עריכה של כל ישות במערכת. יש להשתמש בו רק לאחר איסוף כל המידע הנחוץ מהמשתמש. הפרמטר 'recordType' הוא קריטי. לעריכה, חובה לספק את ה-'id' של הפריט הקיים. עבור אירועים אישיים ('studentEvent'), המערכת תשייך אותם אוטומטית למשתמש המחובר.",
    parameters: {
      type: "OBJECT",
      properties: {
        recordType: {
          type: "STRING",
          description: "סוג הרשומה לשמירה. חייב להיות אחד מ: 'studentEvent', 'courseMeeting', 'course', 'lecturer', וכו'.",
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
  {
    name: "deleteRecord",
    description: "כלי למחיקה, הסרה או ביטול של כל ישות מהמערכת. לפני השימוש, יש לוודא שיש לך את המזהה הייחודי (ID) של הפריט למחיקה. אם אין לך, השתמש קודם בכלי 'findRecords' כדי למצוא אותו.",
    parameters: {
      type: "OBJECT",
      properties: {
        recordType: {
          type: "STRING",
          description: "סוג הרשומה למחיקה, למשל 'course', 'studentEvent'.",
        },
        recordId: {
          type: "STRING",
          description: "ה-ID הייחודי של הפריט למחיקה.",
        },
        parentId: { type: "STRING", description: "עבור ישויות מקוננות, זהו ה-ID של פריט האב (למשל, yearCode עבור סמסטר)."}
      },
      required: ["recordType", "recordId"],
    },
  },
];