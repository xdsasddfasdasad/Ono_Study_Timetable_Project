// src/utils/promptProcessor.js
import { formatISO, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

/**
 * פונקציה זו מקבלת את קלט המשתמש הגולמי ומחפשת מונחי זמן יחסיים.
 * אם היא מוצאת, היא מחשבת את טווח התאריכים ומחזירה הודעה משודרגת.
 */
export const processUserInputForDates = (text) => {
    const now = new Date();
    const lowerCaseText = text.toLowerCase();
    let dateRange = null;

    if (lowerCaseText.includes("מחר")) {
        const tomorrow = addDays(now, 1);
        dateRange = {
            start: startOfDay(tomorrow).toISOString(),
            end: endOfDay(tomorrow).toISOString(),
        };
    } else if (lowerCaseText.includes("היום")) {
        dateRange = {
            start: startOfDay(now).toISOString(),
            end: endOfDay(now).toISOString(),
        };
    } else if (lowerCaseText.includes("השבוע")) {
        dateRange = {
            start: startOfWeek(now, { weekStartsOn: 0 }).toISOString(), // Assuming Sunday start
            end: endOfWeek(now, { weekStartsOn: 0 }).toISOString(),
        };
    }
    // ניתן להוסיף כאן עוד תנאים: "אתמול", "החודש", "שבוע הבא" וכו'.

    if (dateRange) {
        // "מזריקים" את המידע ההקשרי לתוך ההודעה
        const contextBlock = `[contextual_date_range: start="${dateRange.start}", end="${dateRange.end}"]`;
        return `${text} ${contextBlock}`;
    }

    return text; // אם לא נמצא מונח זמן, מחזירים את הטקסט המקורי
};