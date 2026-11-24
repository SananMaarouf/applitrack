import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { Navigate, useLocation } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/clerk-react'

import { listApplications, getStatusFlow, getDashboardTrends } from '@/api/applications'
import { useJobsStore } from '@/store/jobsStore'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'
import { useTrendsStore } from '@/store/trendsStore'
import {
  buildDashboardGreeting,
  resolveDashboardName,
} from '@/lib/dashboard-greeting'

import { Chart } from '@/components/pieChart'
import { BarStatusChart } from '@/components/barChart'
import { DataTable } from '@/components/data-table'
import { SankeyDiagram, type SankeyDiagramHandle } from '@/components/sankey-diagram'
import { TrendCards } from '@/components/trendCards'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const initialTrendRequest: TrendRequestState = {
  status: 'loading',
  key: null,
  data: null,
  error: null,
}

function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth()
  const { user } = useUser()
  const setApplications = useJobsStore((s) => s.setJobs)
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore(
    (s) => s.setAggregatedStatusHistory,
  )
  const { period, setPeriod } = useTrendsStore()
  const [trendRequest, setTrendRequest] =
    useState<TrendRequestState>(initialTrendRequest)
  const [trendRetryNonce, setTrendRetryNonce] = useState(0)
  const [activeChart, setActiveChart] = useState<'bar' | 'sankey'>('bar')
  const sankeyRef = useRef<SankeyDiagramHandle>(null)
  const sankeyHasLinks = useAggregatedStatusHistoryStore((s) => s.aggregatedStatusHistory.length > 0)
  const location = useLocation()

  const displayName = resolveDashboardName(user?.firstName, user?.fullName)
  const greeting = buildDashboardGreeting(new Date().getHours(), displayName)

  useEffect(() => {
    if (!location.hash) return

    const sectionId = location.hash.replace(/^#/, '')
    const element = document.getElementById(sectionId)
    if (!element) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [location.hash])

  useEffect(() => {
    if (!userId) return

    let cancelled = false
      ; (async () => {
        const token = await getToken()
        if (!token || cancelled) return
        const [applications, statusFlow] = await Promise.all([
          listApplications(token),
          getStatusFlow(token),
        ])
        if (cancelled) return
        setApplications(applications as any)
        setAggregatedStatusHistory(statusFlow as any)
      })().catch((e) => {
        console.error('Failed to load dashboard data', e)
      })

    return () => {
      cancelled = true
    }
  }, [userId, getToken, setApplications, setAggregatedStatusHistory])

  // Fetch trends whenever the signed-in user or selected period changes. The
  // request state is keyed by user + period so a late response can never be
  // shown for a different user or period.
  useEffect(() => {
    if (!userId) return

    const key = `${userId}:${period}`
    let cancelled = false
    setTrendRequest({ status: 'loading', key, data: null, error: null })

      ; (async () => {
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
  }, [userId, getToken, period, trendRetryNonce])

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
    if (!userId) return
    setTrendRequest({
      status: 'loading',
      key: `${userId}:${period}`,
      data: null,
      error: null,
    })
    setTrendRetryNonce((value) => value + 1)
  }

  if (!isLoaded) return <div>Loading...</div>
  if (!userId) return <Navigate to={'/sign-in' as any} />

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-2 py-4 md:px-4">
      <header className="min-w-0 space-y-1.5">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {greeting.title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
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
          <p className="text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">
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
