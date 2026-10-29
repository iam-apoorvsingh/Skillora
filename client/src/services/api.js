/**
 * services/api.js — Axios Instance & Interceptors
 * ─────────────────────────────────────────────────
 * WHY a centralised Axios instance?
 *   Without it, every service file would repeat the base URL, headers, and
 *   error handling. The instance acts as a single configuration point.
 *
 * INTERCEPTORS:
 *   Request interceptor: Attaches the JWT Authorization header automatically
 *   to every outgoing request. No need to pass the token manually per-call.
 *
 *   Response interceptor: When a 401 TOKEN_EXPIRED is received, it
 *   automatically calls /auth/refresh and retries the original request.
 *   This is the "transparent token refresh" pattern — the user never sees
 *   their session expire.
 */

import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api',
  timeout:         10000,  // 10 second timeout
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skillora_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (Silent Token Refresh) ──────────────────────────────
let isRefreshing  = false;
let failedQueue   = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 TOKEN_EXPIRED and we haven't already retried this request
    if (
      error.response?.status === 401 &&
      error.response?.data?.error === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Queue this request until refresh is done
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('skillora_refresh_token');
        const { data } = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
        const newToken = data.access_token;

        localStorage.setItem('skillora_access_token', newToken);
        api.defaults.headers['Authorization'] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('skillora_access_token');
        localStorage.removeItem('skillora_refresh_token');
        window.location.href = '/auth/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
