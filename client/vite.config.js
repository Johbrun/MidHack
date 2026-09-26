import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Code partagé entre les trois fronts (shared/ui, shared/flags.json).
    alias: { '@shared': path.join(REPO_ROOT, 'shared') },
    // shared/ n'a pas de node_modules : React doit venir de l'application, et en
    // un seul exemplaire (deux copies de React cassent les hooks).
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  // Lit le .env depuis la racine du projet (source unique de vérité)
  envDir: REPO_ROOT,
  server: {
    host: '0.0.0.0',
    allowedHosts: ['here.local'],
    fs: { allow: [REPO_ROOT] },
    proxy: {
      '/api': 'http://localhost:3001',
      '/events': 'http://localhost:3001',
    },
  },
});
