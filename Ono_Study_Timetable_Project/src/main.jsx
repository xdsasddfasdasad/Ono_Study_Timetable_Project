import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {BrwoserRouter} from 'react-router-dom';
import './styles/globals.css';  // קובץ עיצוב עיקרי
import './index.css';           // reset בסיסי אם צריך
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrwoserRouter>
      <App />
    </BrwoserRouter>
  </StrictMode>,
)
