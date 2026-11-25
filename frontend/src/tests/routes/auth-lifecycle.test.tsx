import { StrictMode, type ComponentType, type ReactNode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const clerk = vi.hoisted(() => {
  type State = { isLoaded: boolean; userId: string | null }
  let state: State = { isLoaded: false, userId: null }
  const listeners = new Set<() => void>()

  return {
    get: () => state,
    set: (next: Partial<State>) => {
      state = { ...state, ...next }
      for (const listener of listeners) listener()
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getToken: vi.fn(async () => 'token'),
    reset: () => {
      state = { isLoaded: false, userId: null }
      listeners.clear()
    },
  }
})

const apiMocks = vi.hoisted(() => ({
  listApplications: vi.fn(),
  getStatusFlow: vi.fn(),
  getDashboardTrends: vi.fn(),
}))

vi.mock('@clerk/clerk-react', async () => {
  const React = await import('react')

  const useAuth = () => {
    const state = React.useSyncExternalStore(clerk.subscribe, clerk.get, clerk.get)
    return { ...state, getToken: clerk.getToken }
  }

  return {
    useAuth,
    useUser: () => ({ user: { firstName: 'Ada', fullName: 'Ada Lovelace' } }),
    SignOutButton: ({ children }: { children?: ReactNode }) => <>{children}</>,
    ClerkLoading: ({ children }: { children?: ReactNode }) => <>{children}</>,
    ClerkLoaded: ({ children }: { children?: ReactNode }) => <>{children}</>,
    SignIn: () => <div>Sign in</div>,
    SignUp: () => <div>Sign up</div>,
    UserProfile: ({ children }: { children?: ReactNode }) => <>{children}</>,
  }
})

vi.mock('@/api/applications', () => apiMocks)
vi.mock('@/components/data-table', () => ({
  DataTable: () => <div>Applications table</div>,
}))
vi.mock('@/components/trendCards', () => ({
  TrendCards: () => <div>Trend cards</div>,
}))
vi.mock('@/components/pieChart', () => ({
  Chart: () => <div>Status pie chart</div>,
}))
vi.mock('@/components/barChart', () => ({
  BarStatusChart: () => <div>History chart</div>,
}))
vi.mock('@/components/sankey-diagram', () => ({
  SankeyDiagram: () => <div>Status flow diagram</div>,
}))

import {
  RouterProvider,
  createMemoryHistory,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

import { Route as RootRoute } from '@/routes/__root'
import { Route as IndexRoute } from '@/routes/index'
import { Route as DashboardRoute } from '@/routes/dashboard'

const Root = RootRoute.options.component as ComponentType
const Home = IndexRoute.options.component as ComponentType
const Dashboard = DashboardRoute.options.component as ComponentType

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((next) => {
    resolve = next
  })
  return { promise, resolve }
}

function makeRouter({
  dashboardLoader,
  signInLoader,
}: {
  dashboardLoader?: () => Promise<void>
  signInLoader?: () => Promise<void>
} = {}) {
  const rootRoute = RootRoute
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Home as any,
  })
  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: Dashboard as any,
    loader: dashboardLoader,
  })
  const signInRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sign-in',
    component: () => <div>Sign in page</div>,
    loader: signInLoader,
  })

  rootRoute.addChildren([indexRoute, dashboardRoute, signInRoute])

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  let navigateCount = 0
  const navigate = router.navigate.bind(router)
  router.navigate = ((options: Parameters<typeof navigate>[0]) => {
    navigateCount += 1
    return navigate(options)
  }) as typeof router.navigate

  return {
    router,
    getNavigateCount: () => navigateCount,
  }
}

function renderApp(router: ReturnType<typeof makeRouter>['router']) {
  return render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

function expectLandingInteractiveContent() {
  expect(
    screen.getByRole('heading', { name: /stay on track with applitrack/i }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: /three steps from first application/i }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: /see how it works/i }),
  ).toBeInTheDocument()
  // One hero CTA and one closing CTA remain mounted while the redirect loads.
  expect(
    screen.getAllByRole('link', { name: /start tracking for free/i }),
  ).toHaveLength(2)
  expect(screen.getAllByRole('link', { name: /log in/i }).length).toBeGreaterThan(0)
}

beforeEach(() => {
  clerk.reset()
  clerk.getToken.mockResolvedValue('token')
  apiMocks.listApplications.mockResolvedValue([])
  apiMocks.getStatusFlow.mockResolvedValue([])
  apiMocks.getDashboardTrends.mockResolvedValue({
    period: 'week',
    ranges: {
      current_start: '2026-11-17T00:00:00.000Z',
      current_end: '2026-11-24T00:00:00.000Z',
      previous_start: '2026-11-10T00:00:00.000Z',
      previous_end: '2026-11-17T00:00:00.000Z',
    },
    applications_sent: {
      current: 0,
      previous: 0,
      difference: 0,
      percentChange: 0,
      direction: 'neutral',
    },
    interviews: {
      current: 0,
      previous: 0,
      difference: 0,
      percentChange: 0,
      direction: 'neutral',
    },
  })
})

describe('auth route lifecycle', () => {
  it('redirects a restored session once without freezing the landing page', async () => {
    const dashboard = deferred()
    const { router, getNavigateCount } = makeRouter({
      dashboardLoader: () => dashboard.promise,
    })

    renderApp(router)

    expect(
      await screen.findByRole('heading', {
        name: /stay on track with applitrack/i,
      }),
    ).toBeInTheDocument()
    expectLandingInteractiveContent()
    expect(getNavigateCount()).toBe(0)

    await act(async () => {
      clerk.set({ isLoaded: true, userId: 'user_restored' })
    })

    // StrictMode replays layout effects, and the router re-renders while its
    // target loader is pending. Both must still leave a single navigation.
    await waitFor(() => expect(getNavigateCount()).toBe(1))
    await act(async () => {
      await Promise.resolve()
    })
    expect(getNavigateCount()).toBe(1)

    // The dashboard route is still loading: the public page and every link stay
    // rendered and clickable rather than blanking out behind the redirect.
    expectLandingInteractiveContent()

    await act(async () => {
      dashboard.resolve()
    })

    expect(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dashboard')
    expect(getNavigateCount()).toBe(1)
  })

  it('keeps the landing page public for a signed-out Clerk restore', async () => {
    const { router, getNavigateCount } = makeRouter()
    renderApp(router)

    await screen.findByRole('heading', { name: /stay on track/i })

    await act(async () => {
      clerk.set({ isLoaded: true, userId: null })
    })

    expect(router.state.location.pathname).toBe('/')
    expect(getNavigateCount()).toBe(0)
    expect(
      await screen.findByRole('heading', {
        name: /three steps from first application/i,
      }),
    ).toBeInTheDocument()
  })

  it('redirects a signed-out dashboard visit once while the sign-in route loads', async () => {
    const signIn = deferred()
    const { router, getNavigateCount } = makeRouter({
      signInLoader: () => signIn.promise,
    })

    renderApp(router)
    await screen.findByRole('heading', { name: /stay on track/i })

    await act(async () => {
      await router.navigate({ to: '/dashboard' })
    })

    expect(router.state.location.pathname).toBe('/dashboard')
    expect(screen.getByText('Loading your dashboard')).toBeInTheDocument()
    expect(getNavigateCount()).toBe(1)

    await act(async () => {
      clerk.set({ isLoaded: true, userId: null })
    })

    await waitFor(() => expect(getNavigateCount()).toBe(2))
    expect(router.state.location.pathname).toBe('/sign-in')

    await act(async () => {
      signIn.resolve()
    })

    expect(await screen.findByText('Sign in page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(getNavigateCount()).toBe(2)
  })

  it('lets a visitor use a landing auth link while Clerk is still restoring', async () => {
    const user = userEvent.setup()
    const { router, getNavigateCount } = makeRouter()

    renderApp(router)
    await screen.findByRole('heading', { name: /stay on track/i })
    expect(clerk.get().isLoaded).toBe(false)

    await user.click(screen.getAllByRole('link', { name: /log in/i })[0])

    expect(await screen.findByText('Sign in page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(getNavigateCount()).toBe(1)

    await act(async () => {
      clerk.set({ isLoaded: true, userId: 'user_restored' })
    })

    // The sign-in route owns this visit, so a late signed-in restore must not
    // add a second navigation or bounce the visitor through the home redirect.
    await act(async () => {
      await Promise.resolve()
    })
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(getNavigateCount()).toBe(1)
  })
})
