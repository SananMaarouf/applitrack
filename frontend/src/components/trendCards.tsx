import { TrendingDown, TrendingUp, Minus, SendHorizonal, BriefcaseBusiness, SlidersHorizontal  } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DashboardTrends, TrendMetric, TrendPeriod } from '@/types/jobApplication'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrendCardsProps = {
  trends: DashboardTrends | null
  period: TrendPeriod
  isLoading: boolean
  onPeriodChange: (period: TrendPeriod) => void
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DirectionBadge({ metric }: { metric: TrendMetric }) {
  const { direction, percentChange } = metric

  const label = percentChange !== null ? `${Math.abs(percentChange)}%` : null

  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <TrendingUp className="size-3" />
        {label}
      </span>
    )
  }

  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
        <TrendingDown className="size-3" />
        {label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="size-3" />
      No change
    </span>
  )
}

function PeriodLabel({ period }: { period: TrendPeriod }) {
  return period === 'week' ? 'last 7 days' : 'last 30 days'
}

function MetricCard({
  description,
  icon: Icon,
  metric,
  period,
}: {
  title: string
  description: string
  icon: React.ElementType
  metric: TrendMetric
  period: TrendPeriod
}) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {description}
        </CardDescription>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-3xl text-card-foreground font-bold tabular-nums">
            {metric.current.toLocaleString()}
          </CardTitle>
          <DirectionBadge metric={metric} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {metric.previous.toLocaleString()} in the <PeriodLabel period={period} />
          {metric.difference !== 0 && (
            <span className={metric.difference > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {' '}({metric.difference > 0 ? '+' : ''}{metric.difference})
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="bg-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-9 w-20 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TrendCards({ trends, period, isLoading, onPeriodChange }: TrendCardsProps) {
  const periodLabel = period === 'week' ? 'This week' : 'This month'

  return (
    <div className="flex flex-col gap-3 h-full bg-card border rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className='text-card-foreground'>
          <h2 className="text-sm font-semibold">{periodLabel}</h2>
          <p className="text-xs">Rolling window comparison</p>
        </div>
        <Select value={period} onValueChange={(v) => onPeriodChange(v as TrendPeriod)}>
          <SelectTrigger size="sm" className="w-fit min-w-0 text-sm  bg-primary text-primary-foreground border-none shadow-none">
            <SlidersHorizontal className="size-4 text-primary-foreground" />
            <SelectValue className="hidden" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 gap-3">
        {isLoading || !trends ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              title="Applications sent"
              description="Applications"
              icon={SendHorizonal}
              metric={trends.applications_sent}
              period={trends.period}
            />
            <MetricCard
              title="Interviews"
              description="Interviews"
              icon={BriefcaseBusiness}
              metric={trends.interviews}
              period={trends.period}
            />
          </>
        )}
      </div>
    </div>
  )
}
