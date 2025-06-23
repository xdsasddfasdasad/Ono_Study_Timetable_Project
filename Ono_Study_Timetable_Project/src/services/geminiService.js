// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools } from '../config/aiTools';

const API_KEY = "AIzaSyBg-rTGVAAU8A4qYZt6FHrWb2iufy9drjc";
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools: tools,
  systemInstruction: `
    אתה "אוני", סוכן AI ועוזר אישי לסטודנטים... (ההנחיה נשארת כפי שהיא)
  `,
  toolConfig: {
    functionCallingConfig: { mode: "ANY" },
  },
});

// ✨ FIX: The entire service is now one stateless function. We removed startChat and getAIResponse.

// Helper to convert our message format to Gemini's format
const convertToGeminiHistory = (messages) => {
  const today = new Date().toISOString().slice(0, 10);
  const history = [
      // Add the system context at the beginning of the conversation
      { role: "user", parts: [{ text: `הקשר מערכת: התאריך היום הוא ${today}.` }] },
      { role: "model", parts: [{ text: "הבנתי." }] }
  ];

  messages.forEach(msg => {
    // Gemini uses 'model' for the AI's role
    const role = msg.sender === 'ai' ? 'model' : 'user';
    history.push({ role, parts: [{ text: msg.text }] });
  });
  
  return history;
};

export const sendMessageToAI = async (messageHistory, functionHandler) => {
    
    const contents = convertToGeminiHistory(messageHistory);
    console.log("Sending structured contents to AI:", contents);

    const result = await model.generateContent({ contents, tools });
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
        
        // Add the tool calls and their responses to the history for the final generation
const finalContents = [
            ...contents,
            // This is the model's turn, indicating it decided to use tools
            { role: 'model', parts: [{ toolCalls: toolCalls }] }, 
            // This is our turn, providing the results of the tools
            { role: 'function', parts: functionResponses }
        ];

        const secondResult = await model.generateContent({ contents: finalContents, tools });
        return secondResult.response.text();

    } else {
        console.log("❌ AI did NOT respond with a tool call. Raw response text:", response.text());
        return response.text() || "מצטער, לא הצלחתי להבין את הבקשה. תוכל לנסח אותה מחדש?";
    }
};