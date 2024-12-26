import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Wczytaj zmienne środowiskowe
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_HOST || 'localhost', // Domyślnie localhost, ale można zmienić na 0.0.0.0 w Dockerze
    port: parseInt(process.env.VITE_PORT, 10) || 3000,
    strictPort: true,
  },
  test: {
    globals: true, // Włącza globalne funkcje testów, np. `describe`, `it`
    environment: 'jsdom', // Symuluje środowisko przeglądarki
    setupFiles: './src/setupTests.js', // Plik konfiguracyjny do testów (opcjonalny)
    coverage: {
      reporter: ['text', 'html'], // Generowanie raportu pokrycia testami
    },
  },
});
