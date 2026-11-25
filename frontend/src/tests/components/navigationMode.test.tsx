import type { ReactNode } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({ userId: 'user_nav' as string | null }))
const locationState = vi.hoisted(() => ({ pathname: '/dashboard', hash: '' }))
const themeState = vi.hoisted(() => ({
  theme: 'light' as string | undefined,
  resolvedTheme: 'light' as string | undefined,
  setTheme: vi.fn(),
}))

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
  useTheme: () => themeState,
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
  themeState.theme = 'light'
  themeState.resolvedTheme = 'light'
  themeState.setTheme.mockClear()
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

describe('desktop sidebar theme toggle', () => {
  it('switches directly between light and dark without opening a menu', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<AppSidebar />)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(themeState.setTheme).toHaveBeenCalledTimes(1)
    expect(themeState.setTheme).toHaveBeenCalledWith('dark')

    themeState.theme = 'dark'
    themeState.resolvedTheme = 'dark'
    themeState.setTheme.mockClear()
    rerender(<AppSidebar />)

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(themeState.setTheme).toHaveBeenCalledTimes(1)
    expect(themeState.setTheme).toHaveBeenCalledWith('light')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('falls back to the persisted theme until the resolved theme is ready', () => {
    themeState.theme = 'system'
    themeState.resolvedTheme = undefined

    render(<AppSidebar />)

    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument()
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
