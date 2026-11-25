import { useLayoutEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

type AuthDestination = '/dashboard' | '/sign-in'

type AuthRedirectProps = {
  to: AuthDestination
  replace?: boolean
}

/**
 * Navigates to an auth destination once per mounted destination.
 *
 * TanStack's `<Navigate>` compares the whole props object, so every render made
 * while the target route is still loading (for example the cold dashboard
 * chunk) creates a new props object and schedules another navigation. That
 * navigation notifies the router, which re-renders the route tree and schedules
 * yet another navigation, leaving the page frozen. Depending on a stable set of
 * primitives gives the same declarative redirect without the re-entrancy.
 *
 * The ref records the destination before navigating so React StrictMode's
 * development-only effect replay does not schedule the same navigation twice.
 */
export function AuthRedirect({ to, replace = false }: AuthRedirectProps) {
  const navigate = useNavigate()
  const navigatedKeyRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    const key = `${to}:${replace ? 'replace' : 'push'}`
    if (navigatedKeyRef.current === key) return
    navigatedKeyRef.current = key
    void navigate({ to, replace })
  }, [navigate, replace, to])

  return null
}
