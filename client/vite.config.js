import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Lit le .env depuis la racine du projet (source unique de vérité)
  envDir: path.resolve(__dirname, '..'),
  server: {
    host: '0.0.0.0',
    allowedHosts: ['here.local'],
    proxy: {
      '/api': 'http://localhost:3001',
      '/events': 'http://localhost:3001',
    },
  },
});
