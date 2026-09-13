from __future__ import annotations

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# -- project imports --
from app.core.config import settings
from app.db import configure_sqlite, ensure_sqlite_dir
from app.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    return settings.async_database_url


# ---------------------------------------------------------------------------
# Offline mode — emit SQL without a live DB connection
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online mode — connect to the DB and apply migrations
# ---------------------------------------------------------------------------
def do_run_migrations(connection) -> None:  # noqa: ANN001
    # render_as_batch rewrites ALTER TABLE into SQLite's copy-and-move recipe,
    # which SQLite needs for most column changes.
    context.configure(connection=connection, target_metadata=target_metadata, render_as_batch=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    url = get_url()
    ensure_sqlite_dir(url)
    engine = create_async_engine(url, poolclass=pool.NullPool)
    configure_sqlite(engine)
    async with engine.connect() as conn:
        await conn.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
