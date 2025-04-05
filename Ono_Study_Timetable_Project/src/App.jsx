import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./HeaderNavigationBar.css"; // או tailwind במידת הצורך

const HeaderNavigationBar = () => {
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="navbar__logo" onClick={() => navigate("/home")}>
        🎓 Timetable System
      </div>
      <nav className="navbar__menu">
        <NavLink to="/home" className="navbar__item">Home</NavLink>
        <NavLink to="/schedule/calendar" className="navbar__item">Calendar</NavLink>
        <NavLink to="/schedule/list" className="navbar__item">List</NavLink>
        <NavLink to="/students" className="navbar__item">Students</NavLink>
        <NavLink to="/dashboard" className="navbar__item">Dashboard</NavLink>
        <NavLink to="/help" className="navbar__item">Help</NavLink>
      </nav>
    </header>
  );
};

export default HeaderNavigationBar;
