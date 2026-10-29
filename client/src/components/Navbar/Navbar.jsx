/**
 * components/Navbar/Navbar.jsx
 * ──────────────────────────────
 * - Top Bar: Skillora logo (unencapsulated) on left, Theme switch & Auth on right
 * - Bottom Dock: Floating Liquid Glass capsule at bottom center holding Discover & Leaderboard
 */

import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth }                           from '../../context/AuthContext';
import { useNotifications }                  from '../../context/NotificationContext';
import { useTheme }                          from '../../context/ThemeContext';
import SkilloraLogo                          from '../Logo/SkilloraLogo';
import '../../styles/components/navbar.css';

// SVG icon components
const CompassIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
const SwapIcon     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>;
const TrophyIcon   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17l-1 7a5 5 0 01-8 0L7 4z"/><path d="M5 4H3v3a4 4 0 004 4"/><path d="M19 4h2v3a4 4 0 01-4 4"/></svg>;
const BellIcon     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
const UserIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LogoutIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount }                   = useNotifications();
  const { theme, toggleTheme }            = useTheme();
  const navigate                          = useNavigate();
  const location                          = useLocation();
  const isAuthPage                        = location.pathname.startsWith('/auth');
  const [avatarOpen, setAvatarOpen]       = useState(false);
  const dropdownRef                       = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    if (avatarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      {/* ══ TOP BAR: Clean, unencapsulated logo on left, Auth & Theme on right ══ */}
      <header className="navbar-top" role="banner">
        <div className="navbar-top__inner">
          
          {/* Logo (Out of capsule, natural brand presentation) */}
          <NavLink to="/" className="navbar__logo" aria-label="Skillora Home">
            <SkilloraLogo width={40} className="navbar__logo-img" />
            <span className="navbar__logo-text">Skillora</span>
          </NavLink>

          {/* Center Liquid Glass Capsule (ONLY Discover & Leaderboard) */}
          {!isAuthPage && (
            <nav className="navbar__nav-capsule" role="navigation" aria-label="Main Navigation">
              <NavLink
                to="/discover"
                className={({ isActive }) => `navbar__capsule-item${isActive ? ' active' : ''}`}
                title="Discover Skills"
              >
                <CompassIcon />
                <span>Discover</span>
              </NavLink>

              {isAuthenticated && (
                <NavLink
                  to="/swaps"
                  className={({ isActive }) => `navbar__capsule-item${isActive ? ' active' : ''}`}
                  title="My Swaps"
                >
                  <SwapIcon />
                  <span>My Swaps</span>
                </NavLink>
              )}

              <NavLink
                to="/leaderboard"
                className={({ isActive }) => `navbar__capsule-item${isActive ? ' active' : ''}`}
                title="Leaderboard"
              >
                <TrophyIcon />
                <span>Leaderboard</span>
              </NavLink>
            </nav>
          )}

          {/* Right Controls: Theme Toggle & User Auth */}
          <div className="navbar-top__right">
            {/* Theme Toggle Button */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <div className={`theme-toggle__track ${theme}`}>
                <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">☀️</span>
                <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">🌙</span>
                <div className="theme-toggle__thumb" aria-hidden="true" />
              </div>
            </button>

            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <button
                  className="navbar__notif-btn"
                  aria-label={`Notifications (${unreadCount} unread)`}
                  title="Notifications"
                >
                  <BellIcon />
                  {unreadCount > 0 && <span className="navbar__notif-badge" aria-live="polite" />}
                </button>

                {/* Avatar Dropdown */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    className="navbar__avatar"
                    onClick={() => setAvatarOpen(o => !o)}
                    aria-label="User menu"
                    aria-expanded={avatarOpen}
                  >
                    {initials}
                  </button>

                  {avatarOpen && (
                    <div className="navbar__dropdown" role="menu">
                      <div className="navbar__dropdown-header">
                        <p className="navbar__dropdown-name">{user?.full_name}</p>
                        <p className="navbar__dropdown-roll">{user?.roll_number} · {user?.branch}</p>
                      </div>
                      <div className="navbar__dropdown-body">
                        <NavLink
                          to="/profile"
                          className="navbar__dropdown-item"
                          onClick={() => setAvatarOpen(false)}
                          role="menuitem"
                        >
                          <UserIcon />
                          <span>My Profile</span>
                        </NavLink>
                        <button
                          className="navbar__dropdown-item navbar__dropdown-item--logout"
                          onClick={handleLogout}
                          role="menuitem"
                        >
                          <LogoutIcon />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="navbar__auth-group">
                <NavLink to="/auth/login" className="navbar__link navbar__link--login">Log In</NavLink>
                <NavLink to="/auth/register" className="btn btn-primary btn-sm navbar__signup-btn">Sign Up</NavLink>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
}
