import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // VITE_BASE_URL is set to '/cda/' during the production Docker build.
  // Defaults to '/' for local development so nothing changes in dev mode.
  base: process.env.VITE_BASE_URL ?? '/',

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
