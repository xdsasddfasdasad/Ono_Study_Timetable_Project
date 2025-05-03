import React from 'react';
import { Outlet } from "react-router-dom";
import HeaderNavigationBar from "../components/Header/HeaderNavigationBar";
import Footer from "../components/Footer/Footer";
import { Box, Container, Toolbar, useTheme } from "@mui/material";

const AppLayout = () => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HeaderNavigationBar />
        <Toolbar />
          <Box component="main" sx={{ flexGrow: 1}}>
            <Container /* ... */>
              <Outlet />
            </Container>
        </Box>
      <Footer /> 
    </Box>

    
  );
};

export default AppLayout;