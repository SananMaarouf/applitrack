"""Initial setup: applications, status history, trigger, view

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS applications (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP NOT NULL,
            expires_at TIMESTAMP,
            position TEXT NOT NULL,
            company TEXT NOT NULL,
            status INTEGER NOT NULL DEFAULT 1,
            link TEXT
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS applications_user_id_idx ON applications(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS applications_created_at_idx ON applications(created_at)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS application_status_history (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            from_status INTEGER NOT NULL,
            to_status INTEGER NOT NULL
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS status_history_application_id_idx"
        " ON application_status_history(application_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS status_history_user_id_idx"
        " ON application_status_history(user_id)"
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION track_application_status_change()
        RETURNS TRIGGER AS $$
        BEGIN
            IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
                INSERT INTO application_status_history (application_id, user_id, from_status, to_status)
                VALUES (NEW.id, NEW.user_id, OLD.status, NEW.status);
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """
    )

    op.execute("DROP TRIGGER IF EXISTS track_status_change ON applications")
    op.execute(
        """
        CREATE TRIGGER track_status_change
            AFTER UPDATE ON applications
            FOR EACH ROW
            EXECUTE FUNCTION track_application_status_change()
        """
    )

    op.execute(
        """
        CREATE OR REPLACE VIEW application_status_flow AS
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
    )


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS application_status_flow")
    op.execute("DROP TRIGGER IF EXISTS track_status_change ON applications")
    op.execute("DROP FUNCTION IF EXISTS track_application_status_change")
    op.execute("DROP TABLE IF EXISTS application_status_history")
    op.execute("DROP TABLE IF EXISTS applications")
