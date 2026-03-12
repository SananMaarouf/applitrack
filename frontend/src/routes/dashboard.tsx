import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { Navigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'

import { listApplications, getStatusFlow, getDashboardTrends } from '@/api/applications'
import { useJobsStore } from '@/store/jobsStore'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'
import { useTrendsStore } from '@/store/trendsStore'

import { Chart } from '@/components/pieChart'
import { RadarStatusChart } from '@/components/radarChart'
import { BarStatusChart } from '@/components/barChart'
import { DataTable } from '@/components/data-table'
import { SankeyDiagram, type SankeyDiagramHandle } from '@/components/sankey-diagram'
import { JobApplicationForm } from '@/components/jobApplicationForm'
import { TrendCards } from '@/components/trendCards'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Download } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth()
  const setApplications = useJobsStore((s) => s.setJobs)
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore(
    (s) => s.setAggregatedStatusHistory,
  )
  const { trends, period, isLoading, setTrends, setPeriod, setLoading } = useTrendsStore()
  const [activeChart, setActiveChart] = useState<'bar' | 'sankey'>('bar')
  const sankeyRef = useRef<SankeyDiagramHandle>(null)
  const sankeyHasLinks = useAggregatedStatusHistoryStore((s) => s.aggregatedStatusHistory.length > 0)
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
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

  // Fetch trends whenever userId or selected period changes
  useEffect(() => {
    if (!userId) return

    let cancelled = false
    setLoading(true)
      ; (async () => {
        const token = await getToken()
        if (!token || cancelled) return
        const data = await getDashboardTrends(token, period)
        if (cancelled) return
        setTrends(data)
      })()
        .catch((e) => console.error('Failed to load trend data', e))
        .finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
    }
  }, [userId, getToken, period, setTrends, setLoading])

  if (!isLoaded) return <div>Loading...</div>
  if (!userId) return <Navigate to={'/sign-in' as any} />

  return (
    <div className="space-y-2 max-w-6xl mx-auto my-2">
      <section className="w-full grid grid-cols-1 lg:grid-cols-10 gap-2 mx-auto">
        <div className="space-y-2 lg:col-span-7">
          <div id="stats-section" className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <TrendCards
              trends={trends}
              period={period}
              isLoading={isLoading}
              onPeriodChange={setPeriod}
            />
            <Chart />
          </div>
          <div className="space-y-2 bg-card rounded-xl p-2">
            {/* set active chart switch */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
                <Button
                  variant={activeChart === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveChart('bar')}
                >
                  Applications over time
                </Button>
                <Button
                  variant={activeChart === 'sankey' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveChart('sankey')}
                >
                  Status flow
                </Button>
              </div>
              {activeChart === 'sankey' && sankeyHasLinks && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => sankeyRef.current?.exportCSV()}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => sankeyRef.current?.exportDiagram()}>
                      <Download className="h-4 w-4 mr-2" />
                      Export PNG
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {activeChart === 'bar' ? <BarStatusChart /> : <SankeyDiagram ref={sankeyRef} />}
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-3">
          <JobApplicationForm user_id={userId} />
        </div>
      </section>

      <section id="datatable-section" className='w-full mx-auto scroll-mt-4'>
        <DataTable />
      </section>

    </div>
  )
}
