# Migrating production data from PostgreSQL to SQLite

`migrate_pg_to_sqlite.py` copies the `applications` and
`application_status_history` tables out of PostgreSQL into a SQLite file.

It does **not** hand-write any schema. It runs `alembic upgrade head` against the
target first, so the tables, indexes, the `track_status_change` trigger and the
`application_status_flow` view all come from
`alembic/versions/001_initial_sqlite.py`. Primary keys are preserved, and SQLite
continues its rowid sequence from the highest copied id, so no sequence fix-up is
needed. Rows are inserted rather than updated, so the trigger (which fires only
on `UPDATE`) cannot fabricate extra history rows during the copy.

After copying it verifies both row counts and the full `application_status_flow`
output against the source, and exits non-zero if anything differs.

## Running it

```bash
cd backend
uv run --with asyncpg scripts/migrate_pg_to_sqlite.py \
  --source postgresql://user:pass@host:5432/database \
  --target sqlite+aiosqlite:///./data/applitrack.db \
  --reset
```

`asyncpg` is no longer a project dependency, hence `--with asyncpg`. `--reset`
deletes an existing target file (plus its `-wal`/`-shm` sidecars) first; without
it the script refuses to write into a non-empty database.

If the production database is not reachable from your machine, dump and restore
it locally first, then point `--source` at the local copy:

```bash
pg_dump -Fc "$PROD_URL" > applitrack.dump
docker run -d --name pg-restore -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:17-alpine
pg_restore -d postgresql://postgres:password@localhost:5432/postgres applitrack.dump
```

## Production cutover

1. Add a persistent volume mounted at `/app/data` to the backend service and set
   `DATABASE_URL=sqlite+aiosqlite:////app/data/applitrack.db` (four slashes: the
   path is absolute).
2. Stop the backend so no further writes reach PostgreSQL.
3. Produce `applitrack.db` with the script above and check the verification output.
4. Copy the file into the volume as `applitrack.db`, **then fix ownership of the
   whole directory**:

   ```bash
   chown -R 1001:1001 /var/lib/docker/volumes/<volume>/_data
   ```

   The container runs as uid 1001, and SQLite writes `-wal` and `-shm` files
   *next to* the database. Chowning only the copied file leaves the directory
   unwritable and the backend refuses to start. It will tell you so explicitly,
   naming the directory and the uid, but the fix is always this `chown -R`.
5. Start the backend. Because the copied database already carries the
   `alembic_version` row, the startup migration is a no-op. Check `/health`, then
   `/applications` and `/status-flow` for a known user and compare with the
   script's verification output.
6. Keep the PostgreSQL service stopped but present for a few days as a rollback
   path, then remove it.

## Backups

PostgreSQL's backups disappear with this migration. The database is now a single
file, so back it up with `sqlite3 /app/data/applitrack.db ".backup /dest/out.db"`
on a schedule, or stream it continuously with Litestream to the existing R2
bucket. Do not copy the file with `cp` while the app is running; `.backup` is
the safe way to snapshot a live SQLite database.
