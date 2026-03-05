"""
pytest fixtures for Applitrack backend tests.

Fixtures provide:
- Temporary Clerk users (created via Backend API, deleted after the session)
- Fresh session JWTs for authenticated requests
- An async httpx client connected to the FastAPI ASGI app
- Seeded job applications + status history rows that are cleaned up after each test
"""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator, Generator
from datetime import datetime, timedelta, timezone
from typing import TypedDict

import asyncio

import pytest
import pytest_asyncio
from dotenv import load_dotenv
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# ---------------------------------------------------------------------------
# Load env vars before importing app modules so settings initialises correctly.
# Precedence: .env.test overrides, then .env as fallback.
# ---------------------------------------------------------------------------
_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
load_dotenv(dotenv_path=os.path.join(_BACKEND_DIR, ".env.test"), override=True)
load_dotenv(dotenv_path=os.path.join(_BACKEND_DIR, ".env"), override=False)

# app/db.py creates the SQLAlchemy engine at *import time* using DATABASE_URL.
# Ensure a syntactically valid placeholder is set so the import doesn't crash
# when no .env file is present; the real URL must be provided via .env.test for
# tests that actually hit the database.
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://placeholder:placeholder@localhost/placeholder"

from clerk_backend_api import Clerk  # noqa: E402
from clerk_backend_api.models.createsessionop import CreateSessionRequestBody  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Application, ApplicationStatusHistory  # noqa: E402


# ---------------------------------------------------------------------------
# Type alias
# ---------------------------------------------------------------------------

class ClerkUserInfo(TypedDict):
    user_id: str
    email: str
    password: str
    first_name: str
    last_name: str


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _make_test_email() -> str:
    """Return a globally unique test email address."""
    return f"applitrack.test.{uuid.uuid4().hex[:10]}@example.com"


def _build_clerk() -> Clerk | None:
    """Return a Clerk SDK client, or *None* when running in testing mode."""
    if settings.environment == "testing":
        return None
    if not settings.clerk_secret_key:
        raise RuntimeError(
            "CLERK_SECRET_KEY is not configured. "
            "Set it in backend/.env.test (or backend/.env) before running tests."
        )
    return Clerk(bearer_auth=settings.clerk_secret_key)


_STATIC_TOKENS: dict[str, str] = {
    "user_a": "user-a-token",
    "user_b": "user-b-token",
}


def _fresh_jwt(clerk_client: Clerk | None, user_id: str) -> str:
    """
    Return a bearer token for *user_id*.

    In testing mode a static token is returned so CI never calls Clerk.
    Otherwise a short-lived JWT is minted via the Clerk Backend API.
    """
    if settings.environment == "testing":
        return _STATIC_TOKENS.get(user_id, "test-token")

    assert clerk_client is not None
    session = clerk_client.sessions.create(
        request=CreateSessionRequestBody(user_id=user_id)
    )
    token_resp = clerk_client.sessions.create_token(session_id=session.id)
    assert token_resp.jwt is not None, "Clerk returned a null JWT"
    return token_resp.jwt


# ---------------------------------------------------------------------------
# Session-scoped event loop – shared by all async fixtures and tests so that
# the asyncpg connection pool created inside db_engine is never attached to a
# different loop than the one the test is running on.
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the entire test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# Clerk client (session-scoped – one SDK instance per test run)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def clerk_client() -> Clerk | None:
    return _build_clerk()


# ---------------------------------------------------------------------------
# Clerk user fixtures
# NOTE: sessions.create is only available in **development** Clerk instances.
# ---------------------------------------------------------------------------

def _create_clerk_user(
    clerk_client: Clerk,
    first_name: str,
    last_name: str,
) -> ClerkUserInfo:
    email = _make_test_email()
    password = f"TestPass!{uuid.uuid4().hex[:12]}"
    # legal_accepted_at is required when legal_consent_enabled is true on the
    # Clerk instance.  Supply the current UTC time in RFC 3339 format.
    legal_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    user = clerk_client.users.create(
        email_address=[email],
        password=password,
        first_name=first_name,
        last_name=last_name,
        skip_password_checks=True,
        legal_accepted_at=legal_ts,
    )
    return ClerkUserInfo(
        user_id=user.id,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )


def _delete_clerk_user(clerk_client: Clerk, user_id: str) -> None:
    """Revoke all sessions then delete the user, swallowing any errors."""
    try:
        sessions = clerk_client.sessions.list(user_id=user_id)
        for s in (sessions or []):
            try:
                clerk_client.sessions.revoke(session_id=s.id)
            except Exception:
                pass
    except Exception:
        pass
    try:
        clerk_client.users.delete(user_id=user_id)
    except Exception:
        pass


@pytest.fixture(scope="session")
def clerk_user(clerk_client: Clerk | None) -> Generator[ClerkUserInfo, None, None]:
    """Primary test user – created once per test session, deleted afterwards."""
    if settings.environment == "testing":
        yield ClerkUserInfo(
            user_id="user_a",
            email="user_a@test.example.com",
            password="",
            first_name="Alice",
            last_name="Tester",
        )
        return
    assert clerk_client is not None
    info = _create_clerk_user(clerk_client, "Alice", "Tester")
    yield info
    _delete_clerk_user(clerk_client, info["user_id"])


@pytest.fixture(scope="session")
def second_clerk_user(clerk_client: Clerk | None) -> Generator[ClerkUserInfo, None, None]:
    """Secondary test user for isolation / multi-user scenarios."""
    if settings.environment == "testing":
        yield ClerkUserInfo(
            user_id="user_b",
            email="user_b@test.example.com",
            password="",
            first_name="Bob",
            last_name="Tester",
        )
        return
    assert clerk_client is not None
    info = _create_clerk_user(clerk_client, "Bob", "Tester")
    yield info
    _delete_clerk_user(clerk_client, info["user_id"])


# ---------------------------------------------------------------------------
# Database engine / session
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def db_engine():
    url = settings.database_url
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(url, pool_pre_ping=True)
    yield engine


@pytest_asyncio.fixture()
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    factory = async_sessionmaker(bind=db_engine, expire_on_commit=False, class_=AsyncSession)
    async with factory() as session:
        yield session


# ---------------------------------------------------------------------------
# HTTP client fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture()
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated async httpx client backed by the FastAPI ASGI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac


@pytest_asyncio.fixture()
async def authed_client(
    client: AsyncClient,
    clerk_client: Clerk | None,
    clerk_user: ClerkUserInfo,
) -> AsyncGenerator[AsyncClient, None]:
    """
    Authenticated client pre-configured with a fresh Clerk JWT (or a static
    test token when ENVIRONMENT=testing).
    """
    token = _fresh_jwt(clerk_client, clerk_user["user_id"])
    client.headers.update({"Authorization": f"Bearer {token}"})
    yield client


@pytest_asyncio.fixture()
async def second_authed_client(
    clerk_client: Clerk | None,
    second_clerk_user: ClerkUserInfo,
) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client for the secondary test user."""
    token = _fresh_jwt(clerk_client, second_clerk_user["user_id"])
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
        headers={"Authorization": f"Bearer {token}"},
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# Seeded-data fixture
# ---------------------------------------------------------------------------

_SEED_APPS: list[dict] = [
    dict(
        position="Software Engineer",
        company="Acme Corp",
        days_ago=30,
        status=2,  # Interview
        link="https://acme.example.com/jobs/1",
        # status history transitions
        history=[(1, 2)],
    ),
    dict(
        position="Backend Developer",
        company="Globex",
        days_ago=20,
        status=5,  # Offer
        link=None,
        history=[(1, 2), (2, 3), (3, 4), (4, 5)],
    ),
    dict(
        position="Data Engineer",
        company="Initech",
        days_ago=15,
        status=6,  # Rejected
        link="https://initech.example.com/jobs/42",
        history=[(1, 2), (2, 6)],
    ),
    dict(
        position="DevOps Engineer",
        company="Umbrella Ltd",
        days_ago=10,
        status=1,  # Applied (no history yet)
        link=None,
        history=[],
    ),
    dict(
        position="ML Engineer",
        company="Skynet AI",
        days_ago=5,
        status=3,  # Second Interview
        link="https://skynetai.example.com/jobs/7",
        history=[(1, 2), (2, 3)],
    ),
]


@pytest_asyncio.fixture()
async def seeded_applications(
    db_session: AsyncSession,
    clerk_user: ClerkUserInfo,
) -> AsyncGenerator[list[Application], None]:
    """
    Insert test job applications with status histories for the primary test user.

    Rows are committed so the FastAPI app (separate DB connections) can see them.
    All rows are deleted (applications + cascaded history) when the test finishes.
    """
    user_id = clerk_user["user_id"]
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    inserted: list[Application] = []

    for spec in _SEED_APPS:
        app_row = Application(
            user_id=user_id,
            position=spec["position"],
            company=spec["company"],
            applied_at=now - timedelta(days=spec["days_ago"]),
            status=spec["status"],
            link=spec.get("link"),
        )
        db_session.add(app_row)
        await db_session.flush()  # populate app_row.id before adding history

        for from_s, to_s in spec["history"]:
            db_session.add(
                ApplicationStatusHistory(
                    application_id=app_row.id,
                    user_id=user_id,
                    from_status=from_s,
                    to_status=to_s,
                )
            )

        inserted.append(app_row)

    await db_session.commit()

    yield inserted

    # Cleanup – FK cascade on application_status_history handles history rows
    ids = [a.id for a in inserted]
    await db_session.execute(delete(Application).where(Application.id.in_(ids)))
    await db_session.commit()
