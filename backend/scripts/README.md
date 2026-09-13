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
it locally first, then point `--source` at the local copy. `pg_dump`'s default
output is a **plain SQL script**, restored with `psql -f`, not `pg_restore`
(that only works with `-Fc`/`-Fd`/`-Ft` dumps):

```bash
pg_dump "$PROD_URL" > applitrack_dump.sql
docker run -d --name pg-restore -e POSTGRES_PASSWORD=password -p 5433:5432 postgres:17-alpine
# wait for it to accept connections, then:
PGPASSWORD=password psql -h localhost -p 5433 -U postgres -d postgres -f applitrack_dump.sql
```

(If a dump starts with `\restrict ...`, your local `psql` must be version 18+
to parse it — check with `psql --version`. That directive is a client-side
guard added in newer `pg_dump`/`psql`; the target server version doesn't need
to match.) `ALTER ... OWNER TO <role>` errors for a role that doesn't exist in
the fresh container are harmless — ownership isn't needed for the copy, and the
`CREATE TABLE`/`COPY` statements around them still succeed. Confirm the restore
actually worked before moving on:

```bash
PGPASSWORD=password psql -h localhost -p 5433 -U postgres -d postgres \
  -c "SELECT count(*) FROM applications; SELECT count(*) FROM application_status_history;"
```

Then point the migration script at `postgresql://postgres:password@localhost:5433/postgres`
and clean up the container (`docker rm -f pg-restore`) once you have the verified
`applitrack.db`.

## Production cutover

This assumes a single Docker host (e.g. a Dokploy VPS reachable over SSH) where
the backend runs as a container with a volume or bind mount at `/app/data`.

1. **Stop writes.** In Dokploy (or `docker stop`), stop the backend service, then
   the PostgreSQL service. No more writes will reach PostgreSQL from this point.
2. **Produce `applitrack.db`** locally with the script above (dumping/restoring
   PostgreSQL first if it isn't reachable directly) and confirm the script's own
   verification step printed no mismatches.
3. **Find where `/app/data` actually lives on the host.** SSH into the VPS and
   inspect the stopped backend container — it still exists and can be inspected
   even though it's stopped:

   ```bash
   ssh <your-vps-alias>
   sudo docker ps -a --filter "name=backend"                 # get the container name
   sudo docker inspect <container> \
     --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
   ```

   The line ending in `-> /app/data` gives you the host path (a directory under
   `/var/lib/docker/volumes/.../_data` for a named volume, or wherever Dokploy
   put a bind mount). Use that path in the next two steps.
4. **Copy the file over and into place.** From your workstation:

   ```bash
   scp backend/data/applitrack.db <your-vps-alias>:/tmp/applitrack.db
   ```

   Then on the VPS, move it into the host path found in step 3 and **fix
   ownership of the whole directory**, not just the file:

   ```bash
   sudo mv /tmp/applitrack.db <host-path>/applitrack.db
   sudo chown -R 1001:1001 <host-path>
   ```

   The container runs as uid 1001, and SQLite writes `-wal` and `-shm` files
   *next to* the database. Chowning only the copied file leaves the directory
   unwritable and the backend refuses to start. It will tell you so explicitly,
   naming the directory and the uid, but the fix is always this `chown -R`.
5. **Start the backend** (via Dokploy's UI, or `sudo docker start <container>`).
   Because the copied database already carries the `alembic_version` row, the
   startup migration is a no-op. Check `/health`, then `/applications` and
   `/status-flow` for a known user, and compare the counts with the migration
   script's verification output.
6. Keep the PostgreSQL service stopped but present for a few days as a rollback
   path, then remove it (and its volume) once you're confident.

## Backups

PostgreSQL's backups disappear with this migration. The database is now a single
file, so back it up with `sqlite3 /app/data/applitrack.db ".backup /dest/out.db"`
on a schedule, or stream it continuously with Litestream to the existing R2
bucket. Do not copy the file with `cp` while the app is running; `.backup` is
the safe way to snapshot a live SQLite database.
