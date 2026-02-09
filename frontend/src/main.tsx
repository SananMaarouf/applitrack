import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'

import './globals.css'

import { routeTree } from './routeTree.gen'
import { ThemeProvider } from './theme-provider'

// Initialize Sentry for error monitoring
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  })
}

const router = createRouter({ routeTree })

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing CLERK_PUBLISHABLE_KEY')
}
const CLERK_SIGN_IN_URL = import.meta.env.VITE_CLERK_SIGN_IN_URL
if (!CLERK_SIGN_IN_URL) {
  throw new Error('Missing CLERK_SIGN_IN_URL')
}
const CLERK_SIGN_UP_URL = import.meta.env.VITE_CLERK_SIGN_UP_URL
if (!CLERK_SIGN_UP_URL) {
  throw new Error('Missing CLERK_SIGN_UP_URL')
}
const CLERK_SIGN_IN_FALLBACK_REDIRECT_URL = import.meta.env.VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
if (!CLERK_SIGN_IN_FALLBACK_REDIRECT_URL) {
  throw new Error('Missing CLERK_SIGN_IN_FALLBACK_REDIRECT_URL')
}
const CLERK_SIGN_UP_FALLBACK_REDIRECT_URL = import.meta.env.VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
if (!CLERK_SIGN_UP_FALLBACK_REDIRECT_URL) {
  throw new Error('Missing CLERK_SIGN_UP_FALLBACK_REDIRECT_URL')
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInUrl={CLERK_SIGN_IN_URL}
      signUpUrl={CLERK_SIGN_UP_URL}
      signInFallbackRedirectUrl={CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
      signUpFallbackRedirectUrl={CLERK_SIGN_UP_FALLBACK_REDIRECT_URL}
      routerPush={(to: string) => router.navigate({ to: to as any })}
      routerReplace={(to: string) => router.navigate({ to: to as any, replace: true })}
    >
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <RouterProvider router={router} />
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
