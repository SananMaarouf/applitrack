import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'

import { listApplications, getStatusFlow } from '@/api/applications'
import { useJobsStore } from '@/store/jobsStore'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'

import { Chart } from '@/components/pieChart'
import { DataTable } from '@/components/data-table'
import { SankeyDiagram } from '@/components/sankey-diagram'
import { JobApplicationForm } from '@/components/jobApplicationForm'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth()
  const setApplications = useJobsStore((s) => s.setJobs)
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore(
    (s) => s.setAggregatedStatusHistory,
  )

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

  if (!isLoaded) return <div>Loading...</div>
  if (!userId) return <Navigate to={'/sign-in' as any} />
  console.log(useAggregatedStatusHistoryStore.getState().aggregatedStatusHistory)

  return (
    <div className="space-y-6 max-w-6xl mx-auto my-8">
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto">
        <section className="w-full">
          <Chart />
        </section>
        <section className="w-full">
          <JobApplicationForm user_id={userId} />
        </section>
      </section>

      <section className='w-full mx-auto'>
        <Accordion type="multiple" defaultValue={['item-2']}>
          <AccordionItem value="item-1">
            <AccordionTrigger className="px-4 cursor-pointer">Status History</AccordionTrigger>
            <AccordionContent>
              <SankeyDiagram />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="px-4 cursor-pointer">Application management</AccordionTrigger>
            <AccordionContent>
              <DataTable />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

    </div>
  )
}
