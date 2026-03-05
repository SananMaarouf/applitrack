import { describe, it, expect } from 'vitest'
import { JobStatus } from '@/types/jobStatus'

describe('JobStatus enum', () => {
  it('has the correct numeric values', () => {
    expect(JobStatus.APPLIED).toBe(1)
    expect(JobStatus.INTERVIEW).toBe(2)
    expect(JobStatus.SECOND_INTERVIEW).toBe(3)
    expect(JobStatus.THIRD_INTERVIEW).toBe(4)
    expect(JobStatus.OFFER).toBe(5)
    expect(JobStatus.REJECTED).toBe(6)
    expect(JobStatus.GHOSTED).toBe(7)
  })

  it('contains exactly 7 named members', () => {
    const numericKeys = Object.keys(JobStatus).filter((k) => Number.isNaN(Number(k)))
    expect(numericKeys).toHaveLength(7)
  })
})
