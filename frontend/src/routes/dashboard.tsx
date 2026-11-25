import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/clerk-react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { listApplications, getStatusFlow, getDashboardTrends } from '@/api/applications'
import { useJobsStore } from '@/store/jobsStore'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'
import { useDashboardModeStore } from '@/store/dashboardModeStore'
import { useTrendsStore } from '@/store/trendsStore'
import {
  buildDashboardGreeting,
  resolveDashboardName,
} from '@/lib/dashboard-greeting'
import type { JobApplication } from '@/types/jobApplication'

import { AuthRedirect } from '@/components/auth-redirect'
import { Chart } from '@/components/pieChart'
import { BarStatusChart } from '@/components/barChart'
import { DataTable } from '@/components/data-table'
import { FirstApplicationJourney } from '@/components/first-application-journey'
import { FirstApplicationWelcome } from '@/components/first-application-welcome'
import { JobApplicationForm } from '@/components/jobApplicationForm'
import { SankeyDiagram, type SankeyDiagramHandle } from '@/components/sankey-diagram'
import { TrendCards } from '@/components/trendCards'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ChevronDown, Download } from 'lucide-react'
import type { DashboardTrends } from '@/types/jobApplication'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

type TrendRequestState = {
  status: 'loading' | 'success' | 'error'
  /** Identifies the user + period the payload belongs to. */
  key: string | null
  data: DashboardTrends | null
  error: string | null
}

type DashboardView = 'loading' | 'welcome' | 'journey' | 'regular' | 'error'

const initialTrendRequest: TrendRequestState = {
  status: 'loading',
  key: null,
  data: null,
  error: null,
}

/**
 * Keep only rows created by the current account while the list request was in
 * flight. Local rows win for duplicate ids, but a missing local attachment key
 * never erases metadata the server already returned.
 */
function mergeServerAndLocalApplications(
  serverApplications: JobApplication[],
  localApplications: JobApplication[],
): JobApplication[] {
  if (localApplications.length === 0) return serverApplications

  const unmatchedLocal = new Map(
    localApplications.map((application) => [application.id, application]),
  )
  const mergedServer = serverApplications.map((application) => {
    const localApplication = unmatchedLocal.get(application.id)
    if (!localApplication) return application

    unmatchedLocal.delete(application.id)
    return {
      ...application,
      ...localApplication,
      attachment_key: localApplication.attachment_key ?? application.attachment_key,
    }
  })

  return [...unmatchedLocal.values(), ...mergedServer]
}

function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-7xl space-y-6 px-2 py-4 md:px-4"
    >
      <span className="sr-only">Loading your dashboard</span>
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}

function DashboardListError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-xl border border-destructive/30 bg-card p-6 text-card-foreground shadow-sm sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground">
            We could not load your applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <Button type="button" variant="outline" onClick={onRetry} className="shrink-0">
        <RefreshCw className="size-4" aria-hidden="true" />
        Retry
      </Button>
    </div>
  )
}

function Dashboard() {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) return <DashboardLoading />
  if (!userId) return <AuthRedirect to="/sign-in" />

  // Remounting for each Clerk id clears local views, refs, timers, and any
  // status/row data that belonged to a different signed-in account.
  return <DashboardForUser key={userId} userId={userId} />
}

function DashboardForUser({ userId }: { userId: string }) {
  const { getToken } = useAuth()
  const { user } = useUser()
  const setApplications = useJobsStore((s) => s.setJobs)
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore(
    (s) => s.setAggregatedStatusHistory,
  )
  const lastCreatedApplication = useJobsStore((s) => s.lastCreatedApplication)
  const lastConfirmedDeletion = useJobsStore(
    (s) => s.lastConfirmedDeletionByUser[userId] ?? null,
  )
  const pendingDeletionCount = useJobsStore(
    (s) => (s.pendingDeletions[userId] ?? []).length,
  )
  const analyticsRevision = useJobsStore(
    (s) => s.analyticsRevisions[userId] ?? 0,
  )
  const applicationCount = useJobsStore((s) => s.jobApplications.length)
  const { period, setPeriod } = useTrendsStore()
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const prefersReducedMotionRef = useRef(prefersReducedMotion)
  const setDashboardMode = useDashboardModeStore((s) => s.setMode)

  const [view, setView] = useState<DashboardView>('loading')
  const [listError, setListError] = useState<string | null>(null)
  const [listRetryNonce, setListRetryNonce] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [focusDashboard, setFocusDashboard] = useState(false)
  const [trendRequest, setTrendRequest] =
    useState<TrendRequestState>(initialTrendRequest)
  const [trendRetryNonce, setTrendRetryNonce] = useState(0)
  const [activeChart, setActiveChart] = useState<'bar' | 'sankey'>('bar')

  const headingRef = useRef<HTMLHeadingElement>(null)
  const registerButtonRef = useRef<HTMLButtonElement>(null)
  const savedDuringDialogRef = useRef(false)
  const welcomeRevisionRef = useRef(0)
  const sankeyRef = useRef<SankeyDiagramHandle>(null)
  const sankeyHasLinks = useAggregatedStatusHistoryStore(
    (s) => s.aggregatedStatusHistory.length > 0,
  )
  const location = useLocation()

  const displayName = resolveDashboardName(user?.firstName, user?.fullName)
  const greeting = buildDashboardGreeting(new Date().getHours(), displayName)

  // Update the shared navigation mode in the same batch as the dashboard view
  // so first-run hiding lands with the welcome/celebration, never a frame late.
  const transitionTo = useCallback(
    (next: DashboardView) => {
      const mode =
        next === 'welcome' || next === 'journey'
          ? 'first-run'
          : next === 'regular'
            ? 'regular'
            : 'unknown'
      setDashboardMode(userId, mode)
      setView(next)
    },
    [userId, setDashboardMode],
  )

  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion
  }, [prefersReducedMotion])

  // Establish the canonical-row owner before paint and before any snapshot or
  // pending form save can write. Layout effects run before the reset/list
  // effects below, so a foreign save cannot slip into this account's rows.
  useLayoutEffect(() => {
    useJobsStore.getState().setActiveJobsOwner(userId)
    return () => {
      const jobsStore = useJobsStore.getState()
      if (jobsStore.activeJobsOwnerId === userId) {
        jobsStore.setActiveJobsOwner(null)
      }
    }
  }, [userId])

  // The keyed subtree represents one account, so drop any rows/status left by a
  // previous signed-in user before the fresh snapshot arrives.
  useEffect(() => {
    setApplications([])
    setAggregatedStatusHistory([])
  }, [setApplications, setAggregatedStatusHistory])

  useEffect(() => {
    return () => {
      const modeStore = useDashboardModeStore.getState()
      if (modeStore.userId === userId) modeStore.setMode(userId, 'unknown')
    }
  }, [userId])

  // ── List snapshot ─────────────────────────────────────────────────────────
  // The alternate first-run dashboard is gated on a successful, empty list.
  // Loading, missing tokens, and failures never reach the welcome view.
  useEffect(() => {
    let cancelled = false
    const revisionAtStart = useJobsStore.getState().getCreateRevision(userId)

    transitionTo('loading')
    setListError(null)

    ;(async () => {
      try {
        const token = await getToken()
        if (cancelled) return
        if (!token) {
          setListError(
            'Your session could not be verified. Retry to load your applications.',
          )
          transitionTo('error')
          return
        }

        const applications = (await listApplications(token)) as JobApplication[]
        if (cancelled) return

        const jobsStore = useJobsStore.getState()
        // A delete can be confirmed (or still pending) while this GET is in
        // flight, and a remount can start after a confirmation with a stale
        // server snapshot. Subtract every known deleted/pending id so the
        // snapshot can never resurrect an optimistically removed row.
        const deletedIds = new Set([
          ...jobsStore.deletedIdsSince(userId, 0),
          ...jobsStore.getPendingDeletionIds(userId),
        ])
        const visibleApplications = applications.filter(
          (application) => !deletedIds.has(application.id),
        )
        const createdDuringRequest = jobsStore
          .createdApplicationsSince(userId, revisionAtStart)
          .filter((application) => !deletedIds.has(application.id))
        const createdIds = new Set(
          createdDuringRequest.map((application) => application.id),
        )
        const preexistingApplications = visibleApplications.filter(
          (application) => !createdIds.has(application.id),
        )
        const merged = mergeServerAndLocalApplications(
          visibleApplications,
          createdDuringRequest,
        )
        setApplications(merged)

        if (merged.length > 0) {
          // A save can land from the navbar/sidebar while this snapshot is in
          // flight, and the server may already include it. Exclude those ids
          // when deciding whether anything existed before this save.
          const isFirstSave =
            preexistingApplications.length === 0 &&
            createdDuringRequest.length > 0

          if (isFirstSave) {
            if (prefersReducedMotionRef.current) {
              transitionTo('regular')
              setFocusDashboard(true)
            } else {
              transitionTo('journey')
            }
            return
          }

          transitionTo('regular')
          return
        }

        // A delete confirmed while this GET was in flight has not settled in
        // the UI yet; keep the regular dashboard until its transaction clears
        // rather than showing the welcome view during an Undo window.
        if (jobsStore.hasPendingDeletes(userId)) {
          transitionTo('regular')
          return
        }

        // A confirmed empty list always starts (or restarts) the first
        // application journey. No historical "seen" flag can suppress it, so a
        // reload, a new device, or a newly emptied account all behave the same.
        welcomeRevisionRef.current = jobsStore.getCreateRevision(userId)
        transitionTo('welcome')
      } catch (error) {
        if (cancelled) return
        console.error('Failed to load dashboard applications', error)
        setListError(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while loading your applications.',
        )
        transitionTo('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, getToken, setApplications, listRetryNonce, transitionTo])

  // ── Status flow snapshot ───────────────────────────────────────────────────
  // Loaded independently from the application list so a status-flow failure can
  // never be mistaken for an empty account or block the first-run decision.
  useEffect(() => {
    if (!userId || view !== 'regular') return

    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        if (!token || cancelled) return
        const flow = await getStatusFlow(token)
        if (!cancelled) setAggregatedStatusHistory(flow as any)
      } catch (error) {
        if (!cancelled) console.error('Failed to load status flow', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, getToken, setAggregatedStatusHistory, view])

  // ── First-save celebration ─────────────────────────────────────────────────
  // Only a new marker for this Clerk user, above the revision captured when the
  // welcome state was entered, can start the celebration. A stale marker from
  // another account (or an earlier visit) is ignored.
  useEffect(() => {
    if (view !== 'welcome') return

    const marker = lastCreatedApplication
    if (!marker || marker.userId !== userId) return
    if (marker.revision <= welcomeRevisionRef.current) return

    if (prefersReducedMotion) {
      transitionTo('regular')
      setFocusDashboard(true)
      return
    }

    transitionTo('journey')
  }, [view, lastCreatedApplication, userId, prefersReducedMotion, transitionTo])

  // ── Confirmed last-delete reset ───────────────────────────────────────────
  // Optimistic removals and the 5s Undo window are tracked as pending
  // transactions. The welcome view appears only once every delete for this
  // account has been confirmed by the server and no rows remain, so Undo,
  // failures, partial bulk failures, and overlapping deletes stay regular.
  useEffect(() => {
    if (view !== 'regular') return
    if (!lastConfirmedDeletion || lastConfirmedDeletion.userId !== userId) return
    if (pendingDeletionCount > 0) return
    if (applicationCount > 0) return

    // Any older save marker belongs to the applications just deleted; it must
    // not replay the journey when this reset renders the welcome view.
    welcomeRevisionRef.current = useJobsStore.getState().getCreateRevision(userId)
    transitionTo('welcome')
  }, [
    view,
    lastConfirmedDeletion,
    pendingDeletionCount,
    applicationCount,
    userId,
    transitionTo,
  ])

  useEffect(() => {
    if (view !== 'regular' || !focusDashboard) return
    headingRef.current?.focus()
    setFocusDashboard(false)
  }, [view, focusDashboard])

  // ── Hash anchors in the regular dashboard ─────────────────────────────────
  useEffect(() => {
    if (view !== 'regular' || !location.hash) return

    const sectionId = location.hash.replace(/^#/, '')
    const element = document.getElementById(sectionId)
    if (!element) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [location.hash, view])

  // ── Trends ─────────────────────────────────────────────────────────────────
  // Deferred until the regular dashboard is visible. This preserves the chosen
  // period and guarantees the first saved application is included in the count.
  useEffect(() => {
    if (!userId || view !== 'regular') return

    const key = `${userId}:${period}`
    let cancelled = false
    setTrendRequest({ status: 'loading', key, data: null, error: null })

    ;(async () => {
      try {
        const token = await getToken()
        if (cancelled) return
        if (!token) {
          setTrendRequest({
            status: 'error',
            key,
            data: null,
            error:
              'Your session could not be verified. Retry to request the trend data again.',
          })
          return
        }

        const data = await getDashboardTrends(token, period)
        if (cancelled) return
        setTrendRequest({ status: 'success', key, data, error: null })
      } catch (error) {
        if (cancelled) return
        console.error('Failed to load trend data', error)
        setTrendRequest({
          status: 'error',
          key,
          data: null,
          error: error instanceof Error ? error.message : 'Unable to load trend metrics.',
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, getToken, period, trendRetryNonce, analyticsRevision, view])

  const activeTrendKey = userId ? `${userId}:${period}` : null
  const isTrendRequestCurrent =
    activeTrendKey !== null && trendRequest.key === activeTrendKey
  const trendStatus = isTrendRequestCurrent ? trendRequest.status : 'loading'
  const trendData =
    isTrendRequestCurrent &&
    trendStatus === 'success' &&
    trendRequest.data?.period === period
      ? trendRequest.data
      : null
  const trendError =
    isTrendRequestCurrent && trendStatus === 'error' ? trendRequest.error : null

  const retryTrends = () => {
    if (!userId || view !== 'regular') return
    setTrendRequest({
      status: 'loading',
      key: `${userId}:${period}`,
      data: null,
      error: null,
    })
    setTrendRetryNonce((value) => value + 1)
  }

  const retryApplications = () => {
    setListRetryNonce((value) => value + 1)
  }

  const closeForm = useCallback(() => {
    setFormOpen(false)
    if (!savedDuringDialogRef.current) {
      window.requestAnimationFrame(() => registerButtonRef.current?.focus())
    }
  }, [])

  const handleFormOpenChange = (open: boolean) => {
    if (open) {
      savedDuringDialogRef.current = false
      setFormOpen(true)
      return
    }
    closeForm()
  }

  const handleApplicationSaved = useCallback(() => {
    savedDuringDialogRef.current = true
    setFormOpen(false)
  }, [])

  const completeJourney = useCallback(() => {
    transitionTo('regular')
    setFocusDashboard(true)
  }, [transitionTo])

  if (view === 'loading') {
    return <DashboardLoading />
  }

  if (view === 'error') {
    return (
      <div className="px-2 py-4 md:px-4">
        <DashboardListError
          message={listError ?? 'An unexpected error occurred.'}
          onRetry={retryApplications}
        />
      </div>
    )
  }

  if (view === 'welcome') {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-2 py-4 md:px-4">
        <header className="min-w-0 space-y-1.5">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {greeting.title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {greeting.subtitle}
          </p>
        </header>

        <FirstApplicationWelcome
          ref={registerButtonRef}
          onRegister={() => handleFormOpenChange(true)}
        />

        <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="max-h-[90dvh] overflow-y-auto p-0"
          >
            <JobApplicationForm
              user_id={userId}
              onClose={closeForm}
              onSuccess={handleApplicationSaved}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (view === 'journey') {
    return (
      <div className="px-2 py-4 md:px-4">
        <FirstApplicationJourney
          onComplete={completeJourney}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-2 py-4 md:px-4">
      <header className="min-w-0 space-y-1.5">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-balance rounded-sm text-2xl font-bold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-3xl"
        >
          {greeting.title}
        </h1>
        <p className="hidden max-w-2xl text-sm text-muted-foreground md:block md:text-base">
          {greeting.subtitle}
        </p>
      </header>

      <section
        id="stats-section"
        aria-labelledby="stats-heading"
        className="scroll-mt-6 space-y-4"
      >
        <div className="min-w-0">
          <h2 id="stats-heading" className="text-lg font-semibold text-foreground">
            Overview
          </h2>
          <p className="hidden text-sm text-muted-foreground md:block">
            Key application metrics for the selected comparison period.
          </p>
        </div>
        <TrendCards
          trends={trendData}
          period={period}
          isLoading={trendStatus === 'loading'}
          error={trendError}
          onPeriodChange={setPeriod}
          onRetry={retryTrends}
        />
      </section>

      <section aria-labelledby="analytics-heading" className="space-y-4">
        <div className="min-w-0">
          <h2 id="analytics-heading" className="text-lg font-semibold text-foreground">
            Analytics
          </h2>
          <p className="hidden text-sm text-muted-foreground md:block">
            Understand your pipeline and how applications progress over time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-card-foreground">
                  {activeChart === 'bar' ? 'History' : 'Status flow'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeChart === 'bar'
                    ? 'Monthly application totals across all statuses.'
                    : 'How applications move from one status to the next.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Chart view"
                  className="flex gap-1 rounded-lg bg-muted p-1"
                >
                  <Button
                    variant={activeChart === 'bar' ? 'default' : 'ghost'}
                    size="sm"
                    aria-pressed={activeChart === 'bar'}
                    onClick={() => setActiveChart('bar')}
                  >
                    History
                  </Button>
                  <Button
                    variant={activeChart === 'sankey' ? 'default' : 'ghost'}
                    size="sm"
                    aria-pressed={activeChart === 'sankey'}
                    onClick={() => setActiveChart('sankey')}
                  >
                    Status flow
                  </Button>
                </div>
                {activeChart === 'sankey' && sankeyHasLinks && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        aria-label="Export status flow"
                      >
                        <Download className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Export</span>
                        <ChevronDown className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => sankeyRef.current?.exportCSV()}>
                        <Download className="mr-2 size-4" aria-hidden="true" />
                        Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => sankeyRef.current?.exportDiagram()}>
                        <Download className="mr-2 size-4" aria-hidden="true" />
                        Export PNG
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <div
              key={activeChart}
              className="mt-4 animate-in min-w-0 fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
            >
              {activeChart === 'bar' ? <BarStatusChart /> : <SankeyDiagram ref={sankeyRef} />}
            </div>
          </div>

          <div className="min-w-0 lg:col-span-4">
            <Chart />
          </div>
        </div>
      </section>

      <section
        id="datatable-section"
        aria-labelledby="applications-heading"
        className="scroll-mt-6 space-y-4"
      >
        <div className="min-w-0">
          <h2 id="applications-heading" className="text-lg font-semibold text-foreground">
            Applications
          </h2>
          <p className="hidden text-sm text-muted-foreground md:block">
            Review, filter, and manage every application in one place.
          </p>
        </div>
        <div className="w-full rounded-xl shadow-sm">
          <DataTable />
        </div>
      </section>
    </div>
  )
}
