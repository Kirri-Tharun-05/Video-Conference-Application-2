import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss()],
  build: {
    outDir: 'dist', // Ensure output is in the "dist" folder
  },
  server: {
    port: 3000, // You can change this if needed
    strictPort: true,
  },
  preview: {
    port: 4173, // Ensure the preview runs correctly
    strictPort: true,
  },
  base: "/", // Ensures correct base path
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
