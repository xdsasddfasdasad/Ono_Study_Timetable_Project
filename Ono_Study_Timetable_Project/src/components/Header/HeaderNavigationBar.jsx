import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, Tooltip } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School"; // אפשר להחליף בלוגו שלך

const HeaderNavigationBar = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left Side: Profile Avatar + Logout */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tooltip title="Student Management">
            <IconButton onClick={() => navigate("/students")} color="inherit">
              <Avatar alt="User" src="https://i.pravatar.cc/40" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton onClick={() => navigate("/login")} color="inherit">
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Center: Logo + Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={() => navigate("/home")}>
          <SchoolIcon />
          <Typography variant="h6" noWrap>
            Timetable System
          </Typography>
        </Box>

        {/* Right: Navigation Links */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button color="inherit" onClick={() => navigate("/home")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/schedule/calendar")}>Calendar</Button>
          <Button color="inherit" onClick={() => navigate("/schedule/management")}>Schedule Management</Button>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          <Button color="inherit" onClick={() => navigate("/help")}>Help</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderNavigationBar;
