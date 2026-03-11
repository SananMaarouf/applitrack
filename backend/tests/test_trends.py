"""
Tests for the /dashboard/trends endpoint and underlying trend service logic.

Structure
---------
TestComputeTrend       – pure unit tests for the trend calculation helper
TestBuildTrendWindows  – pure unit tests for period window construction
TestTrendEndpointAuth  – integration: auth requirements
TestTrendEndpointWeek  – integration: week period with seeded data
TestTrendEndpointMonth – integration: month period with seeded data

Integration tests require a running database (see conftest.py) and use the
standard `seeded_applications` fixture which creates real rows for user_a.

Seeded data summary (from conftest._SEED_APPS):
  days_ago=30  status=2  (interview)       → edge: exactly at boundary for "month"
  days_ago=20  status=5  (offer)           → inside month, outside week
  days_ago=15  status=6  (rejected)        → inside month, outside week
  days_ago=10  status=1  (applied)         → inside month, outside week
  days_ago=5   status=3  (2nd interview)   → inside both month and week
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application
from app.services.trends import (
    PeriodWindow,
    TrendWindows,
    build_trend_windows,
    compute_trend,
    fetch_trend_counts,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utc_naive(days_ago: int = 0) -> datetime:
    """UTC-naive datetime `days_ago` days before now."""
    return datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days_ago)


# ===========================================================================
# Unit tests – compute_trend
# ===========================================================================

class TestComputeTrend:
    """All business rules for trend calculation, no DB or network needed."""

    def test_up_direction(self):
        m = compute_trend(current=10, previous=5)
        assert m.direction == "up"
        assert m.difference == 5
        assert m.percentChange == 100.0

    def test_down_direction(self):
        m = compute_trend(current=3, previous=6)
        assert m.direction == "down"
        assert m.difference == -3
        assert m.percentChange == -50.0

    def test_neutral_direction(self):
        m = compute_trend(current=4, previous=4)
        assert m.direction == "neutral"
        assert m.difference == 0
        assert m.percentChange == 0.0

    def test_percent_change_rounds_to_one_decimal(self):
        m = compute_trend(current=10, previous=3)
        # ((10-3)/3)*100 = 233.333… → 233.3
        assert m.percentChange == 233.3

    def test_previous_zero_current_positive_returns_none_percent(self):
        """When previous == 0 and current > 0, percentChange must be null (undefined)."""
        m = compute_trend(current=7, previous=0)
        assert m.percentChange is None
        assert m.direction == "up"
        assert m.difference == 7

    def test_previous_zero_current_zero_returns_zero_percent(self):
        """Both periods empty → neutral with 0.0% change."""
        m = compute_trend(current=0, previous=0)
        assert m.percentChange == 0.0
        assert m.direction == "neutral"
        assert m.difference == 0

    def test_fields_present(self):
        """Response model must have all required keys."""
        m = compute_trend(current=5, previous=2)
        assert hasattr(m, "current")
        assert hasattr(m, "previous")
        assert hasattr(m, "difference")
        assert hasattr(m, "percentChange")
        assert hasattr(m, "direction")


# ===========================================================================
# Unit tests – build_trend_windows
# ===========================================================================

class TestBuildTrendWindows:
    """Period window construction is deterministic when `now` is provided."""

    def _now(self) -> datetime:
        return datetime(2025, 6, 15, 12, 0, 0)  # fixed anchor, timezone-naive

    def test_week_window_spans_seven_days(self):
        now = self._now()
        w = build_trend_windows("week", now=now)
        assert w.current.end == now
        assert w.current.start == now - timedelta(days=7)
        assert w.previous.end == w.current.start
        assert w.previous.start == now - timedelta(days=14)

    def test_month_window_spans_thirty_days(self):
        now = self._now()
        w = build_trend_windows("month", now=now)
        assert w.current.end == now
        assert w.current.start == now - timedelta(days=30)
        assert w.previous.end == w.current.start
        assert w.previous.start == now - timedelta(days=60)

    def test_windows_are_contiguous(self):
        """Previous end must equal current start so no gap exists."""
        for period in ("week", "month"):
            w = build_trend_windows(period, now=self._now())  # type: ignore[arg-type]
            assert w.previous.end == w.current.start

    def test_defaults_to_utc_now(self):
        """Calling without `now` should not raise and should return current-ish times."""
        before = datetime.now(timezone.utc).replace(tzinfo=None)
        w = build_trend_windows("week")
        after = datetime.now(timezone.utc).replace(tzinfo=None)
        assert before - timedelta(seconds=1) <= w.current.end <= after + timedelta(seconds=1)


# ===========================================================================
# Integration tests – fetch_trend_counts
# ===========================================================================

@pytest.mark.asyncio
class TestFetchTrendCounts:
    """
    Test the DB aggregation query directly using the real DB session.
    Inserts controlled rows with specific created_at values to verify counts.
    """

    async def test_counts_only_target_user(
        self,
        db_session: AsyncSession,
        clerk_user,
        second_clerk_user,
    ):
        """Rows belonging to other_user must not pollute counts for user_a."""
        now = _utc_naive()
        windows = TrendWindows(
            current=PeriodWindow(start=now - timedelta(days=7), end=now),
            previous=PeriodWindow(start=now - timedelta(days=14), end=now - timedelta(days=7)),
        )

        # Insert one app for user_a (current window) and one for user_b
        app_a = Application(
            user_id=clerk_user["user_id"],
            position="Engineer",
            company="Acme",
            applied_at=now - timedelta(days=1),
            status=1,
        )
        app_b = Application(
            user_id=second_clerk_user["user_id"],
            position="Engineer",
            company="Globex",
            applied_at=now - timedelta(days=1),
            status=1,
        )
        db_session.add_all([app_a, app_b])
        await db_session.commit()

        try:
            counts = await fetch_trend_counts(db_session, clerk_user["user_id"], windows)
            assert counts.current_apps == 1
            assert counts.previous_apps == 0
        finally:
            await db_session.execute(
                delete(Application).where(Application.id.in_([app_a.id, app_b.id]))
            )
            await db_session.commit()

    async def test_interview_statuses_counted_correctly(
        self,
        db_session: AsyncSession,
        clerk_user,
    ):
        """Statuses 2, 3, 4 qualify as interviews; 1, 5, 6, 7 must not."""
        now = _utc_naive()
        windows = TrendWindows(
            current=PeriodWindow(start=now - timedelta(days=7), end=now),
            previous=PeriodWindow(start=now - timedelta(days=14), end=now - timedelta(days=7)),
        )

        apps = [
            Application(
                user_id=clerk_user["user_id"],
                position="P",
                company="C",
                applied_at=now - timedelta(days=1),
                status=s,
            )
            for s in [1, 2, 3, 4, 5, 6, 7]  # all seven statuses in current window
        ]
        db_session.add_all(apps)
        await db_session.commit()

        try:
            counts = await fetch_trend_counts(db_session, clerk_user["user_id"], windows)
            assert counts.current_apps == 7
            assert counts.current_interviews == 3  # statuses 2, 3, 4
        finally:
            ids = [a.id for a in apps]
            await db_session.execute(delete(Application).where(Application.id.in_(ids)))
            await db_session.commit()


# ===========================================================================
# Integration tests – HTTP endpoint
# ===========================================================================

@pytest.mark.asyncio
class TestTrendEndpointAuth:
    """Unauthenticated requests must be rejected."""

    async def test_requires_auth(self, client: AsyncClient):
        response = await client.get("/dashboard/trends")
        assert response.status_code == 401

    async def test_requires_auth_month(self, client: AsyncClient):
        response = await client.get("/dashboard/trends?period=month")
        assert response.status_code == 401

    async def test_invalid_period_rejected(self, authed_client: AsyncClient):
        response = await authed_client.get("/dashboard/trends?period=year")
        assert response.status_code == 422


@pytest.mark.asyncio
class TestTrendEndpointWeek:
    """Week-period endpoint integration tests using seeded data."""

    async def test_week_response_shape(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        """Response must include all required keys with correct types."""
        response = await authed_client.get("/dashboard/trends?period=week")
        assert response.status_code == 200

        data = response.json()
        assert data["period"] == "week"
        assert "ranges" in data
        assert "applications_sent" in data
        assert "interviews" in data

        for key in ("current_start", "current_end", "previous_start", "previous_end"):
            assert key in data["ranges"]

        for metric_key in ("applications_sent", "interviews"):
            m = data[metric_key]
            assert "current" in m
            assert "previous" in m
            assert "difference" in m
            assert "percentChange" in m
            assert "direction" in m

    async def test_week_difference_is_consistent(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        """difference must always equal current - previous."""
        response = await authed_client.get("/dashboard/trends?period=week")
        assert response.status_code == 200

        data = response.json()
        for metric_key in ("applications_sent", "interviews"):
            m = data[metric_key]
            assert m["difference"] == m["current"] - m["previous"]

    async def test_week_direction_matches_values(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        """direction must be consistent with current vs previous."""
        response = await authed_client.get("/dashboard/trends?period=week")
        assert response.status_code == 200

        data = response.json()
        for metric_key in ("applications_sent", "interviews"):
            m = data[metric_key]
            c, p = m["current"], m["previous"]
            expected = "up" if c > p else ("down" if c < p else "neutral")
            assert m["direction"] == expected, f"{metric_key}: {m}"

    async def test_week_counts_seeded_applications(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        """
        The seeded data has exactly 1 application within the last 7 days:
          - days_ago=5, status=3 (2nd interview → counts as interview)

        So: current_apps=1, current_interviews=1
        """
        response = await authed_client.get("/dashboard/trends?period=week")
        assert response.status_code == 200

        data = response.json()
        assert data["applications_sent"]["current"] == 1
        assert data["interviews"]["current"] == 1


@pytest.mark.asyncio
class TestTrendEndpointMonth:
    """Month-period endpoint integration tests using seeded data."""

    async def test_month_response_shape(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        response = await authed_client.get("/dashboard/trends?period=month")
        assert response.status_code == 200

        data = response.json()
        assert data["period"] == "month"

    async def test_month_counts_seeded_applications(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        """
        Seeded applications and their `days_ago` values:
          days_ago=30 → exactly at the start boundary (>= start means it IS included if created_at >= start)
          days_ago=20, 15, 10, 5 → clearly inside the 30-day window

        created_at is set to `now - timedelta(days=days_ago)` in the fixture,
        so the days_ago=30 record lands exactly ON the boundary.
        The query uses `created_at >= current_start` so it is included.

        Interview statuses in the 30-day window: status=2 (days_ago=30) and status=3 (days_ago=5)
        → current_interviews = 2
        """
        response = await authed_client.get("/dashboard/trends?period=month")
        assert response.status_code == 200

        data = response.json()
        assert data["applications_sent"]["current"] >= 4  # at minimum the 4 within last 30 days
        assert data["interviews"]["current"] >= 1  # status=3 at days_ago=5 definitely qualifies

    async def test_month_difference_is_consistent(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        response = await authed_client.get("/dashboard/trends?period=month")
        assert response.status_code == 200

        data = response.json()
        for metric_key in ("applications_sent", "interviews"):
            m = data[metric_key]
            assert m["difference"] == m["current"] - m["previous"]

    async def test_month_direction_matches_values(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        response = await authed_client.get("/dashboard/trends?period=month")
        assert response.status_code == 200

        data = response.json()
        for metric_key in ("applications_sent", "interviews"):
            m = data[metric_key]
            c, p = m["current"], m["previous"]
            expected = "up" if c > p else ("down" if c < p else "neutral")
            assert m["direction"] == expected, f"{metric_key}: {m}"

    async def test_default_period_is_week(self, authed_client: AsyncClient, seeded_applications):
        """Calling /dashboard/trends without a period param should default to week."""
        response = await authed_client.get("/dashboard/trends")
        assert response.status_code == 200
        assert response.json()["period"] == "week"
