// src/context/AppDataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
// Imports the generic service for fetching data from Firestore collections.
import { fetchCollection } from '../firebase/firestoreService';

// Creates a new React Context. This will be the "pipe" through which our global app data flows.
// It's initialized to null, as the value will be provided by the AppDataProvider.
const AppDataContext = createContext(null);

// This is a custom hook that provides a convenient, shorthand way for any component
// to access the data stored in the AppDataContext. Instead of `useContext(AppDataContext)`,
// components can simply call `useAppData()`.
export const useAppData = () => useContext(AppDataContext);

// This is the Provider component. Its primary responsibility is to fetch all essential,
// non-user-specific data from Firestore ONCE when the application first loads.
// It then provides this data to its entire component tree via the context.
// This is a strategic performance optimization to avoid repeated database calls for the same static data.
export const AppDataProvider = ({ children }) => {
    // A single state object to hold all the fetched data collections.
    const [allData, setAllData] = useState({
        courses: [], meetings: [], lecturers: [],
        years: [], sites: [], students: [],
        holidays: [], vacations: [], events: [], tasks: [],
        studentEvents: []
    });
    // A state to track the initial loading process.
    const [isLoading, setIsLoading] = useState(true);

    // This useEffect hook runs only once, when the AppDataProvider is first mounted.
    // The empty dependency array `[]` ensures this behavior.
    useEffect(() => {
        const loadAllData = async () => {
            try {
                // `Promise.all` is used to trigger all fetch requests in parallel.
                // This is much more efficient than fetching them one by one sequentially.
                const [courses, meetings, lecturers, years, sites, students, holidays, vacations, events, tasks, studentEvents] = await Promise.all([
                    fetchCollection("courses"),
                    fetchCollection("coursesMeetings"),
                    fetchCollection("lecturers"),
                    fetchCollection("years"),
                    fetchCollection("sites"),
                    fetchCollection("students"),
                    fetchCollection("holidays"),
                    fetchCollection("vacations"),
                    fetchCollection("events"),
                    fetchCollection("tasks"),
                    fetchCollection("studentEvents"),
                ]);
                // Once all data is fetched successfully, update the state in a single operation.
                setAllData({ courses, meetings, lecturers, years, sites, students, holidays, vacations, events, tasks, studentEvents });
            } catch (error) {
                // If any of the fetch calls fail, log a critical error.
                // The app might be in an unstable state if this data fails to load.
                console.error("Fatal Error: Could not load app data.", error);
            } finally {
                // No matter the outcome (success or error), always set the loading state to false
                // to unblock the rest of the application's UI.
                setIsLoading(false);
            }
        };
        loadAllData();
    }, []); // The empty dependency array ensures this effect runs only once.

    return (
        // The Provider makes the `value` available to all descendant components that use the `useAppData` hook.
        // We spread the `allData` object and also provide the `isLoading` state.
        <AppDataContext.Provider value={{ ...allData, isLoading }}>
            {children}
        </AppDataContext.Provider>
    );
};