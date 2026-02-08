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
  },
})