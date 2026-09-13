"""Initial SQLite setup: applications, status history, trigger, view

Squashes the previous PostgreSQL-era revisions 001 (initial setup) and 002
(attachment_key) into a single dialect-neutral revision. The plpgsql function
that backed the Postgres trigger is gone; SQLite triggers embed their body
directly.

Revision ID: 001
Revises:
Create Date: 2026-09-13 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Records every status change on an application. Replaces the Postgres
# track_application_status_change() plpgsql function + trigger pair.
#   - "AFTER UPDATE OF status" replaces the TG_OP = 'UPDATE' guard
#   - "IS NOT" is SQLite's null-safe equivalent of "IS DISTINCT FROM"
_CREATE_TRIGGER = """
CREATE TRIGGER track_status_change
AFTER UPDATE OF status ON applications
FOR EACH ROW
WHEN OLD.status IS NOT NEW.status
BEGIN
    INSERT INTO application_status_history (application_id, user_id, from_status, to_status)
    VALUES (NEW.id, NEW.user_id, OLD.status, NEW.status);
END
"""

# Aggregated transitions per user, consumed by GET /status-flow (the Sankey
# diagram). The quoted aliases are preserved verbatim by SQLite, so the
# StatusFlowRow schema keeps its From/To/Weight fields.
_CREATE_VIEW = """
CREATE VIEW application_status_flow AS
SELECT
    h.user_id,
    CASE h.from_status
        WHEN 1 THEN 'Applied'
        WHEN 2 THEN 'Interview'
        WHEN 3 THEN 'Second Interview'
        WHEN 4 THEN 'Third Interview'
        WHEN 5 THEN 'Offer'
        WHEN 6 THEN 'Rejected'
        WHEN 7 THEN 'Ghosted'
    END AS "From",
    CASE h.to_status
        WHEN 1 THEN 'Applied'
        WHEN 2 THEN 'Interview'
        WHEN 3 THEN 'Second Interview'
        WHEN 4 THEN 'Third Interview'
        WHEN 5 THEN 'Offer'
        WHEN 6 THEN 'Rejected'
        WHEN 7 THEN 'Ghosted'
    END AS "To",
    COUNT(*) AS "Weight"
FROM application_status_history h
GROUP BY h.user_id, h.from_status, h.to_status
ORDER BY h.user_id, h.from_status, h.to_status
"""


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=False),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("applied_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("position", sa.Text(), nullable=False),
        sa.Column("company", sa.Text(), nullable=False),
        sa.Column("status", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("link", sa.Text(), nullable=True),
        sa.Column("attachment_key", sa.Text(), nullable=True),
    )
    op.create_index("applications_user_id_idx", "applications", ["user_id"])
    op.create_index("applications_created_at_idx", "applications", ["created_at"])

    op.create_table(
        "application_status_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=False),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("from_status", sa.Integer(), nullable=False),
        sa.Column("to_status", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name="application_status_history_application_id_fkey",
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        "status_history_application_id_idx", "application_status_history", ["application_id"]
    )
    op.create_index("status_history_user_id_idx", "application_status_history", ["user_id"])

    op.execute(_CREATE_TRIGGER)
    op.execute(_CREATE_VIEW)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS application_status_flow")
    op.execute("DROP TRIGGER IF EXISTS track_status_change")
    op.drop_index("status_history_user_id_idx", table_name="application_status_history")
    op.drop_index("status_history_application_id_idx", table_name="application_status_history")
    op.drop_table("application_status_history")
    op.drop_index("applications_created_at_idx", table_name="applications")
    op.drop_index("applications_user_id_idx", table_name="applications")
    op.drop_table("applications")
