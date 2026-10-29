import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// WHY Vite over CRA (Create React App)?
//   Vite uses native ES modules in development — no bundling step.
//   This gives sub-second HMR (Hot Module Replacement) vs CRA's 5-30s rebuilds.
//   The production build uses Rollup (tree-shaking, smaller bundles).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    // Proxy API calls to Express backend during development.
    // WHY proxy? Avoids CORS issues in dev — the browser sees both client
    // and API on the same origin (localhost:5173).
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true, // proxy WebSocket connections too
        changeOrigin: true,
      },
    },
  },
});
