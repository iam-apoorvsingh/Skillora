/**
 * context/AuthContext.jsx — Global Authentication State
 * ───────────────────────────────────────────────────────
 * WHY React Context instead of Redux?
 *   Auth state (currentUser, isLoading, login/logout) needs to be accessible
 *   by Navbar, ProtectedRoute, and Profile pages. Context avoids "prop drilling"
 *   (passing props through many component layers). Redux would add complexity
 *   (actions, reducers, store) that's not warranted for auth state alone.
 *
 * CONTEXT PATTERN (Provider/Consumer):
 *   1. createContext() creates a context object with a default value.
 *   2. <AuthContext.Provider value={...}> wraps the app, sharing state.
 *   3. useAuth() (custom hook) wraps useContext(AuthContext) for clean DX.
 *
 * WHY localStorage for tokens (not cookies)?
 *   For a React SPA calling a JSON API, localStorage is the conventional
 *   approach. HttpOnly cookies would require same-origin OR careful CORS+
 *   credentials config. The tradeoff (XSS risk) is mitigated by the short
 *   access token lifetime (15 min).
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/services';

// Create context with a sensible default (used if no Provider is found above)
const AuthContext = createContext({
  user:        null,
  isLoading:   true,
  isAuthenticated: false,
  login:       async () => {},
  logout:      async () => {},
  register:    async () => {},
});

// ─── Provider Component ───────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until we've checked localStorage

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('skillora_access_token');
    if (token) {
      authService.getMe()
        .then(res => setUser(res.data.user))
        .catch(() => {
          // Token invalid/expired and refresh failed — clear storage
          localStorage.removeItem('skillora_access_token');
          localStorage.removeItem('skillora_refresh_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    const { access_token, user } = res.data;
    localStorage.setItem('skillora_access_token', access_token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authService.register(formData);
    const { access_token, user } = res.data;
    localStorage.setItem('skillora_access_token', access_token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch (_) {}
    localStorage.removeItem('skillora_access_token');
    localStorage.removeItem('skillora_refresh_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Custom Hook ─────────────────────────────────────────────────────────────
// useAuth() provides a clean, named API instead of raw useContext(AuthContext)
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
