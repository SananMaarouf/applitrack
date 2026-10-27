-- Applitrack schema, ported from backend/alembic/versions/001_initial_sqlite.py.
--
-- Two deliberate differences from the SQLite file the FastAPI backend used:
--
--   * Datetimes are stored as fixed-width ISO-8601 UTC text
--     ("YYYY-MM-DDTHH:MM:SS.sssZ"). Every value has the same length, so D1's
--     lexical text comparison is also a chronological comparison, and the JSON
--     the API returns is unambiguous about being UTC.
--   * There is no status-history trigger. The API writes the history row in the
--     same D1 batch as the status UPDATE, which is atomic and keeps the
--     reset / correction / terminal-switch cases explicit instead of having to
--     undo rows a trigger inserted behind the application's back.

CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    user_id TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    expires_at TEXT,
    position TEXT NOT NULL,
    company TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 1 CHECK (status BETWEEN 1 AND 7),
    link TEXT,
    attachment_key TEXT
);

CREATE INDEX idx_applications_user_id ON applications (user_id);
CREATE INDEX idx_applications_user_applied_at ON applications (user_id, applied_at);

CREATE TABLE application_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    from_status INTEGER NOT NULL,
    to_status INTEGER NOT NULL
);

CREATE INDEX idx_status_history_application ON application_status_history (application_id);
CREATE INDEX idx_status_history_user ON application_status_history (user_id);

-- Aggregated transitions per user, consumed by GET /api/status-flow (the Sankey
-- diagram). The quoted aliases keep the StatusFlow row shape the frontend
-- expects: From / To / Weight.
CREATE VIEW application_status_flow AS
SELECT
    h.user_id AS user_id,
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
GROUP BY h.user_id, h.from_status, h.to_status;
