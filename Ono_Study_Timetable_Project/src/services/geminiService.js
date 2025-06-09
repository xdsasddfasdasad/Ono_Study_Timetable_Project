// src/services/geminiService.js

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Configuration ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error("CRITICAL ERROR: VITE_GEMINI_API_KEY is not defined in your .env file.");
}
export const genAI = new GoogleGenerativeAI(API_KEY); // Export genAI to be used in context

const modelConfig = {
    model: "gemini-1.5-flash-latest",
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * A stateless function that sends a request to the Gemini API.
 * It creates a new chat session from the provided history for each call.
 *
 * @param {Array<Object>} history - The conversation history.
 * @param {string | object} message - The new message or function response to send.
 * @param {Array} tools - The AI's toolbox.
 * @param {string} systemInstruction - The AI's personality and rules.
 * @returns {Promise<Object>} A promise resolving to the AI's structured response.
 */
export const runAIAgent = async (history, message, tools, systemInstruction) => {
    console.log(`[geminiService] Running agent with history and new message...`);
    
    try {
        const model = genAI.getGenerativeModel({
            ...modelConfig,
            tools: [{ functionDeclarations: tools }],
            systemInstruction: systemInstruction,
            safetySettings,
        });

        // Start a new chat session with the full history for context.
        const chat = model.startChat({ history });

        // Send the new message.
        const result = await chat.sendMessage(message);
        const response = result.response;
        
        const functionCalls = response.functionCalls();
        const textResponse = response.text();

        console.log(`[geminiService] AI Response Details:`, { textResponse, functionCalls });
        
        const agentResponse = {
            role: 'agent',
            text: textResponse,
            functionCall: (functionCalls && functionCalls.length > 0) ? functionCalls[0] : null,
        };

        // Return only the response. The caller manages the state.
        return { response: agentResponse };

    } catch (error) {
        console.error("[geminiService] An error occurred while communicating with the Google AI API:", error);
        throw new Error("Failed to get a response from the AI service.");
    }
};