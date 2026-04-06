import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Express backend serves the built dist/ in production.
// In dev, Vite runs on 5173 and proxies /api + /ws to the Express
// backend on port 5000 so hot reload just works.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: ['here.local'],
    proxy: {
      '/api': 'http://localhost:5000',
      '/ws': { target: 'ws://localhost:5000', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
