import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Wczytaj zmienne środowiskowe
import dotenv from 'dotenv'
dotenv.config()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_HOST || 'localhost',
    port: parseInt(process.env.VITE_PORT, 10) || 3000,
  }
})
