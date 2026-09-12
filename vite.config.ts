import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules/maplibre-gl/')) {
            return 'vendor-maplibre';
          }
          if (normalized.includes('node_modules/recharts/') || normalized.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          if (normalized.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          if (normalized.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          if (
            normalized.includes('node_modules/react/') ||
            normalized.includes('node_modules/react-dom/') ||
            normalized.includes('node_modules/react-router-dom/') ||
            normalized.includes('node_modules/react-router/')
          ) {
            return 'vendor-react';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
