from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ApplicationBase(BaseModel):
    position: str
    company: str
    applied_at: datetime
    expires_at: datetime | None = None
    link: str | None = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationOut(ApplicationBase):
    id: int
    created_at: datetime
    user_id: str
    status: int
    attachment_key: str | None = None


class ApplicationStatusUpdate(BaseModel):
    new_status: int = Field(ge=1, le=7)


class StatusFlowRow(BaseModel):
    user_id: str
    From: str
    To: str
    Weight: int


# ---------------------------------------------------------------------------
# Dashboard trend analytics
# ---------------------------------------------------------------------------

TrendDirection = Literal["up", "down", "neutral"]
TrendPeriod = Literal["week", "month"]


class TrendMetric(BaseModel):
    """A single metric compared across two consecutive periods."""

    current: int
    previous: int
    difference: int
    # Null when previous == 0 and current > 0 (undefined growth from zero)
    percentChange: float | None
    direction: TrendDirection


class TrendRanges(BaseModel):
    """ISO-formatted UTC datetimes that define the current and previous windows."""

    current_start: datetime
    current_end: datetime
    previous_start: datetime
    previous_end: datetime


class DashboardTrendsResponse(BaseModel):
    period: TrendPeriod
    ranges: TrendRanges
    applications_sent: TrendMetric
    interviews: TrendMetric
