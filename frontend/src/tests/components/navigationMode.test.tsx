import type { ReactNode } from 'react'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({ userId: 'user_nav' as string | null }))
const locationState = vi.hoisted(() => ({ pathname: '/dashboard', hash: '' }))

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => authState,
  SignOutButton: ({ children }: { children?: ReactNode }) => <>{children}</>,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to?: string
    children?: ReactNode
    [key: string]: unknown
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => locationState,
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}))

vi.mock('@/components/jobApplicationForm', () => ({
  JobApplicationForm: () => <div>Application form</div>,
}))

vi.mock('@/components/ui/sidebar', () => {
  type PassthroughProps = {
    children?: ReactNode
    [key: string]: unknown
  }
  const Passthrough = ({ children }: PassthroughProps) => <div>{children}</div>

  return {
    Sidebar: Passthrough,
    SidebarContent: Passthrough,
    SidebarFooter: Passthrough,
    SidebarGroup: Passthrough,
    SidebarGroupContent: Passthrough,
    SidebarGroupLabel: Passthrough,
    SidebarHeader: Passthrough,
    SidebarMenu: Passthrough,
    SidebarMenuItem: Passthrough,
    SidebarMenuButton: ({
      children,
      asChild,
      ...props
    }: PassthroughProps & { asChild?: boolean }) =>
      asChild ? (
        <>{children}</>
      ) : (
        <button
          type="button"
          aria-label={props['aria-label'] as string | undefined}
          onClick={props.onClick as (() => void) | undefined}
        >
          {children}
        </button>
      ),
    SidebarRail: () => null,
    SidebarTrigger: () => null,
    useSidebar: () => ({ state: 'expanded', isMobile: false }),
  }
})

import { AppSidebar } from '@/components/app-sidebar'
import { Navbar } from '@/components/navbar'
import { useDashboardModeStore } from '@/store/dashboardModeStore'

function setMode(mode: 'unknown' | 'first-run' | 'regular') {
  act(() => {
    useDashboardModeStore.setState({ userId: authState.userId, mode })
  })
}

function expectNavActionsHidden() {
  expect(screen.queryByRole('link', { name: /stats/i })).not.toBeInTheDocument()
  expect(
    screen.queryByRole('link', { name: /^applications$/i }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /register application/i }),
  ).not.toBeInTheDocument()
}

function expectNavActionsVisible() {
  expect(screen.getByRole('link', { name: /stats/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /^applications$/i })).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /register application/i }),
  ).toBeInTheDocument()
}

beforeEach(() => {
  authState.userId = 'user_nav'
  locationState.pathname = '/dashboard'
  locationState.hash = ''
  useDashboardModeStore.setState({ userId: null, mode: 'unknown' })
})

describe('mobile navbar first-run mode', () => {
  it('hides and restores Stats, Add, and Applications while keeping Home and Profile', () => {
    locationState.pathname = '/dashboard'
    const { rerender } = render(<Navbar />)

    expectNavActionsVisible()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()

    setMode('first-run')
    rerender(<Navbar />)
    expectNavActionsHidden()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()

    setMode('regular')
    rerender(<Navbar />)
    expectNavActionsVisible()
  })

  it('restores actions outside the dashboard and for unknown/error modes', () => {
    locationState.pathname = '/dashboard'
    const { rerender } = render(<Navbar />)

    setMode('first-run')
    rerender(<Navbar />)
    expectNavActionsHidden()

    locationState.pathname = '/my-account'
    rerender(<Navbar />)
    expectNavActionsVisible()

    locationState.pathname = '/dashboard'
    setMode('unknown')
    rerender(<Navbar />)
    expectNavActionsVisible()
  })
})

describe('desktop sidebar first-run mode', () => {
  it('hides and restores Stats, Applications, and Register application', () => {
    locationState.pathname = '/dashboard'
    const { rerender } = render(<AppSidebar />)

    expectNavActionsVisible()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()

    setMode('first-run')
    rerender(<AppSidebar />)
    expectNavActionsHidden()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()

    setMode('regular')
    rerender(<AppSidebar />)
    expectNavActionsVisible()
  })
})
