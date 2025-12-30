import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/replicate': {
        target: 'https://us-central1-nameiro-c012e.cloudfunctions.net/replicateProxy/api/replicate',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/replicate/, ''),
        secure: false
      },
      '/api/atom': {
        // Pointing to Prod Function for local dev because we need the secret/backend logic
        // Update this URL if the region/project changes
        target: 'https://us-central1-nameiro-c012e.cloudfunctions.net/replicateProxy/api/atom',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/atom/, ''),
        secure: false
      }
    }
  }
})
