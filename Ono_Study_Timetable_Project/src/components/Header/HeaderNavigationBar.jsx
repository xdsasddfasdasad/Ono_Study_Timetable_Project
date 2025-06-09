// src/components/Header/HeaderNavigationBar.jsx

import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, Tooltip, Menu, MenuItem,
  CircularProgress, ListItemIcon, useTheme, useMediaQuery, Divider
} from "@mui/material";
import {
  Logout, Menu as MenuIcon, Home as HomeIcon, CalendarToday as CalendarIcon, ListAlt as ListIcon,
  Dashboard as DashboardIcon, Settings as SettingsIcon, People as PeopleIcon,
  HelpOutline as HelpIcon
} from "@mui/icons-material";
import { useNavigate, NavLink, Link as RouterLink } from "react-router-dom";
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '/logo.png';

const HeaderNavigationBar = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isLoading: authIsLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNav, setAnchorElNav] = useState(null);

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = async () => {
    handleCloseUserMenu();
    try {
      await logout();
    } catch (error) {
      console.error("[Header] Logout failed:", error);
    }
  };

  const navItems = currentUser ? [
    { label: 'Home', path: '/home', icon: <HomeIcon fontSize="small" /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: 'My Timetable', path: '/timetable/calendar', icon: <CalendarIcon fontSize="small" /> },
    { label: 'List View', path: '/timetable/list', icon: <ListIcon fontSize="small" /> },
    { label: 'Manage Timetable', path: '/timetable/management', icon: <SettingsIcon fontSize="small" /> },
    { label: 'Manage Students', path: '/students', icon: <PeopleIcon fontSize="small" /> },
    { label: 'Help', path: '/help', icon: <HelpIcon fontSize="small" /> },
  ] : [];

  if (authIsLoading) {
    return (
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'center' }}>
          <CircularProgress color="inherit" size={28} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="fixed" elevation={2} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>

        {/* Logo */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", mr: 2 }}
          onClick={() => navigate(currentUser ? "/dashboard" : "/home")}
        >
          <img src={logo} alt="App Logo" style={{ height: 36 }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}
          >
            Timetable Pro
          </Typography>
        </Box>

        {/* Responsive Nav Menu (for Mobile) */}
        {isMobile && currentUser && (
          <>
            <IconButton
              size="large"
              aria-label="open navigation menu"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.label}
                  component={RouterLink}
                  to={item.path}
                  onClick={handleCloseNavMenu}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* Desktop Navigation Links */}
        {!isMobile && (
          <Box component="nav" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={NavLink}
                to={item.path}
                color="inherit"
                size="small"
                startIcon={item.icon}
                sx={{
                  '&.active': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
        )}

        {/* User Area */}
        <Box sx={{ ml: 2 }}>
          {currentUser ? (
            <>
              <Tooltip title="Account">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36 }}>
                    {currentUser.firstName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || "?"}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                    }
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Logged in as:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 1.5 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={RouterLink}
              to="/login"
              color="inherit"
              variant="outlined"
              size="small"
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderNavigationBar;
