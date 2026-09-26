import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');

// The Express backend serves the built dist/ in production.
// In dev, Vite runs on 5173 and proxies /api + /ws to the Express
// backend on port 5000 so hot reload just works.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Code partagé entre les trois fronts (shared/ui, shared/flags.json).
    alias: { '@shared': path.join(REPO_ROOT, 'shared') },
    // shared/ n'a pas de node_modules : React doit venir de l'application, et en
    // un seul exemplaire (deux copies de React cassent les hooks).
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: ['here.local'],
    fs: { allow: [REPO_ROOT] },
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
