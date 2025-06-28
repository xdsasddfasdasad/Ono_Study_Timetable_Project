// src/services/geminiService.js

// This file serves as a dedicated service layer for all communications with the Google Gemini AI.
// It encapsulates the API key, model configuration, system prompt, and the logic for handling
// the multi-turn conversation required for function calling (tools).

import { GoogleGenerativeAI } from "@google/generative-ai";
// Imports the tool schema that tells the AI which functions it can call.
import { tools } from '../config/aiTools';

// The API key for accessing the Gemini API.
// IMPORTANT: In a production environment, this should be stored securely as an environment variable,
// not hardcoded directly in the source code.
const API_KEY = "YOUR_API_KEY_HERE";
// Initialize the main AI client with the API key.
const genAI = new GoogleGenerativeAI(API_KEY);

// Configure and get a reference to the specific AI model we want to use.
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Specifies the model version.
  tools: tools, // Provides the AI with the list of available functions it can call.
    
    // The `systemInstruction` is a powerful prompt that sets the rules and persona for the AI.
    // It's the most critical part of ensuring the AI behaves as expected.
    systemInstruction: `
    ---
    # **Persona & Role**
    // (Hebrew: You are "Uni", an academic AI agent...)
    You are "Uni", an academic AI agent, serving as a personal assistant for students in a timetable management system.
    Your communication must always be in Hebrew, friendly, professional, and concise.

    # **Core Directive: Tool-First Approach**
    // This section forces the AI to prefer using our defined functions over its general knowledge.
    Your primary goal is to answer questions using the dedicated tools provided. Before every response, consider if one of the tools can provide a more accurate answer.
    - **Mandatory Use:** For questions about events, dates, meetings, or courses, you **must** use one of the tools. Do not try to answer from your general knowledge.
    - **Small Talk:** If the question is clearly small talk (e.g., "Hello", "How are you?"), answer directly without using tools.

    # **Contextual Awareness**
    // This tells the AI how to interpret a piece of system context we will provide with every message.
    Every prompt you receive will include system context with the current date, in the format: \`[System Context: Today's date is YYYY-MM-DD]\`.
    - **Date Inference:** Use this date to independently calculate date ranges for questions like "this week", "next month", or "in the next 10 days".
    - **Direct Action:** After calculating the date range, **immediately call the appropriate tool**. Do not ask the user for confirmation of the dates.

    # **Tool Usage Guide**
    // This provides specific, explicit instructions on when to use each tool.
    
    ## 1. \`getCalendarEvents(startDate, endDate)\`
    - **Purpose:** Retrieve all time-dependent events within a date range.
    - **When to Use:** For questions about "what do I have...", "when is...", "what events...", "am I free...". This includes course meetings, tasks, holidays, etc.
    - **Example:** For the question "what do I have next week?", if today is 2025-06-23, you must calculate the range (e.g., 2025-06-30 to 2025-07-06) and call \`getCalendarEvents\` with those dates.

    ## 2. \`getStudentCourses(semesterCode)\`
    - **Purpose:** Retrieve the list of courses the student is enrolled in.
    - **When to Use:** For questions about "what courses am I registered for?", "how many courses do I have this semester?".
    - **Optional Parameter:** If the user does not specify a semester, call the function without parameters. It will return the courses for the current semester.

    ## 3. \`getCourseDefinitions(semesterCode)\`
    - **Purpose:** Retrieve all course definitions in the system (not necessarily those the student is enrolled in).
    - **When to Use:** For questions about "what courses are offered?", "what is the catalog?", "is there a course about...".
    
     # **Output Formatting**
    // This is a crucial instruction that forces the AI to respond in a structured JSON format,
    // which is much more reliable for our application to parse and display than free text.
    After receiving the results from the tools, your job is to transform the information into a structured JSON.
    - **Critical Rule:** Your final response must be **only a JSON object**, with no preceding or concluding text.
    - **JSON Structure:** The object must contain a 'response' key with two fields:
      1. 'intro_text': A friendly opening string in Hebrew (e.g., "I found 5 events for you this week:").
      2. 'items': An array of objects, where each object represents one piece of information.
    - **Item Structure:** Each object in the 'items' array must contain the following keys:
      - 'primary_text': The main title of the item (e.g., course or event name).
      - 'secondary_text': Secondary information (e.g., date and time).
      - 'type': The item type (e.g., 'courseMeeting', 'task').
      - 'details': An array of strings with additional details (e.g., "Lecturer: Dr. Israeli", "Location: Room 101").
    ---
    # **Example of a valid JSON response:**
    // Providing a clear example helps the AI understand the expected output format perfectly.
    {
      "response": {
        "intro_text": "מצאתי 2 אירועים רלוונטיים:",
        "items": [
          {
            "primary_text": "מבוא למדעי המחשב",
            "secondary_text": "יום שני, 23 ביוני 2025 | 10:00 - 11:30",
            "type": "courseMeeting",
            "details": ["מרצה: פרופ' לוי", "מיקום: חדר 204 (בניין שרייבר)"]
          },
          {
            "primary_text": "הגשת תרגיל 3",
            "secondary_text": "יום שלישי, 24 ביוני 2025 | 23:59",
            "type": "task",
            "details": ["קורס: אלגברה לינארית"]
          }
        ]
      }
    }
  `,
  // Configuration for how the AI should use the tools. "AUTO" means it decides on its own.
  toolConfig: {
    functionCallingConfig: {
      mode: "AUTO", 
    },
  },
});

// A placeholder function, though not strictly necessary, it can be useful for initializing chat state.
export const startChat = () => { return {}; };

// A helper function to construct the conversation history for the AI.
// This is a "stateless" approach, meaning we build the context from scratch for each message.
const buildStatelessContents = (lastUserMessage) => {
  const today = new Date().toISOString().slice(0, 10);
  return [
      // We provide the system context about today's date.
      { role: "user", parts: [{ text: `הקשר מערכת: התאריך היום הוא ${today}.` }] },
      // A simple model response to confirm it understood the context. (Hebrew: "Understood.")
      { role: "model", parts: [{ text: "הבנתי." }] },
      // The user's actual, most recent message.
      { role: "user", parts: [{ text: lastUserMessage }] }
  ];
};

// This is the main function that handles a full, multi-turn conversation with the AI.
export const sendMessageToAI = async (lastUserMessage, functionHandler) => {
    
    // --- Turn 1: Send User Message to AI ---
    const initialContents = buildStatelessContents(lastUserMessage);
    console.log("Sending initial structured contents to AI:", initialContents);

    const result = await model.generateContent({ contents: initialContents, tools });
    const response = result.response;
    const toolCalls = response.functionCalls(); // Check if the AI wants to call a function.

    // If the AI responded with a request to call one of our functions...
    if (toolCalls && toolCalls.length > 0) {
        console.log("✅ AI responded with tool calls:", toolCalls);
        
        // --- Turn 2: Execute the Function(s) and Send Results Back ---
        // Execute all the function calls the AI requested, often in parallel.
        const functionResponses = await Promise.all(
            toolCalls.map(async (toolCall) => {
                // `functionHandler` is the `handleAIFunctionCall` function passed in from AIAgentConsole.
                const functionResponsePayload = await functionHandler(toolCall);
                // We must wrap the result in the specific format the AI expects.
                return {
                    functionResponse: {
                        name: toolCall.name,
                        response: functionResponsePayload,
                    },
                };
            })
        );
        
        console.log("📦 Sending function results back to AI:", functionResponses);
        
        // Construct the full conversation history, including the AI's tool call and our function's response.
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
        
        // --- Turn 3: Get the Final, Summarized Answer from the AI ---
        // Send the complete history back to the model so it can generate a natural language response
        // based on the results of the functions we ran for it.
        const secondResult = await model.generateContent({
            contents: finalContents,
            tools
        });

        // Return the final text content.
        return secondResult.response.text();

    } else {
        // If the AI did not respond with a tool call, it's a direct text answer (e.g., for small talk).
        console.log("❌ AI did NOT respond with a tool call.");
        // Hebrew: "Sorry, I could not understand the request. Could you rephrase it?"
        return response.text() || "מצטער, לא הצלחתי להבין את הבקשה. תוכל לנסח אותה מחדש?";
    }
};