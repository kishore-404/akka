import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  
  server: {
    proxy: {
      // Any request starting with /api will be secretly forwarded to Flask
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // This removes the '/api' prefix before sending it to Flask
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
