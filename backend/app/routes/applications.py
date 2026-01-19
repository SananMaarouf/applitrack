from __future__ import annotations

from dataclasses import dataclass

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, desc, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_user_id
from app.models import Application, ApplicationStatusHistory
from app.schemas import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate

router = APIRouter(prefix="/applications", tags=["applications"])


@dataclass(frozen=True)
class TransitionResult:
    is_valid: bool
    transition_type: str | None
    message: str


def validate_status_transition(current_status: int, new_status: int) -> TransitionResult:
    if new_status < 1 or new_status > 7:
        return TransitionResult(False, None, "Invalid status value")

    if current_status == new_status:
        return TransitionResult(False, None, "Status is already set to this value")

    if new_status == 1:
        return TransitionResult(True, "reset", "Application status reset to Applied (history cleared)")

    terminal_statuses = {5, 6, 7}
    is_current_terminal = current_status in terminal_statuses
    is_new_terminal = new_status in terminal_statuses

    if is_current_terminal and is_new_terminal:
        return TransitionResult(True, "terminal_switch", "Terminal status updated (corrected in history)")

    if is_current_terminal and not is_new_terminal:
        status_names = {5: "Offer", 6: "Rejected", 7: "Ghosted"}
        return TransitionResult(
            False,
            None,
            f"Cannot change from terminal status \"{status_names[current_status]}\" to a non-terminal status. Reset to \"Applied\" first if needed.",
        )

    if 1 <= current_status <= 4:
        diff = new_status - current_status
        if diff > 0:
            if is_new_terminal:
                return TransitionResult(True, "forward", "Status updated successfully")
            if diff == 1:
                return TransitionResult(True, "forward", "Status updated successfully")
            status_names = {1: "Applied", 2: "Interview", 3: "Second Interview", 4: "Third Interview"}
            return TransitionResult(
                False,
                None,
                f"Cannot skip steps. Progress sequentially: \"{status_names[current_status]}\" → \"{status_names[current_status + 1]}\"",
            )

        if diff < 0:
            return TransitionResult(True, "correction", "Status corrected (previous history entry removed)")

    return TransitionResult(False, None, "Invalid status transition")


@router.get("", response_model=list[ApplicationOut])
async def list_applications(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> list[ApplicationOut]:
    rows = (
        await db.execute(
            select(Application).where(Application.user_id == user_id).order_by(desc(Application.created_at))
        )
    ).scalars().all()

    return [
        ApplicationOut(
            id=r.id,
            created_at=r.created_at,
            user_id=r.user_id,
            applied_at=r.applied_at,
            expires_at=r.expires_at,
            position=r.position,
            company=r.company,
            status=r.status,
            link=r.link,
        )
        for r in rows
    ]


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> ApplicationOut:
    row = Application(
        user_id=user_id,
        position=payload.position,
        company=payload.company,
        status=1,
        link=payload.link,
        applied_at=payload.applied_at,
        expires_at=payload.expires_at,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)

    return ApplicationOut(
        id=row.id,
        created_at=row.created_at,
        user_id=row.user_id,
        applied_at=row.applied_at,
        expires_at=row.expires_at,
        position=row.position,
        company=row.company,
        status=row.status,
        link=row.link,
    )


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> dict[str, str]:
    result = await db.execute(
        select(Application).where(Application.id == application_id, Application.user_id == user_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    validation = validate_status_transition(app.status, payload.new_status)
    if not validation.is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=validation.message)

    # The DB trigger inserts history rows for normal forward transitions.
    # To match your Next.js logic, we adjust history for reset/terminal_switch/correction.
    if validation.transition_type == "reset":
        await db.execute(
            update(Application)
            .where(Application.id == application_id, Application.user_id == user_id)
            .values(status=payload.new_status)
        )
        # Trigger may have inserted a new row; clear everything.
        await db.execute(
            delete(ApplicationStatusHistory).where(
                ApplicationStatusHistory.application_id == application_id,
                ApplicationStatusHistory.user_id == user_id,
            )
        )
        await db.commit()
        return {"message": validation.message}

    if validation.transition_type == "terminal_switch":
        # Update application (trigger creates a row), then rewrite the latest history row to avoid duplicates.
        await db.execute(
            update(Application)
            .where(Application.id == application_id, Application.user_id == user_id)
            .values(status=payload.new_status)
        )
        await db.flush()

        history = (
            await db.execute(
                select(ApplicationStatusHistory)
                .where(
                    ApplicationStatusHistory.application_id == application_id,
                    ApplicationStatusHistory.user_id == user_id,
                )
                .order_by(desc(ApplicationStatusHistory.created_at), desc(ApplicationStatusHistory.id))
            )
        ).scalars().all()

        # If there are at least 2 rows, we want to merge the newly-created one into the previous.
        if len(history) >= 2:
            newest = history[0]
            previous = history[1]
            await db.execute(
                update(ApplicationStatusHistory)
                .where(ApplicationStatusHistory.id == previous.id)
                .values(to_status=payload.new_status)
            )
            await db.execute(delete(ApplicationStatusHistory).where(ApplicationStatusHistory.id == newest.id))

        await db.commit()
        return {"message": validation.message}

    if validation.transition_type == "correction":
        # Delete the latest history row then update status.
        latest = (
            await db.execute(
                select(ApplicationStatusHistory)
                .where(
                    ApplicationStatusHistory.application_id == application_id,
                    ApplicationStatusHistory.user_id == user_id,
                )
                .order_by(desc(ApplicationStatusHistory.created_at), desc(ApplicationStatusHistory.id))
                .limit(1)
            )
        ).scalars().first()

        if latest:
            await db.execute(delete(ApplicationStatusHistory).where(ApplicationStatusHistory.id == latest.id))

        await db.execute(
            update(Application)
            .where(Application.id == application_id, Application.user_id == user_id)
            .values(status=payload.new_status)
        )
        await db.commit()
        return {"message": validation.message}

    # forward
    await db.execute(
        update(Application)
        .where(Application.id == application_id, Application.user_id == user_id)
        .values(status=payload.new_status)
    )
    await db.commit()
    return {"message": validation.message}


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
async def delete_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Response:
    await db.execute(
        delete(Application).where(Application.id == application_id, Application.user_id == user_id)
    )
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
