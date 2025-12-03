import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        }
      },
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})