/**
 * src/main.jsx — React Application Entry Point
 * ──────────────────────────────────────────────
 * This is the file that Vite's index.html calls via:
 *   <script type="module" src="/src/main.jsx">
 *
 * STRICT MODE:
 *   React.StrictMode renders components twice in development to detect
 *   side effects. It has no effect in production builds.
 *
 * PROVIDER ORDER (outer → inner):
 *   BrowserRouter → AuthProvider → NotificationProvider → App
 *   Why this order?
 *   NotificationProvider depends on useAuth() (needs AuthContext),
 *   so it MUST be inside AuthProvider.
 */

import React            from 'react';
import ReactDOM         from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider }        from './context/ThemeContext';
import { AuthProvider }         from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import App                      from './App';

import './styles/globals.css'; // Global styles loaded first

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
