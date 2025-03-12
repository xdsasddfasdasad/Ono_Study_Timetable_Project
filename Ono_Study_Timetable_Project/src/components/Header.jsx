import { AppBar, Toolbar, Typography } from '@mui/material'
import React from 'react'

export default function Header() {
  return (
    <AppBar>
      <Toolbar>
        <Typography variant='h6' component="div">
          Header
        </Typography>
      </Toolbar>
    </AppBar> 
  );
}
