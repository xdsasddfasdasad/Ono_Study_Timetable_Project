import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import { Logout } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School";

const HeaderNavigationBar = () => {
  const navigate = useNavigate();

  // --- menu state ---
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  // --- menu actions ---
  const handleStudentManagement = () => {
    navigate("/students");
    handleCloseMenu();
  };

  const handleLogout = () => {
    navigate("/login");
    handleCloseMenu();
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left: Avatar with Menu */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="Open menu">
            <IconButton onClick={handleOpenMenu} size="small" sx={{ ml: 2 }}>
              <Avatar alt="User" src="https://i.pravatar.cc/40" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            onClick={handleCloseMenu}
            PaperProps={{
              elevation: 4,
              sx: {
                mt: 1.5,
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.2))",
                "&:before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem onClick={handleStudentManagement}>Student Management</MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* Center: Logo + Title */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
          onClick={() => navigate("/home")}
        >
          <SchoolIcon />
          <Typography variant="h6" noWrap>
            Timetable System
          </Typography>
        </Box>

        {/* Right: Navigation */}
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
