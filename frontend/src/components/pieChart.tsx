'use client'

import { useEffect, useMemo, useState } from 'react'
import { Label, Pie, PieChart } from 'recharts'

import type { JobApplication } from '@/types/jobApplication'
import { useJobsStore } from '@/store/jobsStore'
import { JOB_STATUS_OPTIONS } from '@/lib/job-status-ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig: ChartConfig = JOB_STATUS_OPTIONS.reduce<ChartConfig>(
  (config, { key, label, color }) => {
    config[key] = { label, color }
    return config
  },
  {},
)

export function Chart() {
  const [loading, setLoading] = useState(true)
  const jobApplications: JobApplication[] = useJobsStore(
    (state) => state.jobApplications,
  )

  useEffect(() => {
    if (jobApplications.length > 0 || loading) {
      setLoading(false)
    }
  }, [jobApplications, loading])

  const statusCounts = useMemo(
    () =>
      jobApplications.reduce<Record<number, number>>((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      }, {}),
    [jobApplications],
  )

  const chartData = useMemo(
    () =>
      JOB_STATUS_OPTIONS.map(({ value, key, label, color }) => ({
        key,
        label,
        applications: statusCounts[value] || 0,
        fill: color,
      })),
    [statusCounts],
  )

  const visibleLegendItems = chartData.filter((item) => item.applications > 0)

  return (
    <Card className="flex h-full min-w-0 flex-col gap-3 bg-card">
      <CardHeader className="px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-card-foreground">
          Applications by status
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Distribution across your pipeline
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-4 pt-0">
        {loading ? (
          <div className="flex min-h-48 flex-1 items-center justify-center">
            <div className="h-40 w-40 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
            <span className="sr-only">Loading job applications</span>
          </div>
        ) : jobApplications.length === 0 ? (
          <p className="flex min-h-40 flex-1 items-center justify-center text-center text-sm text-muted-foreground">
            You have no job applications yet.
          </p>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-56"
              role="img"
              aria-label={`Application status distribution across ${jobApplications.length} applications`}
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="key" />}
                />
                <Pie
                  data={chartData}
                  dataKey="applications"
                  nameKey="key"
                  innerRadius={38}
                  outerRadius="88%"
                  strokeWidth={4}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {jobApplications.length}
                            </tspan>
                          </text>
                        )
                      }
                      return null
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul
              aria-label="Applications by status legend"
              className="grid grid-cols-2 gap-x-3 gap-y-1.5"
            >
              {visibleLegendItems.map((item) => (
                <li
                  key={item.key}
                  className="flex min-w-0 items-center gap-1.5 text-xs"
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="ml-auto font-medium tabular-nums text-foreground">
                    {item.applications}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
