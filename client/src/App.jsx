/**
 * src/App.jsx — Application Router
 * ──────────────────────────────────
 * Defines all routes and protects authenticated pages with a ProtectedRoute.
 *
 * PROTECTED ROUTE PATTERN:
 *   If a user hits /profile without logging in, ProtectedRoute reads
 *   isAuthenticated from AuthContext and redirects to /auth/login.
 *   The `replace` prop prevents the login page from being pushed onto the
 *   history stack (so Back button won't return to the protected page).
 *
 * ROUTE STRUCTURE:
 *   /                  — Landing page (public)
 *   /auth/login        — Login (redirect if authenticated)
 *   /auth/register     — Register (redirect if authenticated)
 *   /discover          — Skill marketplace (protected)
 *   /swaps             — Swap management (protected)
 *   /leaderboard       — Rankings (protected)
 *   /profile           — Own profile (protected)
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth }                  from './context/AuthContext';
import Navbar                       from './components/Navbar/Navbar';
import Footer                       from './components/Footer/Footer';

// Page imports
import HomePage          from './pages/Home/HomePage';
import AuthPage          from './pages/Auth/AuthPage';
import DiscoverPage      from './pages/Discover/DiscoverPage';
import SwapRequestsPage  from './pages/SwapRequests/SwapRequestsPage';
import LeaderboardPage   from './pages/Leaderboard/LeaderboardPage';
import ProfilePage       from './pages/Profile/ProfilePage';

// ── Protected Route guard ──────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // While checking localStorage for an existing token, show nothing
  if (isLoading) {
    return (
      <div style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        minHeight:       '100vh',
        color:           'var(--color-primary-300)',
        fontFamily:      'var(--font-display)',
        fontSize:        'var(--text-xl)',
        gap:             'var(--space-4)',
      }}>
        <span style={{ animation: 'pulse-glow 1.5s infinite' }}>◈</span>
        Loading Skillora…
      </div>
    );
  }

  return isAuthenticated
    ? children
    : <Navigate to="/auth/login" replace />;
}

export default function App() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Public routes */}
          <Route path="/"             element={<HomePage />} />
          <Route path="/auth/login"   element={<AuthPage mode="login" />} />
          <Route path="/auth/register"element={<AuthPage mode="register" />} />

          {/* Protected routes */}
          <Route path="/discover"    element={<ProtectedRoute><DiscoverPage    /></ProtectedRoute>} />
          <Route path="/swaps"       element={<ProtectedRoute><SwapRequestsPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage  /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><ProfilePage      /></ProtectedRoute>} />

          {/* 404 fallback */}
          <Route path="*" element={
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', gap:'var(--space-4)', color:'var(--color-text-secondary)' }}>
              <div style={{ fontSize:'4rem' }}>🔍</div>
              <h2>Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary">Go Home</a>
            </div>
          } />
        </Routes>
      </div>
      {!isAuthPage && <Footer />}
    </div>
  );
}
