from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_user_id
from app.schemas import StatusFlowRow

router = APIRouter(prefix="/status-flow", tags=["status-flow"])


@router.get("", response_model=list[StatusFlowRow])
async def get_status_flow(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> list[StatusFlowRow]:
    # application_status_flow is a view created by your init SQL.
    result = await db.execute(text("SELECT * FROM application_status_flow WHERE user_id = :user_id"), {"user_id": user_id})
    rows = result.mappings().all()
    return [StatusFlowRow(**dict(r)) for r in rows]
