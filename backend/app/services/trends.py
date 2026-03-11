"""
Trend analytics service for the AppliTrack dashboard.

Business rules
--------------
- "week"  period: current = last 7 days,  previous = 7 days before that
- "month" period: current = last 30 days, previous = 30 days before that
- All datetimes are UTC, stored as timezone-naive (matching the DB schema).

Interview statuses
------------------
- 2 = interview
- 3 = 2nd_interview
- 4 = 3rd_interview

NOTE (future improvement): Trend analytics on *interviews* is currently based on
applications whose current status is in the interview group and whose `created_at`
falls within the measurement window. A more accurate approach would use the
`application_status_history` table to record *when* a given status was first
reached, so we can answer "how many applications entered interview stage this week"
regardless of when they were originally submitted.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import Integer, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application
from app.schemas import DashboardTrendsResponse, TrendDirection, TrendMetric, TrendPeriod, TrendRanges

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Status integers that count as an "interview-stage" application.
_INTERVIEW_STATUSES: frozenset[int] = frozenset({2, 3, 4})

_PERIOD_DAYS: dict[TrendPeriod, int] = {
    "week": 7,
    "month": 30,
}


# ---------------------------------------------------------------------------
# Period helpers
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PeriodWindow:
    """Inclusive-start / exclusive-end datetime window (UTC naive)."""

    start: datetime
    end: datetime


@dataclass(frozen=True)
class TrendWindows:
    current: PeriodWindow
    previous: PeriodWindow


def _utc_now() -> datetime:
    """Return the current UTC time as a timezone-naive datetime."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def build_trend_windows(period: TrendPeriod, now: datetime | None = None) -> TrendWindows:
    """
    Return the current and previous PeriodWindows for the requested period.

    Args:
        period: "week" or "month"
        now:    Anchor point (UTC naive). Defaults to the current UTC time.
                Injected explicitly in tests for determinism.
    """
    if now is None:
        now = _utc_now()

    days = _PERIOD_DAYS[period]
    delta = timedelta(days=days)

    current = PeriodWindow(start=now - delta, end=now)
    previous = PeriodWindow(start=now - 2 * delta, end=now - delta)
    return TrendWindows(current=current, previous=previous)


# ---------------------------------------------------------------------------
# Trend calculation
# ---------------------------------------------------------------------------

def compute_trend(current: int, previous: int) -> TrendMetric:
    """
    Calculate trend metadata comparing current to previous count.

    Rules
    -----
    - difference    = current - previous
    - percentChange = round(((current - previous) / previous) * 100, 1)
                       when previous > 0
    - percentChange = None  when previous == 0 and current > 0
    - percentChange = 0.0   when previous == 0 and current == 0
    - direction     = "up" | "down" | "neutral"
    """
    difference = current - previous

    if current > previous:
        direction: TrendDirection = "up"
    elif current < previous:
        direction = "down"
    else:
        direction = "neutral"

    if previous > 0:
        percent_change: float | None = round(((current - previous) / previous) * 100, 1)
    elif current > 0:
        # Growth from zero is technically infinite; return null to let the UI
        # decide how to present this (e.g. "New activity this period!").
        percent_change = None
    else:
        percent_change = 0.0

    return TrendMetric(
        current=current,
        previous=previous,
        difference=difference,
        percentChange=percent_change,
        direction=direction,
    )


# ---------------------------------------------------------------------------
# Database query
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RawCounts:
    current_apps: int
    previous_apps: int
    current_interviews: int
    previous_interviews: int


async def fetch_trend_counts(
    db: AsyncSession,
    user_id: str,
    windows: TrendWindows,
) -> RawCounts:
    """
    Run a single aggregate query that computes all four counts in one round trip.

    Uses conditional aggregation (CASE WHEN … END) so the DB does all the work.
    The outer WHERE clause restricts the full table scan to only the relevant
    date range (previous_start → current_end), making index usage efficient.
    """
    is_interview = Application.status.in_(_INTERVIEW_STATUSES)

    # Conditional aggregation for each window × metric combination.
    stmt = (
        select(
            # --- applications_sent ---
            func.count(
                case((
                    (Application.applied_at >= windows.current.start) &
                    (Application.applied_at < windows.current.end),
                    Application.id,
                ))
            ).cast(Integer).label("current_apps"),

            func.count(
                case((
                    (Application.applied_at >= windows.previous.start) &
                    (Application.applied_at < windows.previous.end),
                    Application.id,
                ))
            ).cast(Integer).label("previous_apps"),

            # --- interviews ---
            func.count(
                case((
                    (Application.applied_at >= windows.current.start) &
                    (Application.applied_at < windows.current.end) &
                    is_interview,
                    Application.id,
                ))
            ).cast(Integer).label("current_interviews"),

            func.count(
                case((
                    (Application.applied_at >= windows.previous.start) &
                    (Application.applied_at < windows.previous.end) &
                    is_interview,
                    Application.id,
                ))
            ).cast(Integer).label("previous_interviews"),
        )
        .where(
            Application.user_id == user_id,
            Application.applied_at >= windows.previous.start,
            Application.applied_at < windows.current.end,
        )
    )

    result = await db.execute(stmt)
    row = result.one()
    return RawCounts(
        current_apps=row.current_apps or 0,
        previous_apps=row.previous_apps or 0,
        current_interviews=row.current_interviews or 0,
        previous_interviews=row.previous_interviews or 0,
    )


# ---------------------------------------------------------------------------
# Public service entry point
# ---------------------------------------------------------------------------

async def get_dashboard_trends(
    db: AsyncSession,
    user_id: str,
    period: TrendPeriod,
) -> DashboardTrendsResponse:
    """
    Compute and return dashboard trend analytics for the given user and period.

    Designed to be called directly from the route handler. All business logic
    lives here so the route stays thin.
    """
    windows = build_trend_windows(period)
    counts = await fetch_trend_counts(db, user_id, windows)

    return DashboardTrendsResponse(
        period=period,
        ranges=TrendRanges(
            current_start=windows.current.start,
            current_end=windows.current.end,
            previous_start=windows.previous.start,
            previous_end=windows.previous.end,
        ),
        applications_sent=compute_trend(counts.current_apps, counts.previous_apps),
        interviews=compute_trend(counts.current_interviews, counts.previous_interviews),
    )
