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
    useJobsStore.setState({ jobApplications: [] })
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
