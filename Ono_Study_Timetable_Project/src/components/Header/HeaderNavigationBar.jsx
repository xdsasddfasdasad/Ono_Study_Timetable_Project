// src/components/Header/HeaderNavigationBar.jsx
import React, { useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, Tooltip, Menu, MenuItem, CircularProgress, useTheme, useMediaQuery, Divider } from "@mui/material";
import { Logout, Menu as MenuIcon } from "@mui/icons-material";
import { useNavigate, Link as RouterLink, NavLink } from "react-router-dom";
import { useAuth } from '../../context/AuthContext.jsx';

const HeaderNavigationBar = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isLoading } = useAuth();
  const theme = useTheme();
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNav, setAnchorElNav] = useState(null); 
  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/login');
  };
  const navItems = currentUser ? [
    { label: 'Home', path: '/home' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Timetable', path: '/timetable/calendar' },
    { label: 'List View', path: '/timetable/list' },
    { label: 'Manage Timetable', path: '/timetable/management' },
    { label: 'Manage Students', path: '/students' },
    { label: 'Help', path: '/help' },
  ] : [];
  if (isLoading) {
    return (
      <AppBar position="fixed" color="primary" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress color="inherit" size={24} />
          </Box>
        </Toolbar>
      </AppBar>
    );
  }
  return (
    <AppBar
      position="fixed"
      color="primary"
      elevation={2}
      sx={{ zIndex: theme.zIndex.drawer + 1,
             backgroundColor: 'rgba(25, 118, 210, 0.9)'
         }}
    >
      <Toolbar>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", mr: 2 }}
          onClick={() => navigate(currentUser ? "/dashboard" : "/")}
        >
          <img src="/logo.png" alt="App Logo" height="32" />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Timetable Pro
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.label}
              component={NavLink}
              to={item.path}
              color="inherit"
              size="small"
              sx={{
                 '&.active': {
                   fontWeight: 'bold',
                   textDecoration: 'underline',
                   textUnderlineOffset: '4px'
                 },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
        <Box sx={{ flexShrink: 0, ml: { xs: 0, md: 2 } }}>
          {currentUser ? (
            <>
              <Tooltip title="User Menu">
                <IconButton onClick={handleOpenUserMenu} size="small">
                  <Avatar alt={currentUser.username} sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.875rem' }}>
                      {currentUser.firstName ? currentUser.firstName[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                 <MenuItem disabled>
                     <Typography variant="caption" sx={{px: 1}}>Logged in as:</Typography>
                     <Typography variant="body2" sx={{fontWeight: 'bold', px: 1}}>{currentUser?.firstName || currentUser?.username || 'Guest'}</Typography>
                 </MenuItem>
                 <Divider />
                 <MenuItem onClick={handleLogout}>
                   <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
                 </MenuItem>
              </Menu>
            </>
          ) : (
            <Button component={RouterLink} to="/login" color="inherit" variant="outlined" size="small">
              Login
            </Button>
          )}
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default HeaderNavigationBar;