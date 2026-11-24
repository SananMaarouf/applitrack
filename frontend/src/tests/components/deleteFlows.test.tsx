import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { JobApplication } from '@/types/jobApplication'

const apiMocks = vi.hoisted(() => ({
  deleteApplication: vi.fn(),
  getStatusFlow: vi.fn(),
  getAttachmentUrl: vi.fn(),
}))

const authMocks = vi.hoisted(() => ({
  getToken: vi.fn(),
}))

const toastFn = vi.hoisted(() => vi.fn())
const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  dismiss: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: authMocks.getToken, userId: 'test_user' }),
}))

vi.mock('@/api/applications', () => apiMocks)

vi.mock('@/components/edit-application-action', () => ({
  EditApplicationAction: ({ application }: { application: JobApplication }) => (
    <button type="button" aria-label={`Edit application for ${application.position}`}>
      Edit
    </button>
  ),
}))

vi.mock('sonner', () => ({ toast: Object.assign(toastFn, toastMocks) }))

import { DataTable } from '@/components/data-table'
import { useJobsStore } from '@/store/jobsStore'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'

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

function resetStore(jobs: JobApplication[]) {
  useJobsStore.setState({
    jobApplications: jobs,
    activeJobsOwnerId: null,
    pendingDeletions: {},
    deletionEventsByUser: {},
    lastConfirmedDeletionByUser: {},
    deletionRevisions: {},
    analyticsRevisions: {},
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  authMocks.getToken.mockResolvedValue('token')
  resetStore([])
  useAggregatedStatusHistoryStore.setState({ aggregatedStatusHistory: [] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('single application delete', () => {
  it('keeps the row deleted when status-flow refresh fails after a successful delete', async () => {
    const job = makeApplication()
    resetStore([job])
    apiMocks.deleteApplication.mockResolvedValue(undefined)
    apiMocks.getStatusFlow.mockRejectedValue(new Error('status-flow unavailable'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<DataTable />)
    const deleteButton = await screen.findByLabelText(`Delete application for ${job.position}`)
    vi.useFakeTimers()
    fireEvent.click(deleteButton)
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(apiMocks.deleteApplication).toHaveBeenCalledWith('token', job.id)
    expect(useJobsStore.getState().jobApplications).toEqual([])
    expect(toastMocks.error).not.toHaveBeenCalled()
    expect(toastMocks.success).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalled()
    expect(useJobsStore.getState().lastConfirmedDeletionByUser.test_user).toMatchObject({
      userId: 'test_user',
      ids: [job.id],
    })
    expect(useJobsStore.getState().hasPendingDeletes('test_user')).toBe(false)
    expect(useJobsStore.getState().getAnalyticsRevision('test_user')).toBe(1)
  })

  it('restores the row when the delete request itself fails', async () => {
    const job = makeApplication()
    resetStore([job])
    apiMocks.deleteApplication.mockRejectedValue(new Error('delete failed'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<DataTable />)
    const deleteButton = await screen.findByLabelText(`Delete application for ${job.position}`)
    vi.useFakeTimers()
    fireEvent.click(deleteButton)
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(useJobsStore.getState().jobApplications).toEqual([job])
    expect(toastMocks.error).toHaveBeenCalled()
    expect(useJobsStore.getState().lastConfirmedDeletionByUser.test_user).toBeUndefined()
    expect(useJobsStore.getState().hasPendingDeletes('test_user')).toBe(false)
    expect(useJobsStore.getState().getAnalyticsRevision('test_user')).toBe(0)
  })

  it('still cancels the pending delete when Undo is clicked', async () => {
    const job = makeApplication()
    resetStore([job])

    render(<DataTable />)
    fireEvent.click(await screen.findByLabelText(`Delete application for ${job.position}`))
    vi.useFakeTimers()

    const undo = toastFn.mock.calls[0][1].action.onClick
    undo()
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(apiMocks.deleteApplication).not.toHaveBeenCalled()
    expect(useJobsStore.getState().jobApplications).toEqual([job])
    expect(useJobsStore.getState().lastConfirmedDeletionByUser.test_user).toBeUndefined()
    expect(useJobsStore.getState().hasPendingDeletes('test_user')).toBe(false)
    expect(useJobsStore.getState().getAnalyticsRevision('test_user')).toBe(0)
  })
})

describe('bulk application delete', () => {
  it('keeps deleted rows gone when status-flow refresh fails', async () => {
    const user = userEvent.setup()
    const job = makeApplication()
    resetStore([job])
    apiMocks.deleteApplication.mockResolvedValue(undefined)
    apiMocks.getStatusFlow.mockRejectedValue(new Error('status-flow unavailable'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<DataTable />)

    await user.click(await screen.findByLabelText('Select row'))
    await user.click(screen.getByRole('button', { name: /Delete \(1\)/ }))

    await waitFor(() => expect(apiMocks.deleteApplication).toHaveBeenCalledWith('token', job.id))
    await waitFor(() => expect(useJobsStore.getState().jobApplications).toHaveLength(0))
    expect(toastMocks.error).not.toHaveBeenCalled()
    expect(toastMocks.success).toHaveBeenCalledWith('Successfully deleted 1 job application(s)')
    expect(useJobsStore.getState().lastConfirmedDeletionByUser.test_user).toMatchObject({
      userId: 'test_user',
      ids: [job.id],
    })
    expect(useJobsStore.getState().hasPendingDeletes('test_user')).toBe(false)
  })

  it('refreshes after a partial failure without dropping a concurrently saved row', async () => {
    const user = userEvent.setup()
    const deleted = makeApplication({ id: 1, position: 'Deleted' })
    const failed = makeApplication({ id: 2, position: 'Delete failed' })
    const savedMeanwhile = makeApplication({ id: 3, position: 'Saved meanwhile' })
    resetStore([deleted, failed])

    let rejectDelete: (reason: Error) => void = () => {}
    apiMocks.deleteApplication.mockImplementation((_token: string, id: number) => {
      if (id === failed.id) {
        return new Promise((_resolve, reject) => {
          rejectDelete = reject
        })
      }
      return Promise.resolve()
    })
    apiMocks.getStatusFlow.mockRejectedValue(new Error('status-flow unavailable'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<DataTable />)

    await user.click(await screen.findByLabelText('Select all'))
    await user.click(screen.getByRole('button', { name: /Delete \(2\)/ }))

    // A save lands while the deletes are still in flight.
    await act(async () => {
      useJobsStore.getState().setJobs([...useJobsStore.getState().jobApplications, savedMeanwhile])
    })

    await act(async () => {
      rejectDelete(new Error('delete failed'))
      await Promise.resolve()
    })

    await waitFor(() =>
      expect(
        useJobsStore.getState().jobApplications.map((job) => job.id).sort(),
      ).toEqual([failed.id, savedMeanwhile.id]),
    )
    expect(apiMocks.getStatusFlow).toHaveBeenCalledWith('token')
    expect(toastMocks.error).toHaveBeenCalledWith('delete failed')
    expect(toastMocks.success).not.toHaveBeenCalled()
    // The transaction confirms only the successful id and never stays pending.
    expect(useJobsStore.getState().lastConfirmedDeletionByUser.test_user).toMatchObject({
      userId: 'test_user',
      ids: [deleted.id],
    })
    expect(useJobsStore.getState().hasPendingDeletes('test_user')).toBe(false)
  })
})
