import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

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

const demoUserId = 'demo-user'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const [applications, statusFlow] = await Promise.all([
      listApplications(demoUserId),
      getStatusFlow(demoUserId),
    ])

    return { applications, statusFlow }
  },
  component: Dashboard,
})

function Dashboard() {
  const { applications, statusFlow } = Route.useLoaderData()
  const setApplications = useJobsStore((s) => s.setJobs)
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore(
    (s) => s.setAggregatedStatusHistory,
  )

  useEffect(() => {
    // Populate stores from loader
    setApplications(applications as any)
    setAggregatedStatusHistory(statusFlow as any)
  }, [applications, statusFlow, setApplications, setAggregatedStatusHistory])

  return (
    <div className="space-y-6">
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <section className="w-full">
          <Chart />
        </section>
        <section className="w-full">
          <JobApplicationForm user_id={demoUserId} />
        </section>
      </section>

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
    </div>
  )
}
