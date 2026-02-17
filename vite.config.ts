import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/cadastral': {
        target: 'https://maps.gov.ge',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cadastral/, '/geoserver/napr'),
        secure: false
      }
    }
  }
})
