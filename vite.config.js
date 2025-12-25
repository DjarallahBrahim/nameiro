import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/tld-checker': {
        target: 'https://fzvfvjcsnodijrdujzrh.supabase.co/functions/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tld-checker/, '/tld-checker'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dmZ2amNzbm9kaWpyZHVqenJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTIzNzcsImV4cCI6MjA3MDM4ODM3N30.VWaITCDp5Hy39aCgvtqrDtWJla4q4x0CyJb40GqgvdI');
            proxyReq.setHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dmZ2amNzbm9kaWpyZHVqenJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTIzNzcsImV4cCI6MjA3MDM4ODM3N30.VWaITCDp5Hy39aCgvtqrDtWJla4q4x0CyJb40GqgvdI');
          });
        }
      }
    }
  }
})
