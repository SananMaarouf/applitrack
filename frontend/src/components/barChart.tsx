import { useMemo } from 'react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useJobsStore } from '@/store/jobsStore'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

const chartConfig = {
  applications: {
    label: 'Applications',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

function toMonthDate(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1))
}

function toMonthKey(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${monthKey}-01`).toLocaleString('en-US', options)
}

export function BarStatusChart() {
  const jobApplications = useJobsStore((state) => state.jobApplications)

  const monthKeys = useMemo(
    () =>
      Object.keys(
        jobApplications.reduce<Record<string, number>>((acc, job) => {
          // `applied_at` is a date-like string (YYYY-MM-DD), so slice keeps month key stable.
          const monthKey = job.applied_at.slice(0, 7)
          if (!/^\d{4}-\d{2}$/.test(monthKey)) return acc
          acc[monthKey] = (acc[monthKey] || 0) + 1
          return acc
        }, {}),
      ).sort((a, b) => a.localeCompare(b)),
    [jobApplications],
  )

  const chartData = useMemo(() => {
    if (monthKeys.length === 0) return []

    const monthlyCounts = jobApplications.reduce<Record<string, number>>((acc, job) => {
      const monthKey = job.applied_at.slice(0, 7)
      if (/^\d{4}-\d{2}$/.test(monthKey)) {
        acc[monthKey] = (acc[monthKey] || 0) + 1
      }
      return acc
    }, {})

    const start = toMonthDate(monthKeys[0])
    const end = new Date(Date.UTC(new Date().getUTCFullYear(), 11, 1))
    const points: Array<{ month: string; applications: number }> = []
    const cursor = new Date(start)

    while (cursor <= end) {
      const month = toMonthKey(cursor)
      points.push({ month, applications: monthlyCounts[month] ?? 0 })
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }

    return points
  }, [jobApplications, monthKeys])

  const tooltipContent = (
    <ChartTooltipContent
      hideLabel
      labelFormatter={(value) =>
        formatMonthLabel(String(value), { month: 'long', year: 'numeric' })
      }
    />
  )

  if (chartData.length === 0) {
    return (
      <p className="flex min-h-64 items-center justify-center text-center text-sm text-muted-foreground">
        No application history to visualize yet.
      </p>
    )
  }

  return (
    <div className="min-w-0">
      <ChartContainer
        config={chartConfig}
        className="mx-auto h-64 w-full min-w-0"
        role="img"
        aria-label="Monthly application totals"
      >
        <BarChart accessibilityLayer data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="month"
            angle={30}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(value) =>
              formatMonthLabel(String(value), { month: 'short', year: '2-digit' })
            }
          />
          <YAxis
            allowDecimals={false}
            width={32}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <ChartTooltip cursor={false} content={tooltipContent} />
          <Bar dataKey="applications" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
