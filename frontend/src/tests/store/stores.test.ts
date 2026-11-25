import { describe, it, expect, beforeEach } from 'vitest'
import { useJobsStore } from '@/store/jobsStore'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'
import type { JobApplication } from '@/types/jobApplication'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeJob(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 1,
    created_at: '2026-01-01T00:00:00Z',
    user_id: 'user_abc',
    applied_at: '2026-01-01T00:00:00Z',
    position: 'Software Engineer',
    company: 'Acme Corp',
    status: 1,
    ...overrides,
  }
}

// ── jobsStore ─────────────────────────────────────────────────────────────────

describe('jobsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
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
  })

  it('has an empty list by default', () => {
    const { jobApplications } = useJobsStore.getState()
    expect(jobApplications).toEqual([])
  })

  it('setJobs replaces the entire job list', () => {
    const jobs = [makeJob({ id: 1 }), makeJob({ id: 2, company: 'Globex' })]

    useJobsStore.getState().setJobs(jobs)

    expect(useJobsStore.getState().jobApplications).toEqual(jobs)
  })

  it('setJobs with an empty array clears the list', () => {
    useJobsStore.setState({ jobApplications: [makeJob()] })

    useJobsStore.getState().setJobs([])

    expect(useJobsStore.getState().jobApplications).toHaveLength(0)
  })

  it('preserves all fields of job applications', () => {
    const job = makeJob({
      id: 99,
      position: 'Staff Engineer',
      company: 'Initech',
      status: 5,
      link: 'https://example.com',
      attachment_key: 'uploads/cv.pdf',
      expires_at: '2026-03-01T00:00:00Z',
    })

    useJobsStore.getState().setJobs([job])

    expect(useJobsStore.getState().jobApplications[0]).toMatchObject({
      id: 99,
      position: 'Staff Engineer',
      company: 'Initech',
      status: 5,
      link: 'https://example.com',
      attachment_key: 'uploads/cv.pdf',
    })
  })

  it('editJob replaces only the existing row and bumps analytics without a create marker', () => {
    const original = makeJob({ id: 1, position: 'Old title' })
    const untouched = makeJob({ id: 2, position: 'Other' })
    useJobsStore.getState().setJobs([original, untouched])

    useJobsStore
      .getState()
      .editJob(makeJob({ id: 1, position: 'New title' }), 'user_abc')

    const state = useJobsStore.getState()
    expect(state.jobApplications.map((job) => job.id)).toEqual([1, 2])
    expect(state.jobApplications[0].position).toBe('New title')
    expect(state.jobApplications[1]).toBe(untouched)
    expect(state.getCreateRevision('user_abc')).toBe(0)
    expect(state.lastCreatedApplication).toBeNull()
    expect(state.getAnalyticsRevision('user_abc')).toBe(1)
  })

  it('editJob never inserts an unknown id or writes another account’s rows', () => {
    const job = makeJob({ id: 1 })
    useJobsStore.getState().setJobs([job])
    useJobsStore.getState().setActiveJobsOwner('user_abc')

    useJobsStore
      .getState()
      .editJob(makeJob({ id: 404, position: 'Ghost' }), 'user_abc')
    useJobsStore
      .getState()
      .editJob(makeJob({ id: 1, position: 'Foreign edit' }), 'user_other')

    const state = useJobsStore.getState()
    expect(state.jobApplications).toEqual([job])
    expect(state.getAnalyticsRevision('user_abc')).toBe(0)
    expect(state.getAnalyticsRevision('user_other')).toBe(0)
  })

  it('removes confirmed ids from canonical rows atomically', () => {
    const kept = makeJob({ id: 2 })
    useJobsStore.getState().setJobs([makeJob({ id: 1 }), kept])
    useJobsStore.getState().setActiveJobsOwner('user_abc')
    const transactionId = useJobsStore.getState().beginDelete('user_abc', [1])

    useJobsStore.getState().confirmDelete('user_abc', transactionId, [1])

    expect(useJobsStore.getState().jobApplications).toEqual([kept])
    expect(
      useJobsStore.getState().lastConfirmedDeletionByUser.user_abc,
    ).toMatchObject({ ids: [1] })
  })

  it('does not remove rows on confirmation for a non-owner account', () => {
    const job = makeJob({ id: 1 })
    useJobsStore.getState().setJobs([job])
    useJobsStore.getState().setActiveJobsOwner('user_viewing')
    const transactionId = useJobsStore.getState().beginDelete('user_deleting', [1])

    useJobsStore.getState().confirmDelete('user_deleting', transactionId, [1])

    expect(useJobsStore.getState().jobApplications).toEqual([job])
    expect(
      useJobsStore.getState().lastConfirmedDeletionByUser.user_deleting,
    ).toMatchObject({ ids: [1] })
  })

  it('tracks confirmed deletes per account and ignores unknown transactions', () => {
    const state = useJobsStore.getState()
    const transactionId = state.beginDelete('user_abc', [1, 2])

    expect(useJobsStore.getState().hasPendingDeletes('user_abc')).toBe(true)
    expect(useJobsStore.getState().hasPendingDeletes('user_other')).toBe(false)

    useJobsStore.getState().confirmDelete('user_other', transactionId, [1])
    expect(useJobsStore.getState().hasPendingDeletes('user_abc')).toBe(true)
    expect(useJobsStore.getState().lastConfirmedDeletionByUser.user_abc).toBeUndefined()

    useJobsStore.getState().confirmDelete('user_abc', transactionId, [1, 2])
    expect(useJobsStore.getState().hasPendingDeletes('user_abc')).toBe(false)
    expect(useJobsStore.getState().lastConfirmedDeletionByUser.user_abc).toMatchObject({
      userId: 'user_abc',
      ids: [1, 2],
    })
    expect(useJobsStore.getState().getAnalyticsRevision('user_abc')).toBe(1)
  })
})

// ── aggregatedStatusHistoryStore ──────────────────────────────────────────────

describe('aggregatedStatusHistoryStore', () => {
  beforeEach(() => {
    useAggregatedStatusHistoryStore.setState({ aggregatedStatusHistory: [] })
  })

  it('has an empty list by default', () => {
    const { aggregatedStatusHistory } = useAggregatedStatusHistoryStore.getState()
    expect(aggregatedStatusHistory).toEqual([])
  })

  it('setAggregatedStatusHistory replaces the store list', () => {
    const rows = [
      { From: 'Applied', To: 'Interview', Weight: 10 },
      { From: 'Interview', To: 'Offer', Weight: 3 },
    ]

    useAggregatedStatusHistoryStore.getState().setAggregatedStatusHistory(rows)

    expect(useAggregatedStatusHistoryStore.getState().aggregatedStatusHistory).toEqual(rows)
  })

  it('setAggregatedStatusHistory with an empty array clears the list', () => {
    useAggregatedStatusHistoryStore.setState({
      aggregatedStatusHistory: [{ From: 'Applied', To: 'Rejected', Weight: 5 }],
    })

    useAggregatedStatusHistoryStore.getState().setAggregatedStatusHistory([])

    expect(useAggregatedStatusHistoryStore.getState().aggregatedStatusHistory).toHaveLength(0)
  })
})
