import { defineConfig, loadEnv } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

const CLERK_ENV_KEYS = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_CLERK_SIGN_IN_URL',
  'VITE_CLERK_SIGN_UP_URL',
  'VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL',
  'VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL',
] as const

export default defineConfig(({ command, mode }) => {
  const frontendEnv = loadEnv(mode, __dirname, 'VITE_CLERK_')

  // Local Clerk development values live in the repo-root .env.local. Vite only
  // reads frontend/.env* by default, so in serve mode fall back to the root for
  // these five public keys only. Never load any other root variables here.
  // Frontend env files and explicit process env still take precedence.
  const rootEnv = command === 'serve'
    ? loadEnv(mode, path.resolve(__dirname, '..'), 'VITE_CLERK_')
    : {}

  const define: Record<string, string> = {}
  for (const key of CLERK_ENV_KEYS) {
    if (frontendEnv[key] === undefined && rootEnv[key] !== undefined) {
      define[`import.meta.env.${key}`] = JSON.stringify(rootEnv[key])
    }
  }

  return {
    envDir: path.resolve(__dirname),
    define,
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
      strictPort: true,
      proxy: {
        // `wrangler dev` (worker/) owns the API locally, so the SPA can keep using
        // the same relative /api paths it uses in production.
        '/api': { target: 'http://localhost:8787', changeOrigin: true },
      },
    },
  }
})
