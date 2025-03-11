import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_HOST || 'localhost',
    port: parseInt(process.env.VITE_PORT, 10) || 3000,
    strictPort: true,
  },
  test: {
    globals: true, // Enables global testing functions, e.g., `describe`, `it`
    environment: 'jsdom', // Simulates a browser environment
    setupFiles: './src/setupTests.js', // Configuration file for tests (optional)
    coverage: {
      reporter: ['text', 'html'], // Generates coverage reports
    },
  },
});
