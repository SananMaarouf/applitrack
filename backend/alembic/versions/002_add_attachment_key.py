"""Add attachment_key column to applications

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, Sequence[str], None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS attachment_key TEXT")


def downgrade() -> None:
    op.drop_column("applications", "attachment_key")
