from __future__ import annotations

from datetime import datetime

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


class ApplicationStatusUpdate(BaseModel):
    new_status: int = Field(ge=1, le=7)


class StatusFlowRow(BaseModel):
    user_id: str
    From: str
    To: str
    Weight: int
