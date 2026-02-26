import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { n8nProxy } from './cors.config.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      }
    }),
  ],
  server: {
    proxy: {
      ...n8nProxy
    }
  }
})
