// src/utils/promptProcessor.js

// This utility file serves as a natural language pre-processor for user input.
// Its primary function is to detect relative time-based keywords (e.g., 'today', 'this week')
// in a user's prompt and inject a precise, machine-readable date range into the text
// before it's sent to the AI. This offloads a critical, deterministic task from the
// probabilistic AI, leading to more reliable and accurate function calls.

import { formatISO, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

/**
 * Takes a raw user text input and scans it for common, relative time-based keywords in Hebrew.
 * If a keyword is found, the function calculates the precise start and end dates for that range
 * (e.g., 'this week' becomes the start of Sunday to the end of Saturday). It then appends this
 * date range as a structured, machine-readable context block to the original text.
 * If no keywords are found, it returns the original text unmodified.
 * @param {string} text - The raw text input from the user.
 * @returns {string} The original text, potentially with an appended context block.
 */
export const processUserInputForDates = (text) => {
    // Get the current date and time to serve as the anchor for all relative calculations.
    const now = new Date();
    const lowerCaseText = text.toLowerCase();
    let dateRange = null;

    // Check for the keyword "tomorrow" (Hebrew: מחר).
    if (lowerCaseText.includes("מחר")) {
        const tomorrow = addDays(now, 1);
        dateRange = {
            start: startOfDay(tomorrow).toISOString(),
            end: endOfDay(tomorrow).toISOString(),
        };
    // Check for the keyword "today" (Hebrew: היום).
    } else if (lowerCaseText.includes("היום")) {
        dateRange = {
            start: startOfDay(now).toISOString(),
            end: endOfDay(now).toISOString(),
        };
    // Check for the keyword "this week" (Hebrew: השבוע).
    } else if (lowerCaseText.includes("השבוע")) {
        dateRange = {
            // Note: `weekStartsOn: 0` specifies Sunday as the first day of the week.
            start: startOfWeek(now, { weekStartsOn: 0 }).toISOString(),
            end: endOfWeek(now, { weekStartsOn: 0 }).toISOString(),
        };
    }
    // More conditions can be added here to handle other relative terms like
    // 'yesterday', 'next month', 'last week', etc., making the pre-processor more powerful.

    // If a date range was successfully calculated...
    if (dateRange) {
        // ...inject the calculated date range as a structured context block into the message.
        // This format is designed to be easily parsed by the downstream system (the AI's system prompt)
        // while being ignored by the user if it were ever displayed.
        const contextBlock = `[contextual_date_range: start="${dateRange.start}", end="${dateRange.end}"]`;
        return `${text} ${contextBlock}`;
    }

    // If no time-based keywords were detected, return the original, untouched user input.
    return text;
};