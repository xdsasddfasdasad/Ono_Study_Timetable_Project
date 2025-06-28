// src/components/Header/HeaderNavigationBar.jsx

import React, { useState } from "react";
// Imports for Material-UI components that build the header's structure and elements.
import {
  AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, Tooltip, Menu, MenuItem,
  CircularProgress, ListItemIcon, useTheme, useMediaQuery, Divider, Badge
} from "@mui/material";
// Imports for all the icons used in the navigation and user menus.
import {
  Logout, Menu as MenuIcon, Home as HomeIcon, CalendarToday as CalendarIcon, ListAlt as ListIcon,
  Dashboard as DashboardIcon, Settings as SettingsIcon, People as PeopleIcon,
  HelpOutline as HelpIcon, Email as EmailIcon
} from "@mui/icons-material";
// Imports for routing: useNavigate for programmatic navigation, NavLink for declarative link styling.
import { useNavigate, NavLink } from "react-router-dom";
// Imports the authentication context to get user data and the logout function.
import { useAuth } from '../../context/AuthContext.jsx';
// Imports the application's logo image.
import logo from '/logo.png';

// This component renders the main header and navigation bar for the application.
// It is responsive and adjusts its layout for mobile and desktop screens.
// It displays different navigation items and controls based on whether a user is logged in.
const HeaderNavigationBar = () => {
  // Hooks for navigation, authentication state, and responsive design.
  const navigate = useNavigate();
  const { currentUser, logout, isLoading: authIsLoading } = useAuth();
  const theme = useTheme();
  // useMediaQuery is a powerful hook that returns true if the screen width matches the query.
  // Here, it's used to detect if the screen is 'lg' (large) or smaller.
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  // State to manage the anchor element for the user and navigation menus.
  // When 'null', the menu is closed. When it's an element, the menu is open and anchored to it.
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNav, setAnchorElNav] = useState(null);

  // Handlers for opening and closing the mobile navigation menu.
  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

  // Handlers for opening and closing the user account menu.
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  // Handles the user logout process.
  const handleLogout = async () => {
    handleCloseUserMenu(); // Close the menu first.
    try {
      await logout();
      // After logout, the AuthContext will update, and ProtectedRoutes will handle redirection.
    } catch (error) {
      console.error("[Header] Logout failed:", error);
    }
  };

  // Defines the list of navigation items. This list is only populated if a user is logged in.
  // A "Messages" link with a badge has been added for future notification features.
  const navItems = currentUser ? [
    { label: 'Home', path: '/home', icon: <HomeIcon fontSize="small" /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: 'Messages', path: '/messages', icon: <EmailIcon fontSize="small" />, badgeContent: 0 }, // Placeholder for message notifications
    { label: 'My Timetable', path: '/timetable/calendar', icon: <CalendarIcon fontSize="small" /> },
    { label: 'List View', path: '/timetable/list', icon: <ListIcon fontSize="small" /> },
    { label: 'Manage Timetable', path: '/manage-timetable', icon: <SettingsIcon fontSize="small" /> },
    { label: 'Manage Students', path: '/manage-students', icon: <PeopleIcon fontSize="small" /> },
    { label: 'Help', path: '/help', icon: <HelpIcon fontSize="small" /> },
  ] : [];

  // While the authentication status is being checked (e.g., on a page refresh),
  // display a simple loading bar to prevent layout shifts or content flashing.
  if (authIsLoading) {
    return (
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'center' }}><CircularProgress color="inherit" size={28} /></Toolbar>
      </AppBar>
    );
  }

  // The main render output for the component.
  return (
    <AppBar position="fixed" elevation={2} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Logo and Brand Name - navigates to home/login on click */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", mr: 2 }} onClick={() => navigate(currentUser ? "/home" : "/login")}>
          <img src={logo} alt="App Logo" style={{ height: 36 }} />
          <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}>Timetable Pro</Typography>
        </Box>

        {/* Mobile Navigation - rendered only on smaller screens when a user is logged in */}
        {isMobile && currentUser && (
          <>
            <IconButton size="large" onClick={handleOpenNavMenu} color="inherit"><MenuIcon /></IconButton>
            <Menu anchorEl={anchorElNav} open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}>
              {navItems.map((item) => (
                <MenuItem key={item.label} component={NavLink} to={item.path} onClick={handleCloseNavMenu}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* Desktop Navigation - rendered only on larger screens */}
        {!isMobile && (
          <Box component="nav" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={NavLink} // Using NavLink to get automatic 'active' class styling
                to={item.path}
                color="inherit"
                size="small"
                startIcon={
                  // If there's badge content, wrap the icon in a Badge component.
                  item.badgeContent > 0 ? (
                    <Badge color="error" variant="dot">{item.icon}</Badge>
                  ) : (
                    item.icon
                  )
                }
                // Custom styling for the active link and on hover.
                sx={{ '&.active': { backgroundColor: 'rgba(255, 255, 255, 0.15)', fontWeight: 'medium' }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' } }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* User Account Section - pushes itself to the far right */}
        <Box sx={{ ml: 'auto' }}>
          {currentUser ? (
            // If user is logged in, show the Avatar and user menu.
            <>
              <Tooltip title="Account">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36 }}>
                    {currentUser.firstName?.[0]?.toUpperCase() || "?"}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                // Custom styling for the menu paper, including a drop shadow and a small arrow pointing to the avatar.
                PaperProps={{ sx: { mt: 1.5, overflow: 'visible', filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))', '&:before': { content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)' } } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="caption" color="text.secondary">Logged in as:</Typography>
                  <Typography variant="body2" fontWeight="medium">{currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.email}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout}><Logout fontSize="small" sx={{ mr: 1.5 }} />Logout</MenuItem>
              </Menu>
            </>
          ) : (
            // If user is not logged in, show a simple Login button.
            <Button component={NavLink} to="/login" color="inherit" variant="outlined" size="small">Login</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderNavigationBar;