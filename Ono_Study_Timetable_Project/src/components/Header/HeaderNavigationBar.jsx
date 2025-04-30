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
  CircularProgress,
} from "@mui/material";
import { Logout } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom"; 
import SchoolIcon from "@mui/icons-material/School";
import { useAuth } from '../../context/AuthContext.jsx'; 

const HeaderNavigationBar = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isLoading } = useAuth();

  // --- menu state ---
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  if (isLoading) {
      return (
          <AppBar position="static" color="primary">
              <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                   <Box sx={{ display: "flex", alignItems: "center", visibility: 'hidden' }}>
                       <IconButton size="small" sx={{ ml: 2 }}> <Avatar /> </IconButton>
                   </Box>
                   <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                       <SchoolIcon />
                       <Typography variant="h6" noWrap> Timetable System </Typography>
                   </Box>
                   <Box sx={{ display: "flex", alignItems: "center" }}>
                       <CircularProgress color="inherit" size={24} />
                   </Box>
              </Toolbar>
          </AppBar>
      );
  }

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", flexShrink: 0, mr: 3 }}
          onClick={() => navigate("/home")}
        >
          <SchoolIcon />
          <Typography variant="h6" noWrap>
            Timetable System
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
          {currentUser && (
            <>
              <Button component={RouterLink} to="/home" color="inherit" size="small">Home</Button>
              <Button component={RouterLink} to="/timetable/calendar" color="inherit" size="small">Calendar</Button>
              <Button component={RouterLink} to="/timetable/management" color="inherit" size="small">Management</Button>
              <Button component={RouterLink} to="/timetable/list" color="inherit" size="small">List View</Button>
              <Button component={RouterLink} to="/dashboard" color="inherit" size="small">Dashboard</Button>
              <Button component={RouterLink} to="/students" color="inherit" size="small">Students</Button>
              <Button component={RouterLink} to="/help" color="inherit" size="small">Help</Button>
            </>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, ml: 3 }}>
           {currentUser ? (
             <>
               <Typography sx={{ display: { xs: 'none', sm: 'block' }, mr: 1.5 }}>
                  Hi, {currentUser.firstName || currentUser.username}!
               </Typography>
               <Tooltip title="User menu">
                 <IconButton onClick={handleOpenMenu} size="small">
                   <Avatar alt={currentUser.username} src="https://i.pravatar.cc/40" sx={{ width: 32, height: 32 }} />
                 </IconButton>
               </Tooltip>
               <Menu
                 anchorEl={anchorEl}
                 open={open}
                 onClose={handleCloseMenu}
                 PaperProps={{
                   elevation: 4,
                   sx: {
                     mt: 1.5,
                     overflow: "visible",
                     filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.2))",
                     "&:before": {
                       content: '""', display: "block", position: "absolute",
                       top: 0, right: 14, width: 10, height: 10,
                       bgcolor: "background.paper", transform: "translateY(-50%) rotate(45deg)",
                       zIndex: 0,
                     },
                   },
                 }}
                 transformOrigin={{ horizontal: "right", vertical: "top" }}
                 anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
               >
                 <MenuItem onClick={() => {
                     console.log("Header: Logout menu item clicked.");
                     logout();
                     handleCloseMenu(); 
                   }}>
                   <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
                 </MenuItem>
               </Menu>
             </>
           ) : (
               <Button component={RouterLink} to="/login" color="inherit">Login</Button>
           )}
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default HeaderNavigationBar;