import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2", // כחול MUI קלאסי
    },
    secondary: {
      main: "#9c27b0",
    },
    error: {
      main: "#d32f2f",
    },
  },
  typography: {
    fontFamily: `'Roboto', 'Segoe UI', sans-serif`,
  },
});

export default theme;
