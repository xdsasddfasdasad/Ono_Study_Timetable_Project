import { AppBar, Toolbar, Typography } from '@mui/material'
import React from 'react'

export default function Header() {
  return (
    <AppBar>
      <Toolbar position='static'>
        <Typography variant='h6' component="div">
          Ono_Study_Timetable_Project
        </Typography>
      </Toolbar>
    </AppBar> 
  );
}