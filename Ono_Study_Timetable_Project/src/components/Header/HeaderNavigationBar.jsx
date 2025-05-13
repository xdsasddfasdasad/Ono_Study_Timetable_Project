// src/components/Header/HeaderNavigationBar.jsx
import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, Tooltip, Menu, MenuItem,
  CircularProgress, ListItemIcon, useTheme, useMediaQuery, Divider // Added Divider
} from "@mui/material";
import { Logout, Menu as MenuIcon, Home as HomeIcon, CalendarToday as CalendarIcon, ListAlt as ListIcon, Dashboard as DashboardIcon, Settings as SettingsIcon, People as PeopleIcon, School as SchoolIcon, HelpOutline as HelpIcon } from "@mui/icons-material"; // Added more icons
import { useNavigate, Link as RouterLink, NavLink } from "react-router-dom";
import { useAuth } from '../../context/AuthContext.jsx'; // Firebase-ready AuthContext
import logo from '/logo.png'; // Assuming logo is in public folder

const HeaderNavigationBar = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isLoading: authIsLoading } = useAuth(); // logout is now async
  const theme = useTheme();

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNav, setAnchorElNav] = useState(null);

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  // ✅ Updated handleLogout to be async and await context logout
const handleLogout = async () => {
    console.log("[Header] 1. handleLogout called");
    handleCloseUserMenu();
    try {
        await logout(); // From AuthContext
        console.log("[Header] 4. logout() from AuthContext finished");
    } catch (error) { console.error("[Header] Error during context logout:", error); }
};

  // Define navigation items based on user login status and potential roles
  const navItems = currentUser ? [
    { label: 'Home', path: '/home', icon: <HomeIcon fontSize="small" /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: 'My Timetable', path: '/timetable/calendar', icon: <CalendarIcon fontSize="small" /> },
    { label: 'List View', path: '/timetable/list', icon: <ListIcon fontSize="small" /> },
    { label: 'Manage Timetable', path: '/timetable/management', icon: <SettingsIcon fontSize="small" /> },
    { label: 'Manage Students', path: '/students', icon: <PeopleIcon fontSize="small" /> },
    { label: 'Help', path: '/help', icon: <HelpIcon fontSize="small" /> },
  ] : [];


  // Loading state for the AppBar while authentication is resolving
  if (authIsLoading) {
    return (
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'center' }}>
          <CircularProgress color="inherit" size={28} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'primary.main', // Can use theme directly
        // Example for semi-transparent: backgroundColor: alpha(theme.palette.primary.main, 0.9),
        // backdropFilter: 'blur(5px)', // If using transparency
      }}
    >
      <Toolbar>
        {/* Logo and App Title Section */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", mr: 2, flexShrink: 0 }}
          onClick={() => navigate(currentUser ? "/dashboard" : "/home")} // Navigate to dashboard if logged in, else home
        >
          <img src={logo} alt="App Logo" style={{ height: '36px', verticalAlign: 'middle' }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}
          >
            Timetable Pro
          </Typography>
        </Box>

        {/* Desktop Navigation Links */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', lg: 'flex' }, justifyContent: 'center', gap: 0.5 }}>
          {navItems.map((item) => (
            <Button
              key={item.label}
              component={NavLink}
              to={item.path}
              color="inherit"
              size="small"
              startIcon={item.icon}
              sx={{
                mx: 0.5,
                '&.active': {
                   backgroundColor: 'rgba(255, 255, 255, 0.15)', // Subtle active background
                   fontWeight: 'medium',
                },
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* User Area: Login Button or User Menu */}
        <Box sx={{ ml: { xs: 1, lg: 2 }, flexShrink: 0 }}>
          {currentUser ? (
            <>
              <Tooltip title="User Options">
                <IconButton onClick={handleOpenUserMenu} size="small" sx={{ p: 0 }}>
                  <Avatar alt={currentUser.username || currentUser.email} sx={{ width: 36, height: 36, bgcolor: 'secondary.light', fontSize: '1rem' }}>
                    {currentUser.firstName ? currentUser.firstName[0].toUpperCase() : (currentUser.email ? currentUser.email[0].toUpperCase() : '?')}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleCloseUserMenu}
                PaperProps={{
                  elevation: 0,
                  sx: { overflow: 'visible', filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))', mt: 1.5, '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1, }, '&:before': { content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0, }, },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                 <Box sx={{px: 2, py: 1}}>
                     <Typography variant="caption" display="block" color="text.secondary">Logged in as:</Typography>
                     <Typography variant="body2" sx={{fontWeight: 'medium'}}>{currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.email}</Typography>
                 </Box>
                 <Divider />
                 {/* Add profile link if needed: <MenuItem component={RouterLink} to="/profile" onClick={handleCloseUserMenu}><AccountCircle sx={{mr:1}}/>Profile</MenuItem> */}
                 <MenuItem onClick={handleLogout}> <Logout fontSize="small" sx={{ mr: 1.5 }} /> Logout </MenuItem>
              </Menu>
            </>
          ) : (
            !authIsLoading && ( // Show login button only if auth is not loading and no user
              <Button component={RouterLink} to="/login" color="inherit" variant="outlined" size="small">
                Login
              </Button>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
export default HeaderNavigationBar;