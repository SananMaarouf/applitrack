from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_user_id
from app.schemas import DashboardTrendsResponse, TrendPeriod
from app.services.trends import get_dashboard_trends

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/trends", response_model=DashboardTrendsResponse)
async def get_trends(
    period: TrendPeriod = Query(
        default="week",
        description="Comparison window: 'week' (7 days) or 'month' (30 days).",
    ),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> DashboardTrendsResponse:
    """
    Return trend analytics for the authenticated user comparing the current
    period to the immediately preceding equivalent period.

    - **week**: current = last 7 days vs. prior 7 days
    - **month**: current = last 30 days vs. prior 30 days
    """
    return await get_dashboard_trends(db, user_id, period)
