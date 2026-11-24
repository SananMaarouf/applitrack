import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ComponentType } from 'react'

import type { JobApplication } from '@/types/jobApplication'

const authState = vi.hoisted(() => ({
  isLoaded: true,
  userId: 'user_initial' as string | null,
  getToken: vi.fn(),
}))

const apiMocks = vi.hoisted(() => ({
  listApplications: vi.fn(),
  getStatusFlow: vi.fn(),
  getDashboardTrends: vi.fn(),
  createApplication: vi.fn(),
  uploadAttachment: vi.fn(),
}))

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => authState,
  useUser: () => ({
    user: { firstName: 'Ada', fullName: 'Ada Lovelace' },
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Navigate: () => null,
  useLocation: () => ({ hash: '' }),
}))

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

import { Route } from '@/routes/dashboard'
import { useJobsStore } from '@/store/jobsStore'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'
import { useDashboardModeStore } from '@/store/dashboardModeStore'
import { useTrendsStore } from '@/store/trendsStore'

const Dashboard = Route.options.component as ComponentType

let userSequence = 0
const originalMatchMedia = window.matchMedia

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 1,
    created_at: '2026-11-20T10:00:00.000Z',
    user_id: 'test_user',
    applied_at: '2026-11-20T10:00:00.000Z',
    position: 'Frontend Engineer',
    company: 'Acme',
    status: 1,
    ...overrides,
  }
}

function makeTrends() {
  return {
    period: 'week' as const,
    ranges: {
      current_start: '2026-11-17T00:00:00.000Z',
      current_end: '2026-11-24T00:00:00.000Z',
      previous_start: '2026-11-10T00:00:00.000Z',
      previous_end: '2026-11-17T00:00:00.000Z',
    },
    applications_sent: {
      current: 1,
      previous: 0,
      difference: 1,
      percentChange: null,
      direction: 'up' as const,
    },
    interviews: {
      current: 0,
      previous: 0,
      difference: 0,
      percentChange: 0,
      direction: 'neutral' as const,
    },
  }
}

function matchMediaResult(matches: boolean) {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

function resetJobsStore() {
  useJobsStore.setState({
    jobApplications: [],
    activeJobsOwnerId: null,
    createRevisions: {},
    createdApplicationsByUser: {},
    lastCreatedApplication: null,
    pendingDeletions: {},
    deletionEventsByUser: {},
    lastConfirmedDeletionByUser: {},
    deletionRevisions: {},
    analyticsRevisions: {},
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  window.matchMedia = vi.fn((query: string) => matchMediaResult(false))

  userSequence += 1
  authState.userId = `user_test_${userSequence}`
  authState.isLoaded = true
  authState.getToken.mockResolvedValue('token')

  apiMocks.listApplications.mockResolvedValue([])
  apiMocks.getStatusFlow.mockResolvedValue([])
  apiMocks.getDashboardTrends.mockResolvedValue(makeTrends())
  apiMocks.createApplication.mockResolvedValue(makeApplication())
  apiMocks.uploadAttachment.mockResolvedValue(makeApplication())

  resetJobsStore()
  useAggregatedStatusHistoryStore.setState({ aggregatedStatusHistory: [] })
  useDashboardModeStore.setState({ userId: null, mode: 'unknown' })
  useTrendsStore.setState({ period: 'week' })
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('first-application dashboard', () => {
  it('never shows the welcome view while the list is loading', async () => {
    let resolveList!: (value: JobApplication[]) => void
    apiMocks.listApplications.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    render(<Dashboard />)

    expect(screen.getByText('Loading your dashboard')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /register your first application/i }),
    ).not.toBeInTheDocument()

    await act(async () => {
      resolveList([])
    })

    expect(
      await screen.findByRole('button', { name: /register your first application/i }),
    ).toBeInTheDocument()
    expect(apiMocks.getDashboardTrends).not.toHaveBeenCalled()
  })

  it('shows an explicit retryable error instead of the welcome view on failure', async () => {
    const user = userEvent.setup()
    apiMocks.listApplications.mockRejectedValueOnce(new Error('Network down'))

    render(<Dashboard />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('We could not load your applications')
    expect(alert).toHaveTextContent('Network down')
    expect(
      screen.queryByRole('button', { name: /register your first application/i }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(
      await screen.findByRole('button', { name: /register your first application/i }),
    ).toBeInTheDocument()
    expect(apiMocks.listApplications).toHaveBeenCalledTimes(2)
  })

  it('treats a failed token request as a retryable error, not an empty account', async () => {
    authState.getToken.mockResolvedValueOnce(null)

    render(<Dashboard />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /session could not be verified/i,
    )
    expect(
      screen.queryByRole('button', { name: /register your first application/i }),
    ).not.toBeInTheDocument()
    expect(apiMocks.listApplications).not.toHaveBeenCalled()
  })

  it('shows the regular dashboard for users with existing applications', async () => {
    apiMocks.listApplications.mockResolvedValue([
      makeApplication({ id: 9, company: 'Initech' }),
    ])

    render(<Dashboard />)

    expect(await screen.findByText('Applications table')).toBeInTheDocument()
    expect(screen.queryByText('First application')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /register your first application/i }),
    ).not.toBeInTheDocument()
  })

  it('returns to the welcome view for a confirmed empty list even with a historical flag', async () => {
    localStorage.setItem(
      `applitrack:first-application-seen:v1:${authState.userId}`,
      'true',
    )
    apiMocks.listApplications.mockResolvedValue([])

    render(<Dashboard />)

    expect(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Applications table')).not.toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('first-run')
  })

  it('saves through the real form, celebrates, then reveals and focuses the regular dashboard', async () => {
    const user = userEvent.setup()
    apiMocks.listApplications.mockResolvedValue([])

    render(<Dashboard />)

    await user.click(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    )

    await user.type(await screen.findByLabelText(/position/i), 'Frontend Engineer')
    await user.type(screen.getByLabelText(/company/i), 'Acme')
    await user.click(screen.getByRole('button', { name: /save application/i }))

    expect(
      await screen.findByRole('heading', { name: /you are on the board/i }),
    ).toBeInTheDocument()
    expect(apiMocks.createApplication).toHaveBeenCalledTimes(1)
    expect(apiMocks.getDashboardTrends).not.toHaveBeenCalled()
    expect(useJobsStore.getState().jobApplications[0]).toMatchObject({
      company: 'Acme',
      position: 'Frontend Engineer',
    })

    await user.click(screen.getByRole('button', { name: /skip animation/i }))

    const dashboardHeading = screen.getByRole('heading', { level: 1 })
    await waitFor(() => expect(dashboardHeading).toHaveFocus())
    expect(await screen.findByText('Applications table')).toBeInTheDocument()
    expect(apiMocks.getDashboardTrends).toHaveBeenCalledTimes(1)
  })

  it('ignores a stale marker from another account when deciding to celebrate', async () => {
    apiMocks.listApplications.mockResolvedValue([])
    useJobsStore.setState({
      jobApplications: [],
      createRevisions: { user_other: 4 },
      createdApplicationsByUser: {
        user_other: [
          {
            application: makeApplication({ id: 404 }),
            userId: 'user_other',
            revision: 4,
            at: 1,
          },
        ],
      },
      lastCreatedApplication: {
        application: makeApplication({ id: 404 }),
        userId: 'user_other',
        revision: 4,
        at: 1,
      },
    })

    render(<Dashboard />)

    expect(
      await screen.findByRole('button', { name: /register your first application/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /you are on the board/i }),
    ).not.toBeInTheDocument()
  })

  it('does not merge another account’s local rows into the current snapshot', async () => {
    let resolveList!: (value: JobApplication[]) => void
    apiMocks.listApplications.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    render(<Dashboard />)

    act(() => {
      useJobsStore
        .getState()
        .addJob(makeApplication({ id: 901, company: 'Other account' }), 'user_other')
      useJobsStore
        .getState()
        .addJob(makeApplication({ id: 902, company: 'Second account' }), 'user_second')
    })

    await act(async () => {
      resolveList([])
    })

    expect(
      await screen.findByRole('button', { name: /register your first application/i }),
    ).toBeInTheDocument()
    expect(useJobsStore.getState().jobApplications).toHaveLength(0)
  })

  it('celebrates when the in-flight GET already contains this account’s new row', async () => {
    const localApplication = makeApplication({
      id: 77,
      company: 'Local Co',
      attachment_key: 'uploads/local-cv.pdf',
    })
    let resolveList!: (value: JobApplication[]) => void
    apiMocks.listApplications.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    render(<Dashboard />)

    act(() => {
      useJobsStore.getState().addJob(localApplication, authState.userId)
    })

    await act(async () => {
      resolveList([
        makeApplication({
          id: 77,
          company: 'Local Co',
          attachment_key: null,
        }),
      ])
    })

    expect(
      await screen.findByRole('heading', { name: /you are on the board/i }),
    ).toBeInTheDocument()

    const saved = useJobsStore.getState().jobApplications
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      id: 77,
      attachment_key: 'uploads/local-cv.pdf',
    })
  })

  it('does not let a late save from another account alter the displayed rows', async () => {
    const currentRow = makeApplication({
      id: 601,
      company: 'Account B row',
    })
    apiMocks.listApplications.mockResolvedValue([currentRow])

    render(<Dashboard />)
    expect(await screen.findByText('Applications table')).toBeInTheDocument()
    expect(useJobsStore.getState().activeJobsOwnerId).toBe(authState.userId)

    const beforeForeignSave = useJobsStore.getState().jobApplications
    act(() => {
      useJobsStore
        .getState()
        .addJob(makeApplication({ id: 602, company: 'Late account A' }), 'user_late_a')
    })

    expect(useJobsStore.getState().jobApplications).toEqual(beforeForeignSave)
    expect(useJobsStore.getState().jobApplications).toHaveLength(1)
    expect(useJobsStore.getState().jobApplications[0].company).toBe('Account B row')
    // The foreign save is still tracked for its own account's reconciliation.
    expect(useJobsStore.getState().createRevisions.user_late_a).toBe(1)
    expect(
      useJobsStore.getState().createdApplicationsByUser.user_late_a,
    ).toHaveLength(1)
  })

  it('remounts cleanly when the signed-in account changes', async () => {
    apiMocks.listApplications.mockResolvedValueOnce([
      makeApplication({ id: 501, company: 'Account A' }),
    ])
    const { rerender } = render(<Dashboard />)

    expect(await screen.findByText('Applications table')).toBeInTheDocument()

    let resolveB!: (value: JobApplication[]) => void
    apiMocks.listApplications.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveB = resolve
      }),
    )
    authState.userId = 'user_account_b'
    rerender(<Dashboard />)

    expect(screen.queryByText('Applications table')).not.toBeInTheDocument()
    expect(screen.getByText('Loading your dashboard')).toBeInTheDocument()

    await act(async () => {
      resolveB([])
    })

    expect(
      await screen.findByRole('button', { name: /register your first application/i }),
    ).toBeInTheDocument()
  })

  it('keeps a local first save that races the initial list and still celebrates', async () => {
    let resolveList!: (value: JobApplication[]) => void
    apiMocks.listApplications.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    render(<Dashboard />)

    act(() => {
      useJobsStore.getState().addJob(
        makeApplication({ id: 77, company: 'Local Co' }),
        authState.userId,
      )
    })

    await act(async () => {
      resolveList([])
    })

    expect(
      await screen.findByRole('heading', { name: /you are on the board/i }),
    ).toBeInTheDocument()
    expect(useJobsStore.getState().jobApplications).toHaveLength(1)
    expect(useJobsStore.getState().jobApplications[0].company).toBe('Local Co')
  })

  it('returns focus to the register CTA when the dialog is cancelled', async () => {
    const user = userEvent.setup()
    apiMocks.listApplications.mockResolvedValue([])

    render(<Dashboard />)

    const register = await screen.findByRole('button', {
      name: /register your first application/i,
    })
    await user.click(register)
    await user.click(await screen.findByRole('button', { name: /close form/i }))

    await waitFor(() => expect(register).toHaveFocus())
    expect(
      screen.queryByRole('heading', { name: /you are on the board/i }),
    ).not.toBeInTheDocument()
  })

  it('does not transition after a failed save', async () => {
    const user = userEvent.setup()
    apiMocks.listApplications.mockResolvedValue([])
    apiMocks.createApplication.mockRejectedValue(new Error('Could not save'))

    render(<Dashboard />)

    await user.click(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    )
    await user.type(await screen.findByLabelText(/position/i), 'Designer')
    await user.type(screen.getByLabelText(/company/i), 'Globex')
    await user.click(screen.getByRole('button', { name: /save application/i }))

    expect(apiMocks.createApplication).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole('heading', { name: /you are on the board/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save application/i })).toBeInTheDocument()
    expect(useJobsStore.getState().jobApplications).toHaveLength(0)
  })

  it('honours reduced motion by skipping the animation with a focused dashboard', async () => {
    const user = userEvent.setup()
    window.matchMedia = vi.fn((query: string) =>
      matchMediaResult(query.includes('prefers-reduced-motion')),
    )
    apiMocks.listApplications.mockResolvedValue([])

    render(<Dashboard />)

    await user.click(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    )
    await user.type(await screen.findByLabelText(/position/i), 'Engineer')
    await user.type(screen.getByLabelText(/company/i), 'Acme')
    await user.click(screen.getByRole('button', { name: /save application/i }))

    expect(
      screen.queryByRole('heading', { name: /you are on the board/i }),
    ).not.toBeInTheDocument()

    const dashboardHeading = await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(dashboardHeading).toHaveFocus())
    expect(await screen.findByText('Applications table')).toBeInTheDocument()
  })

  it('restarts welcome after a reload with a confirmed empty list', async () => {
    const user = userEvent.setup()
    apiMocks.listApplications.mockResolvedValue([])

    const first = render(<Dashboard />)
    await user.click(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    )
    await user.type(await screen.findByLabelText(/position/i), 'Engineer')
    await user.type(screen.getByLabelText(/company/i), 'Acme')
    await user.click(screen.getByRole('button', { name: /save application/i }))
    await screen.findByRole('heading', { name: /you are on the board/i })
    await user.click(screen.getByRole('button', { name: /skip animation/i }))
    await screen.findByText('Applications table')

    first.unmount()
    resetJobsStore()
    apiMocks.listApplications.mockResolvedValue([])

    render(<Dashboard />)

    expect(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Applications table')).not.toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('first-run')
  })

  it('returns to welcome after a confirmed single last delete and replays the journey on the next save', async () => {
    const user = userEvent.setup()
    const job = makeApplication({ id: 31, position: 'Solo' })
    apiMocks.listApplications.mockResolvedValue([job])

    render(<Dashboard />)
    await screen.findByText('Applications table')
    expect(useDashboardModeStore.getState().mode).toBe('regular')

    act(() => {
      const transactionId = useJobsStore
        .getState()
        .beginDelete(authState.userId, [job.id])
      useJobsStore.getState().setJobs([])
      useJobsStore.getState().confirmDelete(authState.userId, transactionId, [job.id])
    })

    expect(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    ).toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('first-run')

    // The next confirmed save plays the same first-application journey.
    act(() => {
      useJobsStore
        .getState()
        .addJob(makeApplication({ id: 32, position: 'New role' }), authState.userId)
    })

    expect(
      await screen.findByRole('heading', { name: /you are on the board/i }),
    ).toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('first-run')

    await user.click(screen.getByRole('button', { name: /skip animation/i }))
    expect(await screen.findByText('Applications table')).toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('regular')
  })

  it('returns to welcome after a confirmed bulk last delete', async () => {
    const jobs = [
      makeApplication({ id: 41, position: 'One' }),
      makeApplication({ id: 42, position: 'Two' }),
    ]
    apiMocks.listApplications.mockResolvedValue(jobs)

    render(<Dashboard />)
    await screen.findByText('Applications table')

    act(() => {
      const ids = jobs.map((job) => job.id)
      const transactionId = useJobsStore.getState().beginDelete(authState.userId, ids)
      useJobsStore.getState().setJobs([])
      useJobsStore.getState().confirmDelete(authState.userId, transactionId, ids)
    })

    expect(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    ).toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('first-run')
  })

  it('stays regular during the optimistic delete and Undo window', async () => {
    const job = makeApplication({ id: 51, position: 'Pending' })
    apiMocks.listApplications.mockResolvedValue([job])

    render(<Dashboard />)
    await screen.findByText('Applications table')

    act(() => {
      useJobsStore.getState().beginDelete(authState.userId, [job.id])
      useJobsStore.getState().setJobs([])
    })

    expect(screen.queryByRole('button', { name: /register your first application/i }))
      .not.toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('regular')

    act(() => {
      const transactions = useJobsStore.getState().pendingDeletions[authState.userId!]
      useJobsStore.getState().cancelDelete(authState.userId, transactions[0].id)
      useJobsStore.getState().setJobs([job])
    })

    expect(screen.queryByRole('button', { name: /register your first application/i }))
      .not.toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('regular')
  })

  it('stays regular when the last delete fails', async () => {
    const job = makeApplication({ id: 61, position: 'Fails' })
    apiMocks.listApplications.mockResolvedValue([job])

    render(<Dashboard />)
    await screen.findByText('Applications table')

    act(() => {
      const transactionId = useJobsStore
        .getState()
        .beginDelete(authState.userId, [job.id])
      useJobsStore.getState().setJobs([])
      useJobsStore.getState().failDelete(authState.userId, transactionId)
      useJobsStore.getState().setJobs([job])
    })

    expect(screen.queryByRole('button', { name: /register your first application/i }))
      .not.toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('regular')
  })

  it('stays regular after a partial bulk delete leaves rows behind', async () => {
    const jobs = [
      makeApplication({ id: 71, position: 'Deleted' }),
      makeApplication({ id: 72, position: 'Kept' }),
    ]
    apiMocks.listApplications.mockResolvedValue(jobs)

    render(<Dashboard />)
    await screen.findByText('Applications table')

    act(() => {
      const transactionId = useJobsStore
        .getState()
        .beginDelete(authState.userId, [71, 72])
      useJobsStore.getState().setJobs([jobs[1]])
      useJobsStore.getState().confirmDelete(authState.userId, transactionId, [71])
    })

    expect(screen.queryByRole('button', { name: /register your first application/i }))
      .not.toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('regular')
  })

  it('ignores another account’s confirmed delete', async () => {
    const job = makeApplication({ id: 81, position: 'Mine' })
    apiMocks.listApplications.mockResolvedValue([job])

    render(<Dashboard />)
    await screen.findByText('Applications table')

    act(() => {
      const transactionId = useJobsStore
        .getState()
        .beginDelete('user_someone_else', [job.id])
      useJobsStore.getState().setJobs([])
      useJobsStore
        .getState()
        .confirmDelete('user_someone_else', transactionId, [job.id])
    })

    expect(screen.queryByRole('button', { name: /register your first application/i }))
      .not.toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('regular')
  })

  it('discards a stale row confirmed deleted while the initial GET is pending', async () => {
    const job = makeApplication({ id: 91, position: 'Stale' })
    let resolveList!: (value: JobApplication[]) => void
    apiMocks.listApplications.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    render(<Dashboard />)
    expect(screen.getByText('Loading your dashboard')).toBeInTheDocument()

    act(() => {
      const transactionId = useJobsStore
        .getState()
        .beginDelete(authState.userId, [job.id])
      useJobsStore.getState().confirmDelete(authState.userId, transactionId, [job.id])
    })

    await act(async () => {
      resolveList([job])
    })

    expect(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    ).toBeInTheDocument()
    expect(useJobsStore.getState().jobApplications).toEqual([])
    expect(useDashboardModeStore.getState().mode).toBe('first-run')
  })

  it('keeps a pending remount row hidden without welcoming until confirmation', async () => {
    const job = makeApplication({ id: 92, position: 'Pending remount' })
    apiMocks.listApplications.mockResolvedValue([job])

    const first = render(<Dashboard />)
    await screen.findByText('Applications table')

    let transactionId = ''
    act(() => {
      transactionId = useJobsStore.getState().beginDelete(authState.userId, [job.id])
      useJobsStore.getState().setJobs([])
    })
    first.unmount()

    apiMocks.listApplications.mockResolvedValue([job])
    render(<Dashboard />)

    // The stale GET row is suppressed, but the pending transaction means the
    // dashboard stays regular until the server confirms the delete.
    expect(await screen.findByText('Applications table')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /register your first application/i }))
      .not.toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('regular')

    act(() => {
      useJobsStore.getState().confirmDelete(authState.userId, transactionId, [job.id])
    })

    expect(
      await screen.findByRole('button', {
        name: /register your first application/i,
      }),
    ).toBeInTheDocument()
    expect(useDashboardModeStore.getState().mode).toBe('first-run')
  })
})
