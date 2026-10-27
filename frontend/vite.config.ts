import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  envDir: path.resolve(__dirname),
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }), 
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // `wrangler dev` (worker/) owns the API locally, so the SPA can keep using
      // the same relative /api paths it uses in production.
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
})