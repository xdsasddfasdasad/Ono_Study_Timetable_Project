// src/context/AppDataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCollection } from '../firebase/firestoreService';

const AppDataContext = createContext(null);

export const useAppData = () => useContext(AppDataContext);

// This provider will be placed in App.jsx and will load ALL data ONCE.
export const AppDataProvider = ({ children }) => {
    const [allData, setAllData] = useState({
        courses: [], meetings: [], lecturers: [],
        years: [], sites: [], students: [],
        holidays: [], vacations: [], events: [], tasks: [],
        studentEvents: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            try {
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
                setAllData({ courses, meetings, lecturers, years, sites, students, holidays, vacations, events, tasks, studentEvents });
            } catch (error) {
                console.error("Fatal Error: Could not load app data.", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAllData();
    }, []);

    return (
        <AppDataContext.Provider value={{ ...allData, isLoading }}>
            {children}
        </AppDataContext.Provider>
    );
};