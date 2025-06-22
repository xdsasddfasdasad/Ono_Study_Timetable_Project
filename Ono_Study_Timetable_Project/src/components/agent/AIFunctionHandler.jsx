// src/components/agent/AIFunctionHandler.jsx

// ⬇️ שלב 1: ייבוא הפונקציה החדשה והייעודית מהקובץ 'getAllVisibleEvents.js'.
// שינינו את שם הפונקציה המיובאת ל-fetchEventsForAI.
import { fetchEventsForAI } from '../../utils/getAllVisibleEvents';

// זו לא קומפוננטה של ריאקט, אלא פונקציית שירות שמתרגמת בקשות AI לפעולות במערכת.
// היא מקבלת את בקשת הכלי מ-Gemini ומחזירה פונקציה שממתינה ל-currentUser.
export const handleAIFunctionCall = async (toolCall) => {
    
    const functionName = toolCall.functionCall.name;
    const args = toolCall.functionCall.args;

    console.log(`[AIFunctionHandler] AI is requesting to call function: '${functionName}' with arguments:`, args);

    // תבנית זו (Currying) מאפשרת לנו להפריד בין קבלת בקשת ה-AI
    // לבין קבלת המידע על המשתמש המחובר, שזמין רק בקומפוננטה.
    const callFunction = async (currentUser) => {
        // בדיקת בטיחות: ודא שהמשתמש מחובר לפני ביצוע פעולות רגישות.
        if (!currentUser) {
            console.error("[AIFunctionHandler] Error: Cannot execute function call, user is not logged in.");
            return { tool: toolCall, output: { error: "User not logged in. Please log in to get personal data." }};
        }

        // ודא שהפרמטרים הנדרשים (שהוגדרו ב-aiTools.js) אכן הגיעו.
        if (functionName === 'getCalendarEvents' && (!args.startDate || !args.endDate)) {
            console.error("[AIFunctionHandler] Error: Missing startDate or endDate for getCalendarEvents.");
            return { tool: toolCall, output: { error: "Missing required date parameters to fetch events." }};
        }

        switch (functionName) {
            case 'getCalendarEvents':
                try {
                    console.log(`[AIFunctionHandler] Executing 'fetchEventsForAI' for user: ${currentUser.uid}`);
                    
                    // ⬇️ שלב 2: שימוש בפונקציה החדשה והיעילה.
                    // הפונקציה 'fetchEventsForAI' כבר מסננת לפי תאריכים ומחזירה פורמט פשוט.
                    // היא גם מחזירה את התוצאה עטופה באובייקט { events: [...] } או { error: "..." }.
                    const result = await fetchEventsForAI(currentUser, args.startDate, args.endDate);

                    // ⬇️ שלב 3: החזרת התוצאה ישירות, כפי שהיא, ל-Gemini.
                    return { tool: toolCall, output: result };
                } catch (error) {
                    console.error("[AIFunctionHandler] Error executing 'fetchEventsForAI':", error);
                    return { tool: toolCall, output: { error: error.message } };
                }

            // ניתן להוסיף כאן case-ים נוספים עבור כלים עתידיים, למשל:
            // case 'getLecturerInfo':
            //   const lecturerData = await fetchLecturerByName(args.lecturerName);
            //   return { tool: toolCall, output: { data: lecturerData } };
            // ...

            default:
                console.warn(`[AIFunctionHandler] Unknown function call received from AI: ${functionName}`);
                return { tool: toolCall, output: { error: `The function '${functionName}' is not recognized by the system.` } };
        }
    }
    
    // הפונקציה הראשית מחזירה את הפונקציה הפנימית.
    // הקומפוננטה שקראה ל-handleAIFunctionCall תקרא לפונקציה המוחזרת עם currentUser.
    return callFunction;
};