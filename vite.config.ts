import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages base path — must match repo name
  base: '/suratkama%20mascots/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js & React Three Fiber vendor chunk
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'three-vendor'
          }
          // Framer Motion animation vendor chunk
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion'
          }
          // Firebase vendor chunk
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase-vendor'
          }
          // General node_modules vendor fallback
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
