// src/config/aiTools.js

export const tools = [
  {
    functionDeclarations: [
      {
        name: "getCalendarEvents",
        description: "אחזר אירועים מלוח השנה של הסטודנט עבור טווח תאריכים נתון. זה כולל קורסים, חגים, חופשות, אירועים כלליים, משימות להגשה ואירועים אישיים שהסטודנט יצר.",
        parameters: {
          type: "OBJECT",
          properties: {
            startDate: {
              type: "STRING",
              format: "DATE",
              description: "תאריך ההתחלה לחיפוש האירועים, בפורמט YYYY-MM-DD.",
            },
            endDate: {
              type: "STRING",
              format: "DATE",
              description: "תאריך הסיום לחיפוש האירועים, בפורמט YYYY-MM-DD.",
            },
          },
          required: ["startDate", "endDate"],
        },
      },
      // בעתיד נוכל להוסיף כלים נוספים כמו:
      // { name: "getLecturerInfo", description: "קבל פרטים על מרצה לפי שם", ... }
      // { name: "findEmptyClassroom", description: "מצא כיתה פנויה בזמן נתון", ... }
    ],
  },
];