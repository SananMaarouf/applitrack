import os
from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy import event, make_url
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# The database is a single SQLite file living on a volume inside the backend
# container (see backend/Dockerfile and docker-compose.yml).


def ensure_sqlite_dir(url: str) -> None:
    """Create the parent directory of a SQLite file so a fresh volume works."""
    parsed = make_url(url)
    if not parsed.drivername.startswith("sqlite"):
        return
    database = parsed.database
    if not database or database == ":memory:":
        return
    Path(database).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)


def verify_sqlite_writable(url: str) -> None:
    """
    Fail fast, with an actionable message, when SQLite cannot write.

    SQLite creates ``-wal`` and ``-shm`` sidecar files next to the database, so
    write permission on the *directory* is required, not just on the file. A
    volume whose directory is owned by root makes the app exit during startup
    with nothing useful in the logs, which is easy to hit during the Postgres
    cutover when only the copied database file was chowned.
    """
    parsed = make_url(url)
    if not parsed.drivername.startswith("sqlite"):
        return
    database = parsed.database
    if not database or database == ":memory:":
        return

    path = Path(database).expanduser().resolve()
    directory = path.parent
    uid, gid = os.getuid(), os.getgid()

    if not os.access(directory, os.W_OK | os.X_OK):
        raise RuntimeError(
            f"SQLite needs write access to the directory {directory}, not just to the "
            f"database file, because it creates -wal and -shm files alongside the "
            f"database. This process runs as uid={uid} gid={gid}. If {directory} is a "
            f"mounted volume, fix it on the host with: chown -R {uid}:{gid} <volume>"
        )
    if path.exists() and not os.access(path, os.W_OK):
        raise RuntimeError(
            f"SQLite database {path} is not writable by uid={uid} gid={gid}. "
            f"Fix it with: chown {uid}:{gid} {path}"
        )


def configure_sqlite(engine: AsyncEngine | Engine) -> None:
    """
    Apply the per-connection PRAGMAs SQLite needs.

    - ``foreign_keys=ON`` is required for the ``ON DELETE CASCADE`` between
      applications and application_status_history. SQLite disables foreign key
      enforcement per connection by default.
    - ``journal_mode=WAL`` lets readers run concurrently with a writer.
    - ``synchronous=NORMAL`` is the recommended durability level under WAL.
    """
    sync_engine = engine.sync_engine if isinstance(engine, AsyncEngine) else engine
    if not sync_engine.dialect.name.startswith("sqlite"):
        return

    @event.listens_for(sync_engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection, connection_record) -> None:  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
        finally:
            cursor.close()


def create_app_engine(url: str) -> AsyncEngine:
    """Build an async engine with the project's SQLite settings applied."""
    ensure_sqlite_dir(url)
    connect_args = {"timeout": 30} if url.startswith("sqlite") else {}
    new_engine = create_async_engine(url, connect_args=connect_args)
    configure_sqlite(new_engine)
    return new_engine


engine = create_app_engine(settings.async_database_url)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
