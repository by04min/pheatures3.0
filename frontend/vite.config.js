import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
