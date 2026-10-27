/**
 * Trend analytics for the dashboard, ported from the FastAPI backend's trends
 * service (backend/app/services/trends.py, preserved on the `self-host` branch).
 *
 *   week  → current = last 7 days,  previous = the 7 days before that
 *   month → current = last 30 days, previous = the 30 days before that
 *
 * Applications are bucketed by applied_at (text ISO-8601 UTC, so comparisons
 * are chronological). Statuses 2, 3 and 4 count as interviews.
 */
export type TrendPeriod = "week" | "month";
export type TrendDirection = "up" | "down" | "neutral";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS: Record<TrendPeriod, number> = { week: 7, month: 30 };
const INTERVIEW_STATUSES_SQL = "(2, 3, 4)";

export type PeriodWindow = { start: Date; end: Date };
export type TrendWindows = { current: PeriodWindow; previous: PeriodWindow };

export function buildTrendWindows(period: TrendPeriod, now: Date = new Date()): TrendWindows {
  const delta = PERIOD_DAYS[period] * DAY_MS;
  const end = now.getTime();

  return {
    current: { start: new Date(end - delta), end: new Date(end) },
    previous: { start: new Date(end - 2 * delta), end: new Date(end - delta) },
  };
}

export type TrendMetric = {
  current: number;
  previous: number;
  difference: number;
  /** null when the previous period was empty but the current one was not. */
  percentChange: number | null;
  direction: TrendDirection;
};

export function computeTrend(current: number, previous: number): TrendMetric {
  const difference = current - previous;

  const direction: TrendDirection = current > previous ? "up" : current < previous ? "down" : "neutral";

  let percentChange: number | null;
  if (previous > 0) {
    // Round to one decimal, matching round(x, 1) in the Python service.
    percentChange = Math.round(((current - previous) / previous) * 1000) / 10;
  } else if (current > 0) {
    // Growth from zero is undefined; let the UI decide what to show.
    percentChange = null;
  } else {
    percentChange = 0;
  }

  return { current, previous, difference, percentChange, direction };
}

export type RawCounts = {
  currentApps: number;
  previousApps: number;
  currentInterviews: number;
  previousInterviews: number;
};

type CountRow = {
  current_apps: number;
  previous_apps: number;
  current_interviews: number;
  previous_interviews: number;
};

/**
 * One aggregate query covers all four counts (conditional aggregation), with
 * the outer WHERE restricting the scan to the two windows combined.
 */
export async function fetchTrendCounts(
  db: D1Database,
  userId: string,
  windows: TrendWindows,
): Promise<RawCounts> {
  const row = await db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN applied_at >= ?1 AND applied_at < ?2 THEN 1 ELSE 0 END), 0) AS current_apps,
         COALESCE(SUM(CASE WHEN applied_at >= ?3 AND applied_at < ?4 THEN 1 ELSE 0 END), 0) AS previous_apps,
         COALESCE(SUM(CASE WHEN applied_at >= ?1 AND applied_at < ?2 AND status IN ${INTERVIEW_STATUSES_SQL} THEN 1 ELSE 0 END), 0) AS current_interviews,
         COALESCE(SUM(CASE WHEN applied_at >= ?3 AND applied_at < ?4 AND status IN ${INTERVIEW_STATUSES_SQL} THEN 1 ELSE 0 END), 0) AS previous_interviews
       FROM applications
       WHERE user_id = ?5 AND applied_at >= ?3 AND applied_at < ?2`,
    )
    .bind(
      windows.current.start.toISOString(),
      windows.current.end.toISOString(),
      windows.previous.start.toISOString(),
      windows.previous.end.toISOString(),
      userId,
    )
    .first<CountRow>();

  return {
    currentApps: row?.current_apps ?? 0,
    previousApps: row?.previous_apps ?? 0,
    currentInterviews: row?.current_interviews ?? 0,
    previousInterviews: row?.previous_interviews ?? 0,
  };
}

export type DashboardTrends = {
  period: TrendPeriod;
  ranges: {
    current_start: string;
    current_end: string;
    previous_start: string;
    previous_end: string;
  };
  applications_sent: TrendMetric;
  interviews: TrendMetric;
};

export async function getDashboardTrends(
  db: D1Database,
  userId: string,
  period: TrendPeriod,
  now: Date = new Date(),
): Promise<DashboardTrends> {
  const windows = buildTrendWindows(period, now);
  const counts = await fetchTrendCounts(db, userId, windows);

  return {
    period,
    ranges: {
      current_start: windows.current.start.toISOString(),
      current_end: windows.current.end.toISOString(),
      previous_start: windows.previous.start.toISOString(),
      previous_end: windows.previous.end.toISOString(),
    },
    applications_sent: computeTrend(counts.currentApps, counts.previousApps),
    interviews: computeTrend(counts.currentInterviews, counts.previousInterviews),
  };
}

