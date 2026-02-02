import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/clerk-react'

import './globals.css'

import { routeTree } from './routeTree.gen'
import { ThemeProvider } from './theme-provider'

const router = createRouter({ routeTree })

const CLERK_PUBLISHABLE_KEY = import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
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
      signInUrl={import.meta.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in'}
      signUpUrl={import.meta.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up'}
      afterSignInUrl={
        import.meta.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? '/dashboard'
      }
      afterSignUpUrl={
        import.meta.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? '/dashboard'
      }
      routerPush={(to: string) => router.navigate({ to: to as any })}
      routerReplace={(to: string) => router.navigate({ to: to as any, replace: true })}
    >
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <RouterProvider router={router} />
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
