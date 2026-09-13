#!/usr/bin/env python
"""
One-off migration of Applitrack data from PostgreSQL into a SQLite file.

The target schema (tables, indexes, status-change trigger and the
application_status_flow view) is created by running the Alembic migrations, so
this script only copies rows. Primary keys are preserved verbatim; SQLite
continues its implicit rowid sequence from the highest id, so no sequence fix-up
is needed afterwards.

Rows are inserted, never updated, so the track_status_change trigger (which only
fires on UPDATE) does not fabricate extra history rows during the copy.

Usage:
    cd backend
    uv run --with asyncpg scripts/migrate_pg_to_sqlite.py \
        --source postgresql://user:pass@host:5432/database \
        --target sqlite+aiosqlite:////absolute/path/to/applitrack.db

Add --reset to delete an existing target file first.
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND_DIR))

# Tables are copied parents-first so the foreign key is always satisfiable.
_TABLES: tuple[str, ...] = ("applications", "application_status_history")
_BATCH_SIZE = 500


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--source",
        default=os.environ.get("SOURCE_DATABASE_URL", ""),
        help="PostgreSQL URL to read from (or set SOURCE_DATABASE_URL).",
    )
    parser.add_argument(
        "--target",
        default=os.environ.get("TARGET_DATABASE_URL", "sqlite+aiosqlite:///./data/applitrack.db"),
        help="SQLite URL to write to (default: sqlite+aiosqlite:///./data/applitrack.db).",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete the target SQLite file before migrating.",
    )
    return parser.parse_args()


def _reset_target(target_url: str) -> None:
    """Delete the target SQLite file and its write-ahead log sidecars."""
    from sqlalchemy import make_url

    target_file = make_url(target_url).database
    if not target_file or target_file == ":memory:":
        return
    for suffix in ("", "-wal", "-shm"):
        candidate = Path(target_file + suffix)
        if candidate.exists():
            candidate.unlink()
            print(f"[reset] removed {candidate}")


def _upgrade_target(target_url: str) -> None:
    """
    Create the schema, trigger and view in the target by running the migrations.

    Runs synchronously, before any event loop exists: alembic's env.py drives an
    async engine via asyncio.run(), which cannot be nested inside a running loop.
    """
    from alembic import command
    from alembic.config import Config

    from app.db import ensure_sqlite_dir

    print(f"[schema] running alembic upgrade head against {target_url}")
    ensure_sqlite_dir(target_url)
    command.upgrade(Config(str(_BACKEND_DIR / "alembic.ini")), "head")


async def _copy_table(source_conn, target_conn, table_name: str) -> int:  # noqa: ANN001
    """Copy every row of *table_name*, restricted to columns both sides share."""
    from sqlalchemy import MetaData, insert, select

    source_meta = MetaData()
    target_meta = MetaData()
    await source_conn.run_sync(source_meta.reflect, only=[table_name])
    await target_conn.run_sync(target_meta.reflect, only=[table_name])

    source_table = source_meta.tables[table_name]
    target_table = target_meta.tables[table_name]

    shared = [c.name for c in target_table.columns if c.name in source_table.columns]
    dropped = [c.name for c in source_table.columns if c.name not in target_table.columns]
    missing = [c.name for c in target_table.columns if c.name not in source_table.columns]
    if dropped:
        print(f"  [warn] {table_name}: source columns absent from target, skipped: {dropped}")
    if missing:
        print(f"  [warn] {table_name}: target columns absent from source, left at default: {missing}")

    rows = (
        await source_conn.execute(
            select(*[source_table.c[name] for name in shared]).order_by(source_table.c.id)
        )
    ).mappings().all()

    for start in range(0, len(rows), _BATCH_SIZE):
        batch = [dict(r) for r in rows[start : start + _BATCH_SIZE]]
        await target_conn.execute(insert(target_table), batch)

    print(f"  [ok ] {table_name}: copied {len(rows)} rows ({len(shared)} columns)")
    return len(rows)


async def _count(conn, table_name: str) -> int:  # noqa: ANN001
    from sqlalchemy import text

    return (await conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))).scalar_one()


async def _status_flow(conn) -> list[tuple]:  # noqa: ANN001
    from sqlalchemy import text

    result = await conn.execute(
        text(
            'SELECT user_id, "From", "To", "Weight" FROM application_status_flow'
            ' ORDER BY user_id, "From", "To"'
        )
    )
    return [tuple(row) for row in result]


async def copy_and_verify(source_url: str, target_url: str) -> int:
    from sqlalchemy.ext.asyncio import create_async_engine

    from app.db import configure_sqlite

    source_engine = create_async_engine(source_url)
    target_engine = create_async_engine(target_url)
    configure_sqlite(target_engine)

    copied: dict[str, int] = {}
    ok = True
    try:
        async with source_engine.connect() as source_conn:
            async with target_engine.begin() as target_conn:
                for table_name in _TABLES:
                    existing = await _count(target_conn, table_name)
                    if existing:
                        print(f"[abort] target table {table_name} already holds {existing} rows.")
                        print("        Use --reset, or point --target at an empty database.")
                        return 1
                print("[copy] copying rows")
                for table_name in _TABLES:
                    copied[table_name] = await _copy_table(source_conn, target_conn, table_name)

            source_counts = {t: await _count(source_conn, t) for t in _TABLES}
            source_flow = await _status_flow(source_conn)

        print("[verify] comparing row counts and status-flow output")
        async with target_engine.connect() as target_conn:
            for table_name in _TABLES:
                src = source_counts[table_name]
                dst = await _count(target_conn, table_name)
                mark = "ok " if src == dst else "FAIL"
                print(f"  [{mark}] {table_name}: postgres={src} sqlite={dst}")
                ok = ok and src == dst

            target_flow = await _status_flow(target_conn)

        if source_flow == target_flow:
            print(f"  [ok ] application_status_flow: {len(target_flow)} rows identical on both sides")
        else:
            ok = False
            print("  [FAIL] application_status_flow differs between postgres and sqlite")
            for row in [r for r in source_flow if r not in target_flow][:10]:
                print(f"      only in postgres: {row}")
            for row in [r for r in target_flow if r not in source_flow][:10]:
                print(f"      only in sqlite:   {row}")
    finally:
        await source_engine.dispose()
        await target_engine.dispose()

    if not ok:
        print("\n[FAILED] verification did not pass; do not deploy this file.")
        return 1

    print(f"\n[done] migration complete. Copied: {copied}")
    return 0


def main() -> None:
    args = _parse_args()
    if not args.source:
        print("[ERROR] --source (or SOURCE_DATABASE_URL) is required.")
        sys.exit(2)

    # Point the app settings at the target before importing anything under app.*,
    # because app.core.config builds its Settings singleton at import time and
    # alembic/env.py reads the URL from it.
    os.environ["DATABASE_URL"] = args.target

    from app.core.config import normalize_async_url

    source_url = normalize_async_url(args.source)
    target_url = normalize_async_url(args.target)

    if args.reset:
        _reset_target(target_url)
    _upgrade_target(target_url)

    sys.exit(asyncio.run(copy_and_verify(source_url, target_url)))


if __name__ == "__main__":
    main()
