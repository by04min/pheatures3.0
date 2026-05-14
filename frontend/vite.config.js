import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// ESM modules don't have __dirname, so we derive it from import.meta.url
const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // @data points to the shared data/ folder at the repo root
      '@data': resolve(__dirname, '../data'),
    },
  },
  server: {
    fs: {
      // allow Vite to serve files from outside the frontend/ project root (e.g. ../data/)
      allow: ['..'],
    },
    proxy: {
      // forward /api requests to the Flask backend during development
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
