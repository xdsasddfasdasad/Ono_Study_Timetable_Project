// src/services/geminiService.js

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error("CRITICAL ERROR: VITE_GEMINI_API_KEY is not defined in your .env file.");
}

export const genAI = new GoogleGenerativeAI(API_KEY); 

const modelConfig = {
    model: "gemini-1.5-flash-latest",
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    // ... other settings
];

/**
 * מנהל שיחה עם Gemini API, כולל תמיכה ב-Function Calling.
 * @param {Array<Object>} history - היסטוריית השיחה המלאה, בפורמט הנדרש ע"י ה-API.
 * @param {Array} tools - מערך הכלים שה-AI יכול להשתמש בהם.
 * @param {string} systemInstruction - ההנחיות למודל.
 * @returns {Promise<Object>} אובייקט תגובה מובנה מה-AI.
 */
export const runAIAgent = async (history, tools, systemInstruction) => {
    console.log(`[geminiService] Running agent with history...`, history);
    
    try {
        const model = genAI.getGenerativeModel({
            ...modelConfig,
            tools: [{ functionDeclarations: tools }],
            systemInstruction: systemInstruction,
            safetySettings,
        });

        // שינוי מרכזי: שולחים את כל ההיסטוריה ישירות ל-startChat
        const chat = model.startChat({ history });
        
        // sendMessage מקבל מחרוזת ריקה כדי לבקש מהמודל להגיב על סמך ההיסטוריה (שכוללת את הודעת המשתמש האחרונה)
        const result = await chat.sendMessage(""); 
        const response = result.response;
        
        const functionCalls = response.functionCalls();
        const textResponse = response.text();

        console.log(`[geminiService] AI Response Details:`, { textResponse, functionCalls });
        
        // נבנה את אובייקט התגובה שיוחזר ל-Context
        const agentResponse = {
            role: 'agent',
            text: textResponse,
            functionCall: (functionCalls && functionCalls.length > 0) ? functionCalls[0] : null,
        };

        return { response: agentResponse };

    } catch (error) {
        console.error("[geminiService] An error occurred while communicating with the Google AI API:", error);
        throw new Error("Failed to get a response from the AI service.");
    }
};