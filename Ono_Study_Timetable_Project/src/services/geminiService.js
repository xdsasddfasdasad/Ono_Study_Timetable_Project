// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools } from '../config/aiTools'; // ייבוא הכלים שהגדרנו

const API_KEY = "YOUR_GEMINI_API_KEY"; // אחסן את זה במשתני סביבה!
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // מודל מומלץ שיודע להשתמש בכלים
  tools: tools,
});

export const startChat = () => {
    return model.startChat();
};

export const sendMessageToAI = async (chat, message, functionHandler) => {
    console.log("Sending message to AI:", message);
    const result = await chat.sendMessage(message);
    const response = result.response;
    const toolCalls = response.functionCalls;

    if (toolCalls && toolCalls.length > 0) {
        console.log("AI responded with tool calls:", toolCalls);
        // קריאה למטפל הפונקציות שהעברנו
        const functionResponses = await Promise.all(
            toolCalls.map(toolCall => functionHandler(toolCall))
        );
        
        // שליחת התוצאות חזרה ל-AI כדי שינסח תשובה
        const secondResult = await chat.sendMessage(functionResponses);
        return secondResult.response.text();
    } else {
        // אם אין קריאה לפונקציה, פשוט להחזיר את הטקסט
        return response.text();
    }
};