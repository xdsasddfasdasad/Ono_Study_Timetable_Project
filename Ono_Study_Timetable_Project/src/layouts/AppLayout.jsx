import { Outlet } from "react-router-dom";
import HeaderNavigationBar from "../components/Header/HeaderNavigationBar";
import { Box, Container } from "@mui/material";

const AppLayout = () => {
  return (
    <>
      <HeaderNavigationBar />
      <Box component="main" sx={{ mt: 10 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </>
  );
};

export default AppLayout;
