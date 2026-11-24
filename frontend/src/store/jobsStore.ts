import { create } from 'zustand'
import type { JobApplication } from '@/types/jobApplication'

/**
 * Marker for a locally confirmed save. Revisions are scoped to the Clerk user
 * that submitted the form, so a save from another account can never be mistaken
 * for the current user's first application.
 */
export type CreatedApplicationMarker = {
  application: JobApplication
  /** Clerk user id passed by the form, not the server row's user_id. */
  userId: string | null
  /** Monotonic per-user revision assigned at insert time. */
  revision: number
  /** Timestamp keeps repeated saves of the same payload distinguishable. */
  at: number
}

export type DeleteTransaction = {
  id: string
  userId: string | null
  ids: number[]
  status: 'pending'
  startedAt: number
}

export type ConfirmedDeletion = {
  userId: string | null
  ids: number[]
  revision: number
  at: number
}

const ANONYMOUS_USER_KEY = '__anonymous__'
let deleteTransactionSequence = 0

function userKey(userId: string | null | undefined): string {
  return userId ?? ANONYMOUS_USER_KEY
}

type JobsStore = {
  jobApplications: JobApplication[]
  /**
   * Clerk id whose dashboard currently owns the canonical rows. A late save
   * from another account may be tracked for reconciliation but must never be
   * prepended to the rows currently on screen.
   */
  activeJobsOwnerId: string | null
  /** Latest confirmed create revision per Clerk user id. */
  createRevisions: Record<string, number>
  /** Confirmed creates per Clerk user, retained for in-flight GET merges. */
  createdApplicationsByUser: Record<string, CreatedApplicationMarker[]>
  lastCreatedApplication: CreatedApplicationMarker | null
  /** Pending optimistic deletes per Clerk user, keyed by transaction id list. */
  pendingDeletions: Record<string, DeleteTransaction[]>
  /** Every successfully confirmed deletion event per Clerk user. */
  deletionEventsByUser: Record<string, ConfirmedDeletion[]>
  /** Latest successfully deleted rows per Clerk user. */
  lastConfirmedDeletionByUser: Record<string, ConfirmedDeletion>
  /** Monotonic per-user confirmed deletion revision. */
  deletionRevisions: Record<string, number>
  /** Per-user revision bumped by confirmed edits and deletes for analytics. */
  analyticsRevisions: Record<string, number>
  setJobs: (jobs: JobApplication[]) => void
  setActiveJobsOwner: (userId: string | null) => void
  addJob: (job: JobApplication, userId?: string | null) => void
  editJob: (job: JobApplication, userId: string) => void
  beginDelete: (userId: string | null, ids: number[]) => string
  confirmDelete: (
    userId: string | null,
    transactionId: string,
    confirmedIds: number[],
  ) => void
  failDelete: (userId: string | null, transactionId: string) => void
  cancelDelete: (userId: string | null, transactionId: string) => void
  hasPendingDeletes: (userId: string | null | undefined) => boolean
  getDeletionRevision: (userId: string | null | undefined) => number
  deletedIdsSince: (
    userId: string | null | undefined,
    revision: number,
  ) => number[]
  getPendingDeletionIds: (userId: string | null | undefined) => number[]
  getAnalyticsRevision: (userId: string | null | undefined) => number
  getCreateRevision: (userId: string | null | undefined) => number
  createdApplicationsSince: (
    userId: string | null | undefined,
    revision: number,
  ) => JobApplication[]
}

function withoutPendingTransaction(
  pendingDeletions: Record<string, DeleteTransaction[]>,
  key: string,
  transactionId: string,
): Record<string, DeleteTransaction[]> {
  const remaining = (pendingDeletions[key] ?? []).filter(
    (transaction) => transaction.id !== transactionId,
  )
  const next = { ...pendingDeletions }
  if (remaining.length > 0) {
    next[key] = remaining
  } else {
    delete next[key]
  }
  return next
}

export const useJobsStore = create<JobsStore>((set, get) => ({
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
  setJobs: (jobs) => set({ jobApplications: jobs }),
  setActiveJobsOwner: (userId) => set({ activeJobsOwnerId: userId }),
  addJob: (job, userId = null) =>
    set((state) => {
      const key = userKey(userId)
      const revision = (state.createRevisions[key] ?? 0) + 1
      const marker: CreatedApplicationMarker = {
        application: job,
        userId: userId ?? null,
        revision,
        at: Date.now(),
      }
      const canWriteCanonicalRows =
        !state.activeJobsOwnerId || !userId || state.activeJobsOwnerId === userId

      return {
        jobApplications: canWriteCanonicalRows
          ? [
              job,
              ...state.jobApplications.filter((application) => application.id !== job.id),
            ]
          : state.jobApplications,
        createRevisions: {
          ...state.createRevisions,
          [key]: revision,
        },
        createdApplicationsByUser: {
          ...state.createdApplicationsByUser,
          [key]: [...(state.createdApplicationsByUser[key] ?? []), marker],
        },
        lastCreatedApplication: marker,
      }
    }),
  editJob: (job, userId) =>
    set((state) => {
      const key = userKey(userId)
      const canWriteCanonicalRows =
        !state.activeJobsOwnerId || state.activeJobsOwnerId === userId
      const exists = state.jobApplications.some(
        (application) => application.id === job.id,
      )
      if (!canWriteCanonicalRows || !exists) return state

      return {
        jobApplications: state.jobApplications.map((application) =>
          application.id === job.id ? job : application,
        ),
        analyticsRevisions: {
          ...state.analyticsRevisions,
          [key]: (state.analyticsRevisions[key] ?? 0) + 1,
        },
      }
    }),
  beginDelete: (userId, ids) => {
    deleteTransactionSequence += 1
    const transaction: DeleteTransaction = {
      id: `delete-${deleteTransactionSequence}-${Date.now()}`,
      userId: userId ?? null,
      ids: [...ids],
      status: 'pending',
      startedAt: Date.now(),
    }
    const key = userKey(userId)

    set((state) => ({
      pendingDeletions: {
        ...state.pendingDeletions,
        [key]: [...(state.pendingDeletions[key] ?? []), transaction],
      },
    }))

    return transaction.id
  },
  confirmDelete: (userId, transactionId, confirmedIds) =>
    set((state) => {
      const key = userKey(userId)
      const transaction = (state.pendingDeletions[key] ?? []).find(
        (pending) => pending.id === transactionId,
      )
      if (!transaction) return state

      const uniqueIds = [...new Set(confirmedIds)]
      const pendingDeletions = withoutPendingTransaction(
        state.pendingDeletions,
        key,
        transactionId,
      )

      if (uniqueIds.length === 0) {
        return { pendingDeletions }
      }

      const revision = (state.deletionRevisions[key] ?? 0) + 1
      const confirmation: ConfirmedDeletion = {
        userId: userId ?? null,
        ids: uniqueIds,
        revision,
        at: Date.now(),
      }
      const confirmedSet = new Set(uniqueIds)
      const canWriteCanonicalRows =
        !state.activeJobsOwnerId ||
        !userId ||
        state.activeJobsOwnerId === userId
      const previousEvents = state.deletionEventsByUser[key] ?? []

      return {
        pendingDeletions,
        // Removing the confirmed ids here makes the outcome atomic even when a
        // stale in-flight GET (or a remount) has just written the row back.
        jobApplications: canWriteCanonicalRows
          ? state.jobApplications.filter(
              (application) => !confirmedSet.has(application.id),
            )
          : state.jobApplications,
        deletionEventsByUser: {
          ...state.deletionEventsByUser,
          [key]: [...previousEvents, confirmation],
        },
        lastConfirmedDeletionByUser: {
          ...state.lastConfirmedDeletionByUser,
          [key]: confirmation,
        },
        deletionRevisions: {
          ...state.deletionRevisions,
          [key]: revision,
        },
        analyticsRevisions: {
          ...state.analyticsRevisions,
          [key]: (state.analyticsRevisions[key] ?? 0) + 1,
        },
      }
    }),
  failDelete: (userId, transactionId) =>
    set((state) => ({
      pendingDeletions: withoutPendingTransaction(
        state.pendingDeletions,
        userKey(userId),
        transactionId,
      ),
    })),
  cancelDelete: (userId, transactionId) =>
    set((state) => ({
      pendingDeletions: withoutPendingTransaction(
        state.pendingDeletions,
        userKey(userId),
        transactionId,
      ),
    })),
  hasPendingDeletes: (userId) =>
    (get().pendingDeletions[userKey(userId)] ?? []).length > 0,
  getDeletionRevision: (userId) => {
    if (!userId) return 0
    return get().deletionRevisions[userKey(userId)] ?? 0
  },
  deletedIdsSince: (userId, revision) => {
    if (!userId) return []
    const events = get().deletionEventsByUser[userKey(userId)] ?? []
    return [
      ...new Set(
        events
          .filter((event) => event.revision > revision)
          .flatMap((event) => event.ids),
      ),
    ]
  },
  getPendingDeletionIds: (userId) => {
    if (!userId) return []
    const transactions = get().pendingDeletions[userKey(userId)] ?? []
    return [...new Set(transactions.flatMap((transaction) => transaction.ids))]
  },
  getAnalyticsRevision: (userId) => {
    if (!userId) return 0
    return get().analyticsRevisions[userKey(userId)] ?? 0
  },
  getCreateRevision: (userId) =>
    userId ? (get().createRevisions[userKey(userId)] ?? 0) : 0,
  createdApplicationsSince: (userId, revision) => {
    if (!userId) return []
    return (get().createdApplicationsByUser[userKey(userId)] ?? [])
      .filter((marker) => marker.revision > revision)
      .map((marker) => marker.application)
  },
}))
