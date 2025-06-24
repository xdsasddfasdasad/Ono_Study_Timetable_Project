// src/config/aiTools.js

export const tools = [
  {
    functionDeclarations: [
      {
        name: "getCalendarEvents",
        description: "אחזר את כל סוגי האירועים מלוח השנה של הסטודנט (שיעורים, חגים, חופשות, אירועים כלליים, משימות ואירועים אישיים) עבור טווח תאריכים נתון.",
        parameters: {
          type: "OBJECT",
          properties: {
            startDate: {
              type: "STRING",
              // ✨ FIX: Remove the 'format' property
              // format: "DATE", 
              description: "תאריך ההתחלה לחיפוש, בפורמט YYYY-MM-DD.",
            },
            endDate: {
              type: "STRING",
              // ✨ FIX: Remove the 'format' property
              // format: "DATE",
              description: "תאריך הסיום לחיפוש, בפורמט YYYY-MM-DD.",
            },
          },
          required: ["startDate", "endDate"],
        },
      },
      {
        name: "getStudentCourses",
        description: "אחזר את רשימת הקורסים שאליהם הסטודנט רשום לסמסטר ספציפי. אם לא מצוין סמסטר, הפונקציה תחזיר את הקורסים לסמסטר הנוכחי.",
        parameters: {
            type: "OBJECT",
            properties: {
                semesterCode: {
                    type: "STRING",
                    description: "קוד הסמסטר (לדוגמה, 'S24A'). זהו פרמטר אופציונלי.",
                },
            },
        },
      },
      {
        name: "getCourseDefinitions",
        // ✨ FIX: Updated description and parameters
        description: "אחזר רשימה של כל הגדרות הקורס הקיימות במערכת. ניתן לסנן לפי סמסטר או לחפש קורס ספציפי לפי שמו.",
        parameters: {
            type: "OBJECT",
            properties: {
                semesterCode: {
                    type: "STRING",
                    description: "קוד סמסטר אופציונלי לסינון (לדוגמה, 'S25A').",
                },
                courseName: {
                    type: "STRING",
                    description: "שם קורס (או חלק ממנו) לחיפוש (אופציונלי).",
                }
            },
        },
      },
      {
        name: "getLecturerInfo",
        description: "אחזר מידע על כל המרצים במערכת, או על מרצה ספציפי לפי שם.",
        parameters: {
            type: "OBJECT",
            properties: {
                name: {
                    type: "STRING",
                    description: "שם המרצה לחיפוש (אופציונלי).",
                },
            },
        },
      },
      // ✨ NEW TOOL for Sites/Rooms ✨
      {
        name: "getSiteAndRoomInfo",
        description: "אחזר מידע על כל האתרים (קמפוסים) והחדרים שבהם, או חפש חדר ספציפי.",
        parameters: {
            type: "OBJECT",
            properties: {
                roomCode: {
                    type: "STRING",
                    description: "קוד החדר הספציפי לחיפוש (אופציונלי).",
                },
            },
        },
      },
    ],
  },
];