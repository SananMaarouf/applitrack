import {
  AlertTriangle,
  BriefcaseBusiness,
  Minus,
  RefreshCw,
  SendHorizonal,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  error?: string | null
  onPeriodChange?: (period: TrendPeriod) => void
  onRetry?: () => void
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function periodLabel(period: TrendPeriod): string {
  return period === 'week' ? 'last 7 days' : 'last 30 days'
}

function periodControlLabel(period: TrendPeriod): string {
  return period === 'week' ? 'Week' : 'Month'
}

function emptyPeriodLabel(period: TrendPeriod): string {
  return period === 'week' ? 'last 7 days' : 'last 30 days'
}

function DirectionBadge({
  metric,
  period,
}: {
  metric: TrendMetric
  period: TrendPeriod
}) {
  const { direction, percentChange } = metric
  const hasPercent = percentChange !== null
  const isNewActivity = direction === 'up' && !hasPercent
  const visibleLabel = isNewActivity
    ? 'New activity'
    : hasPercent
      ? `${Math.abs(percentChange)}%`
      : 'No change'
  const context = isNewActivity
    ? `New activity compared with the ${periodLabel(period)} before, up from zero`
    : hasPercent
      ? `${Math.abs(percentChange)} percent ${
          direction === 'up' ? 'higher' : direction === 'down' ? 'lower' : 'change'
        } than the ${periodLabel(period)} before`
      : `No change compared with the ${periodLabel(period)} before`

  if (direction === 'up') {
    return (
      <span
        role="img"
        aria-label={context}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
      >
        <TrendingUp className="size-3" aria-hidden="true" />
        {visibleLabel}
      </span>
    )
  }

  if (direction === 'down') {
    return (
      <span
        role="img"
        aria-label={context}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
      >
        <TrendingDown className="size-3" aria-hidden="true" />
        {visibleLabel}
      </span>
    )
  }

  return (
    <span
      role="img"
      aria-label={context}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
    >
      <Minus className="size-3" aria-hidden="true" />
      {visibleLabel}
    </span>
  )
}

function MetricCard({
  description,
  icon: Icon,
  metric,
  period,
}: {
  description: string
  icon: React.ElementType
  metric: TrendMetric
  period: TrendPeriod
}) {
  return (
    <Card className="min-w-0 gap-3 bg-card py-4">
      <CardHeader className="gap-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate">{description}</span>
          </CardDescription>
          <DirectionBadge metric={metric} period={period} />
        </div>
        <CardTitle className="text-3xl font-bold tabular-nums text-card-foreground">
          {metric.current.toLocaleString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-xs text-muted-foreground">
          {metric.previous.toLocaleString()} in the {periodLabel(period)}
          {metric.difference !== 0 && (
            <span className="text-foreground">
              {' '}
              ({metric.difference > 0 ? '+' : ''}
              {metric.difference})
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card
      data-testid="trend-skeleton"
      aria-hidden="true"
      className="min-w-0 gap-3 bg-card py-4"
    >
      <CardHeader className="gap-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="h-8 w-28 rounded-lg bg-muted motion-safe:animate-pulse" />
          <div className="h-5 w-14 rounded-full bg-muted motion-safe:animate-pulse" />
        </div>
        <div className="h-9 w-20 rounded bg-muted motion-safe:animate-pulse" />
      </CardHeader>
      <CardContent className="px-4">
        <div className="h-3 w-40 rounded bg-muted motion-safe:animate-pulse" />
      </CardContent>
    </Card>
  )
}

function UnavailableState({
  message,
  onRetry,
}: {
  message?: string | null
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Trends unavailable</p>
          <p className="text-xs text-muted-foreground">
            {message ?? "We couldn't load the metrics for this period."}
          </p>
        </div>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TrendCards({
  trends,
  period,
  isLoading,
  error,
  onPeriodChange,
  onRetry,
}: TrendCardsProps) {
  // Never let a response for a different period stand in for the selected one.
  const hasTrendsForPeriod = trends !== null && trends.period === period
  const windowLabel = period === 'week' ? 'this week' : 'this month'
  const showEmptyPeriod =
    hasTrendsForPeriod &&
    trends.applications_sent.current === 0 &&
    trends.interviews.current === 0

  return (
    <div
      aria-busy={isLoading ? true : undefined}
      className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm @container"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-card-foreground">
            Performance {windowLabel}
          </h3>
          <p className="text-xs text-muted-foreground">
            Compared with the previous {periodLabel(period)}
          </p>
        </div>
        {onPeriodChange ? (
          <Select value={period} onValueChange={(value) => onPeriodChange(value as TrendPeriod)}>
            <SelectTrigger
              id="trend-period"
              aria-label="Trend comparison period"
              size="sm"
              className="w-fit min-w-0 border border-border bg-background text-sm text-foreground"
            >
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
              <SelectValue className="hidden" />
              <span className="sr-only">Trend period</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground">
            <SlidersHorizontal
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            {periodControlLabel(period)}
            <span className="sr-only">(read-only)</span>
          </span>
        )}
      </div>

      {isLoading ? (
        <div
          data-testid="trend-skeleton-grid"
          data-color-palette="light"
          className="grid grid-cols-1 gap-3 @md:grid-cols-2"
        >
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error || !hasTrendsForPeriod ? (
        <UnavailableState
          message={
            error ??
            `We couldn't load the metrics for the ${periodLabel(period)}.`
          }
          onRetry={onRetry}
        />
      ) : (
        <>
          <div
            data-testid="trend-metric-grid"
            data-color-palette="light"
            className="grid grid-cols-1 gap-3 @md:grid-cols-2"
          >
            <MetricCard
              description="Applications sent"
              icon={SendHorizonal}
              metric={trends.applications_sent}
              period={period}
            />
            <MetricCard
              description="Interviews"
              icon={BriefcaseBusiness}
              metric={trends.interviews}
              period={period}
            />
          </div>
          {showEmptyPeriod && (
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              No applications sent in the {emptyPeriodLabel(period)}. New applications
              will appear here as you track them.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export type { TrendCardsProps }
