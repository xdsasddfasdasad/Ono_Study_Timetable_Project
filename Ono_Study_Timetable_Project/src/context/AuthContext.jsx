// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getRecords } from '../utils/storage';

const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  console.log("AuthProvider rendering...");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    console.log("AuthProvider useEffect START");
    try {
      const loggedInUserId = localStorage.getItem('loggedInUserId');
      console.log("AuthProvider useEffect - User ID from localStorage:", loggedInUserId);
      if (loggedInUserId) {
        const students = getRecords('students');
        const user = students ? students.find(s => s.id === loggedInUserId) : null;
        if (user) {
          console.log("AuthProvider useEffect - User found, setting currentUser.");
          setCurrentUser(user);
        } else {
          console.log("AuthProvider useEffect - User ID found but user invalid/missing, clearing localStorage & currentUser.");
          localStorage.removeItem('loggedInUserId');
          setCurrentUser(null);
        }
      } else {
         console.log("AuthProvider useEffect - No user ID found, ensuring currentUser is null.");
         if (currentUser !== null) {
            setCurrentUser(null);
         }
      }
    } catch (error) {
        console.error("AuthProvider useEffect - ERROR:", error);
        setCurrentUser(null);
    } finally {
        console.log("AuthProvider useEffect - FINALLY block reached.");
        console.log("AuthProvider useEffect - Setting isLoading to false.");
        setIsLoading(false);
    }
  }, []);
  const login = (student) => {
    console.log("AuthContext: login function called with student:", student);
    if (student && student.id) {
      console.log(`AuthContext: --- BEFORE calling setCurrentUser for student ID: ${student.id} ---`);
      try {
        setCurrentUser(student);
        console.log(`AuthContext: --- AFTER calling setCurrentUser. State update should be queued. ---`);

        console.log(`AuthContext: Setting loggedInUserId in localStorage to: ${student.id}`);
        localStorage.setItem('loggedInUserId', student.id);
        console.log("AuthContext: Successfully set localStorage.");
      } catch (error) {
        console.error("AuthContext: Error during login state/storage update:", error);
      }
    } else {
      console.error("AuthContext: Login attempt with invalid or missing student data:", student);
    }
  };
    const logout = () => {
      console.log("AuthContext: logout function called.");
      try {
          console.log("AuthContext: Removing 'loggedInUserId' from localStorage.");
          localStorage.removeItem('loggedInUserId');
          console.log("AuthContext: Clearing 'currentUser' state.");
          setCurrentUser(null);
          console.log("AuthContext: Logout process complete in context.");
      } catch (error) {
          console.error("AuthContext: Error during logout (localStorage access?):", error);
      }
    };

  const value = { currentUser, isLoading, login, logout };
  console.log(`AuthProvider rendering Provider with: isLoading=${isLoading}, currentUser=${JSON.stringify(currentUser)}`);
  return (
    <AuthContext.Provider value={value}>
       {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};