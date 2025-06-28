// src/config/aiTools.js

// This file defines the schema for the tools (functions) that are made available to the AI model (Gemini).
// This structure tells the AI what functions it can call, what they do, and what parameters they expect.
// The AI uses this information to decide when to call a function to get information from our system
// instead of just trying to answer from its general knowledge.

export const tools = [
  {
    // Each object in this array can contain a set of function declarations.
    functionDeclarations: [
      {
        // `name`: The exact name of the function to be called in our application's code.
        name: "getCalendarEvents",
        // `description`: A clear, natural language explanation of what the function does.
        // The AI uses this description to determine if the function is relevant to the user's query.
        // (Hebrew: "Retrieve all event types from the student's calendar for a given date range.")
        description: "Fetches all types of events from the student's calendar (classes, holidays, vacations, general events, tasks, and personal events) for a given date range.",
        // `parameters`: An object defining the arguments the function accepts.
        parameters: {
          type: "OBJECT",
          properties: {
            startDate: {
              type: "STRING",
              // NOTE: The 'format: "DATE"' property was removed. While it's part of the OpenAPI spec,
              // simply describing the required format (YYYY-MM-DD) in the description often yields
              // more reliable results with large language models.
              description: "The start date for the search, in YYYY-MM-DD format.",
            },
            endDate: {
              type: "STRING",
              description: "The end date for the search, in YYYY-MM-DD format.",
            },
          },
          required: ["startDate", "endDate"],
        },
      },
      {
        name: "getStudentCourses",
        // (Hebrew: "Retrieve the list of courses a student is enrolled in for a specific semester.")
        description: "Retrieves the list of courses the student is enrolled in for a specific semester. If no semester is specified, it returns the courses for the current semester.",
        parameters: {
            type: "OBJECT",
            properties: {
                semesterCode: {
                    type: "STRING",
                    description: "The semester code (e.g., 'S24A'). This is an optional parameter.",
                },
            },
        },
      },
      {
        name: "getCourseDefinitions",
        // (Hebrew: "Retrieve a list of all course definitions in the system. Can be filtered by semester or searched by name.")
        description: "Retrieves a list of all available course definitions in the system. Can be filtered by semester or searched for a specific course by its name.",
        parameters: {
            type: "OBJECT",
            properties: {
                semesterCode: {
                    type: "STRING",
                    description: "An optional semester code to filter by (e.g., 'S25A').",
                },
                courseName: {
                    type: "STRING",
                    description: "A course name (or part of it) to search for (optional).",
                }
            },
        },
      },
      {
        name: "getLecturerInfo",
        // (Hebrew: "Retrieve information about all lecturers in the system, or a specific lecturer by name.")
        description: "Retrieves information about all lecturers in the system, or about a specific lecturer by name.",
        parameters: {
            type: "OBJECT",
            properties: {
                name: {
                    type: "STRING",
                    description: "The name of the lecturer to search for (optional).",
                },
            },
        },
      },
      {
        // This is a new tool added to handle site and room queries.
        name: "getSiteAndRoomInfo",
        // (Hebrew: "Retrieve information about all sites (campuses) and their rooms, or search for a specific room.")
        description: "Retrieves information about all sites (campuses) and the rooms within them, or searches for a specific room.",
        parameters: {
            type: "OBJECT",
            properties: {
                roomCode: {
                    type: "STRING",
                    description: "The specific room code to search for (optional).",
                },
            },
        },
      },
    ],
  },
];