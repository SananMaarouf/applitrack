import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'

import { listApplications, getStatusFlow, getDashboardTrends } from '@/api/applications'
import { useJobsStore } from '@/store/jobsStore'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'
import { useTrendsStore } from '@/store/trendsStore'

import { Chart } from '@/components/pieChart'
import { RadarStatusChart } from '@/components/radarChart'
import { BarStatusChart } from '@/components/barChart'
import { DataTable } from '@/components/data-table'
import { SankeyDiagram } from '@/components/sankey-diagram'
import { JobApplicationForm } from '@/components/jobApplicationForm'
import { TrendCards } from '@/components/trendCards'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useMediaQuery } from '@/hooks/use-media-query'

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
  const isMd = useMediaQuery('(min-width: 768px)')

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
    <div className="space-y-1 max-w-6xl mx-auto my-2">
      <section className="w-full grid grid-cols-1 lg:grid-cols-10 gap-4 mx-auto">
        <div className="space-y-4 lg:col-span-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <TrendCards
              trends={trends}
              period={period}
              isLoading={isLoading}
              onPeriodChange={setPeriod}
            />
            <Chart />
          </div>
          {isMd ? (
            <BarStatusChart />
          ) : (
            <Accordion type="single" collapsible>
              <AccordionItem value="bar-chart" className="border rounded-lg">
                <AccordionTrigger className="bg-primary text-primary-foreground px-4 cursor-pointer">Applications over time</AccordionTrigger>
                <AccordionContent>
                  <BarStatusChart />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>

        <div className="lg:col-span-3">
          <JobApplicationForm user_id={userId} />
        </div>
      </section>

      <section className='w-full mx-auto mt-1'>
        <Accordion type="multiple" defaultValue={['item-2']} className="flex flex-col gap-2">
          <AccordionItem value="item-1">
            <AccordionTrigger className="bg-primary text-primary-foreground px-4 cursor-pointer">Status History</AccordionTrigger>
            <AccordionContent>
              <SankeyDiagram />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="bg-primary text-primary-foreground px-4 cursor-pointer">Application management</AccordionTrigger>
            <AccordionContent>
              <DataTable />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

    </div>
  )
}
