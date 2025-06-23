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
        description: "אחזר רשימה של כל הגדרות הקורס הקיימות במערכת, עם אפשרות לסינון לפי סמסטר.",
        parameters: {
            type: "OBJECT",
            properties: {
                semesterCode: {
                    type: "STRING",
                    description: "קוד סמסטר אופציונלי לסינון (לדוגמה, 'S25A'). אם לא יסופק, יוחזרו כל הקורסים.",
                },
            },
        },
      },
    ],
  },
];