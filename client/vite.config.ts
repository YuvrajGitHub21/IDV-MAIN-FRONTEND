import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev config to avoid CORS without backend changes:
// - Serves the app over HTTPS so Secure cookies can be set.
// - Proxies '/api' to your backend (https://localhost:5294), same-origin to the browser.
// - 'secure: false' because the backend uses a dev certificate.
export default defineConfig({
  plugins: [react()],
  server: {
    https: true,
    proxy: {
      '/api': {
        target: 'https://localhost:5294',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
