/**
 * context/NotificationContext.jsx — Socket.IO Real-time Notifications
 * ─────────────────────────────────────────────────────────────────────
 * WHY a separate context for notifications?
 *   Socket.IO connection lifecycle (connect, disconnect, event listeners)
 *   must be managed carefully. Keeping it separate from AuthContext ensures
 *   socket events don't re-render auth-dependent components unnecessarily.
 *
 * SOCKET.IO CONNECTION LIFECYCLE:
 *   1. User logs in → socket connects with JWT in handshake.auth
 *   2. Server verifies JWT in io.use() middleware
 *   3. User joins room `user:${id}` for private notifications
 *   4. Events: swap:request, swap:updated, session:rated
 *   5. User logs out → socket.disconnect() cleans up
 *
 * WHY useRef for socket (not useState)?
 *   Socket is a mutable object — we don't want React to re-render when the
 *   socket reference changes. useRef provides a stable container that persists
 *   across renders without causing re-renders itself.
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({
  notifications:   [],
  unreadCount:     0,
  clearAll:        () => {},
  markRead:        () => {},
});

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef  = useRef(null);
  const [notifications, setNotifications] = useState([]);

  // Connect socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('skillora_access_token');

    // Create socket connection with JWT auth
    const socketUrl = window.location.hostname === 'localhost' ? '/' : 'https://skillora-backend-gtoy.onrender.com';
    socketRef.current = io(socketUrl, {
      auth:              { token },
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });

    // Listen for server events and push to notifications array
    socket.on('swap:request', (data) => {
      addNotification({ type: 'swap_request', ...data, timestamp: new Date() });
    });

    socket.on('swap:updated', (data) => {
      addNotification({ type: 'swap_updated', ...data, timestamp: new Date() });
    });

    socket.on('session:rated', (data) => {
      addNotification({ type: 'session_rated', ...data, timestamp: new Date() });
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
    });

    // Cleanup: disconnect socket when user logs out or component unmounts
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  const addNotification = (notif) => {
    setNotifications(prev => [{ ...notif, id: Date.now(), read: false }, ...prev].slice(0, 50));
  };

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

export default NotificationContext;
