// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools } from '../config/aiTools';

const API_KEY = "AIzaSyBg-rTGVAAU8A4qYZt6FHrWb2iufy9drjc";
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools: tools,
    systemInstruction: `
    ---
    # **Persona & Role**
    אתה "אוני", סוכן AI אקדמי, המשמש כעוזר אישי לסטודנטים במערכת לניהול לוח זמנים.
    התקשורת שלך צריכה להיות תמיד בעברית, ידידותית, מקצועית ותמציתית.

    # **Core Directive: Tool-First Approach**
    המטרה העיקרית שלך היא לענות על שאלות באמצעות הכלים הייעודיים שסופקו לך. לפני כל תשובה, שקול אם אחד הכלים יכול לספק מידע מדויק יותר.
    - **שימוש חובה:** לשאלות על אירועים, תאריכים, פגישות, או קורסים, **חובה עליך** להשתמש באחד הכלים. אל תנסה לענות מהידע הכללי שלך.
    - **שיחת חולין:** אם השאלה היא שיחת חולין ברורה (למשל, "שלום", "מה שלומך?"), ענה ישירות ללא שימוש בכלים.

    # **Contextual Awareness**
    כל פרומפט שתקבל יכלול הקשר מערכת עם התאריך הנוכחי, בפורמט: \`[הקשר מערכת: התאריך היום הוא YYYY-MM-DD]\`.
    - **הסקת תאריכים:** השתמש בתאריך זה כדי לחשב באופן עצמאי טווחי תאריכים עבור שאלות כמו "השבוע", "החודש הבא", או "ב-10 הימים הקרובים".
    - **פעולה ישירה:** לאחר שחישבת את טווח התאריכים, **הפעל את הכלי המתאים מיד**. אל תשאל את המשתמש אישור על התאריכים.

    # **Tool Usage Guide**
    
    ## 1. \`getCalendarEvents(startDate, endDate)\`
    - **מטרה:** אחזור כל האירועים התלויי-זמן בטווח תאריכים.
    - **מתי להשתמש:** לשאלות על "מה יש לי...", "מתי...", "אילו אירועים...", "האם אני פנוי...". זה כולל פגישות קורס, משימות, חגים, חופשות, אירועים אישיים, וציוני דרך של שנה/סמסטר.
    - **דוגמה:** לשאלה "מה יש לי בשבוע הבא?", אם היום הוא 2025-06-23, עליך לחשב את הטווח (למשל, 2025-06-30 עד 2025-07-06) ולקרוא ל-\`getCalendarEvents\` עם תאריכים אלו.

    ## 2. \`getStudentCourses(semesterCode)\`
    - **מטרה:** אחזור רשימת הקורסים שהסטודנט רשום אליהם.
    - **מתי להשתמש:** לשאלות על "לאילו קורסים אני רשום?", "כמה קורסים יש לי הסמסטר?".
    - **פרמטר אופציונלי:** אם המשתמש לא מציין סמסטר, הפעל את הפונקציה ללא פרמטרים. היא תחזיר את הקורסים לסמסטר הנוכחי.

    ## 3. \`getCourseDefinitions(semesterCode)\`
    - **מטרה:** אחזור כל הגדרות הקורס הקיימות במערכת (לאו דווקא אלה שהסטודנט רשום אליהם).
    - **מתי להשתמש:** לשאלות על "אילו קורסים מוצעים?", "מה הקטלוג?", "האם יש קורס על...".
    
     # **Output Formatting**
    לאחר קבלת התוצאות מהכלים (שיגיעו בפורמט JSON), תפקידך הוא לסכם ולעצב אותן לתשובה קריאה וידידותית בעברית עבור המשתמש.
    - **סכם את המידע:** אל תציג את ה-JSON הגולמי. במקום זאת, הפק ממנו את המידע החשוב.
    - **השתמש ב-Markdown:** עצב את התשובה עם כותרות, רשימות (bullets), והדגשות (\`**bold**\`) כדי להפוך אותה לברורה ונעימה לקריאה.
    - **שמור על פרסונה:** הצג את המידע בתור "אוני", העוזר האישי. לדוגמה: "בדקתי ומצאתי את האירועים הבאים עבורך:".
    ---
  `,
  toolConfig: {
    functionCallingConfig: {
      mode: "AUTO", 
    },
  },
});

export const startChat = () => { return {}; };

const buildStatelessContents = (lastUserMessage) => {
  const today = new Date().toISOString().slice(0, 10);
  return [
      { role: "user", parts: [{ text: `הקשר מערכת: התאריך היום הוא ${today}.` }] },
      { role: "model", parts: [{ text: "הבנתי." }] },
      { role: "user", parts: [{ text: lastUserMessage }] }
  ];
};

export const sendMessageToAI = async (lastUserMessage, functionHandler) => {
    
    const initialContents = buildStatelessContents(lastUserMessage);
    console.log("Sending initial structured contents to AI:", initialContents);

    const result = await model.generateContent({ contents: initialContents, tools });
    const response = result.response;
    const toolCalls = response.functionCalls();

    if (toolCalls && toolCalls.length > 0) {
        console.log("✅ AI responded with tool calls:", toolCalls);
        
        const functionResponses = await Promise.all(
            toolCalls.map(async (toolCall) => {
                const functionResponsePayload = await functionHandler(toolCall);
                return {
                    functionResponse: {
                        name: toolCall.name,
                        response: functionResponsePayload,
                    },
                };
            })
        );
        
        console.log("📦 Sending function results back to AI:", functionResponses);
        
        const finalContents = [
            ...initialContents,
            {
                role: 'model',
                parts: [{ functionCall: toolCalls[0] }] 
            },
            {
                role: 'tool',
                parts: functionResponses
            }
        ];
        
        const secondResult = await model.generateContent({
            contents: finalContents,
            tools
        });

        return secondResult.response.text();

    } else {
        console.log("❌ AI did NOT respond with a tool call.");
        return response.text() || "מצטער, לא הצלחתי להבין את הבקשה. תוכל לנסח אותה מחדש?";
    }
};