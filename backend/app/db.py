from collections.abc import AsyncGenerator

from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Accept both sync and async SQLAlchemy URLs.
# Docker compose currently uses: postgresql://...
_database_url = settings.database_url
if _database_url.startswith("postgresql://"):
    _database_url = _database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# In the test environment each test may run in its own asyncio event loop, so
# connection pooling would cause "Future attached to a different loop" errors
# with asyncpg.  NullPool creates a fresh connection per request instead.
_engine_kwargs = {}
if settings.environment == "testing":
    _engine_kwargs["poolclass"] = NullPool

engine = create_async_engine(_database_url, pool_pre_ping=True, **_engine_kwargs)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
