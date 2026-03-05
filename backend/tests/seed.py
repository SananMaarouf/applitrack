"""
Seed script: create mock Clerk users + job application data for development/testing.

Usage:
    python -m tests.seed                  # seed with default 2 users
    python -m tests.seed --users 3        # seed with 3 users
    python -m tests.seed --clean          # delete previously seeded users + their DB rows
    python -m tests.seed --clean --users 3  # clean then re-seed

What it does:
  1. Creates Clerk users via the Backend API (dev instances only).
  2. Inserts job applications and status-change history into the database.
  3. Writes the created user IDs / emails to tests/seed_data.json for later reference.

Prerequisites:
  - CLERK_SECRET_KEY and DATABASE_URL must be set (backend/.env or env vars).
  - The database must be running and migrated (alembic upgrade head).
  - Clerk instance must be in development mode (create_session requires dev mode).
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Bootstrap: ensure app imports work when running as `python -m tests.seed`
# ---------------------------------------------------------------------------
_BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND_DIR))

from dotenv import load_dotenv

load_dotenv(dotenv_path=_BACKEND_DIR / ".env.test", override=True)
load_dotenv(dotenv_path=_BACKEND_DIR / ".env", override=False)

from clerk_backend_api import Clerk  # noqa: E402
from clerk_backend_api.models.createsessionop import CreateSessionRequestBody  # noqa: E402
from sqlalchemy import delete, select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.models import Application, ApplicationStatusHistory  # noqa: E402

# ---------------------------------------------------------------------------
# Constants & seed data templates
# ---------------------------------------------------------------------------

_SEED_DATA_PATH = Path(__file__).parent / "seed_data.json"
_TEST_EXTERNAL_ID_PREFIX = "applitrack-seed-"

_USER_TEMPLATES = [
    dict(first_name="Alice", last_name="Developer", email_prefix="alice.dev"),
    dict(first_name="Bob", last_name="Engineer", email_prefix="bob.eng"),
    dict(first_name="Carol", last_name="Analyst", email_prefix="carol.analyst"),
    dict(first_name="Dave", last_name="Designer", email_prefix="dave.design"),
    dict(first_name="Eve", last_name="Manager", email_prefix="eve.mgr"),
]

_APP_TEMPLATES: list[dict] = [
    # position, company, days_ago, status, link, history (list of (from, to) tuples)
    dict(
        position="Software Engineer",
        company="Acme Corp",
        days_ago=45,
        status=5,  # Offer
        link="https://acme.example.com/jobs/1",
        history=[(1, 2), (2, 3), (3, 4), (4, 5)],
    ),
    dict(
        position="Backend Developer",
        company="Globex Inc",
        days_ago=30,
        status=2,  # Interview
        link="https://globex.example.com/careers/42",
        history=[(1, 2)],
    ),
    dict(
        position="Data Engineer",
        company="Initech",
        days_ago=25,
        status=6,  # Rejected
        link="https://initech.example.com/jobs/7",
        history=[(1, 2), (2, 6)],
    ),
    dict(
        position="DevOps Engineer",
        company="Umbrella Technologies",
        days_ago=20,
        status=1,  # Applied (still pending)
        link=None,
        history=[],
    ),
    dict(
        position="ML Engineer",
        company="Skynet AI",
        days_ago=18,
        status=3,  # Second Interview
        link="https://skynetai.example.com/jobs/3",
        history=[(1, 2), (2, 3)],
    ),
    dict(
        position="Platform Engineer",
        company="Weyland Corp",
        days_ago=14,
        status=7,  # Ghosted
        link=None,
        history=[(1, 7)],
    ),
    dict(
        position="Full Stack Developer",
        company="Hooli",
        days_ago=10,
        status=4,  # Third Interview
        link="https://hooli.example.com/jobs/99",
        history=[(1, 2), (2, 3), (3, 4)],
    ),
    dict(
        position="Site Reliability Engineer",
        company="Pied Piper",
        days_ago=7,
        status=1,  # Applied
        link="https://piedpiper.example.com/sre",
        history=[],
    ),
]


# ---------------------------------------------------------------------------
# Clerk helpers
# ---------------------------------------------------------------------------

def _get_clerk() -> Clerk:
    if not settings.clerk_secret_key:
        print("[ERROR] CLERK_SECRET_KEY is not set.")
        print("        Add it to backend/.env or backend/.env.test before seeding.")
        sys.exit(1)
    return Clerk(bearer_auth=settings.clerk_secret_key)


def _create_clerk_user(clerk: Clerk, template: dict, idx: int) -> dict:
    """Create a Clerk user from a template and return its info dict."""
    uid = uuid.uuid4().hex[:8]
    email = f"{template['email_prefix']}.{uid}@example.com"
    password = f"SeedPass!{uuid.uuid4().hex[:12]}"
    external_id = f"{_TEST_EXTERNAL_ID_PREFIX}{idx}-{uid}"

    user = clerk.users.create(
        email_address=[email],
        password=password,
        first_name=template["first_name"],
        last_name=template["last_name"],
        external_id=external_id,
        skip_password_checks=True,
        legal_accepted_at=datetime.now(tz=timezone.utc).isoformat(),
    )

    # Obtain a session token so the entry is immediately usable
    session = clerk.sessions.create(
        request=CreateSessionRequestBody(user_id=user.id)
    )
    token_resp = clerk.sessions.create_token(session_id=session.id)

    return {
        "user_id": user.id,
        "email": email,
        "password": password,
        "first_name": template["first_name"],
        "last_name": template["last_name"],
        "external_id": external_id,
        "session_id": session.id,
        "sample_jwt": token_resp.jwt,  # valid for ~60 s; refresh via create_token
    }


def _delete_clerk_users(clerk: Clerk, seed_data: list[dict]) -> None:
    """Delete previously seeded Clerk users."""
    for entry in seed_data:
        user_id = entry.get("user_id")
        if not user_id:
            continue
        # Revoke sessions
        try:
            sessions = clerk.sessions.list(user_id=user_id)
            for s in (sessions or []):
                try:
                    clerk.sessions.revoke(session_id=s.id)
                except Exception:
                    pass
        except Exception:
            pass
        # Delete user
        try:
            clerk.users.delete(user_id=user_id)
            print(f"  [clerk] deleted user {user_id} ({entry.get('email')})")
        except Exception as exc:
            print(f"  [clerk] could not delete {user_id}: {exc}")


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def _get_engine():
    url = settings.database_url
    if not url:
        print("[ERROR] DATABASE_URL is not set.")
        sys.exit(1)
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return create_async_engine(url, pool_pre_ping=True)


async def _seed_db_for_user(session: AsyncSession, user_id: str) -> None:
    """Insert job applications and status histories for one user."""
    now = datetime.now(tz=timezone.utc)

    for spec in _APP_TEMPLATES:
        app_row = Application(
            user_id=user_id,
            position=spec["position"],
            company=spec["company"],
            applied_at=now - timedelta(days=spec["days_ago"]),
            status=spec["status"],
            link=spec.get("link"),
        )
        session.add(app_row)
        await session.flush()  # obtain app_row.id

        for from_s, to_s in spec["history"]:
            session.add(
                ApplicationStatusHistory(
                    application_id=app_row.id,
                    user_id=user_id,
                    from_status=from_s,
                    to_status=to_s,
                )
            )

    await session.commit()


async def _clean_db_for_users(session: AsyncSession, user_ids: list[str]) -> None:
    """Delete all application rows (+ cascaded history) for the given users."""
    for user_id in user_ids:
        result = await session.execute(
            select(Application.id).where(Application.user_id == user_id)
        )
        ids = [row[0] for row in result]
        if ids:
            await session.execute(delete(Application).where(Application.id.in_(ids)))
            print(f"  [db] deleted {len(ids)} applications for user {user_id}")
    await session.commit()


# ---------------------------------------------------------------------------
# Main seed / clean logic
# ---------------------------------------------------------------------------

async def run_seed(num_users: int) -> None:
    clerk = _get_clerk()
    engine = _get_engine()
    factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    templates = (_USER_TEMPLATES * ((num_users // len(_USER_TEMPLATES)) + 1))[:num_users]
    created_users: list[dict] = []

    print(f"\n=== Seeding {num_users} user(s) ===\n")

    for idx, template in enumerate(templates):
        print(f"Creating Clerk user {idx + 1}/{num_users}  ({template['first_name']} {template['last_name']}) ...")
        user_info = _create_clerk_user(clerk, template, idx)
        print(f"  [clerk] user_id={user_info['user_id']}  email={user_info['email']}")

        async with factory() as session:
            await _seed_db_for_user(session, user_info["user_id"])
        print(f"  [db]    inserted {len(_APP_TEMPLATES)} applications with status histories")

        created_users.append(user_info)

    # Write seed data to JSON for reference
    _SEED_DATA_PATH.write_text(json.dumps(created_users, indent=2))

    print(f"\n=== Done! Seed data written to {_SEED_DATA_PATH} ===\n")
    _print_summary(created_users)


async def run_clean() -> None:
    if not _SEED_DATA_PATH.exists():
        print(f"[INFO] No seed data file found at {_SEED_DATA_PATH}. Nothing to clean.")
        return

    seed_data: list[dict] = json.loads(_SEED_DATA_PATH.read_text())
    if not seed_data:
        print("[INFO] Seed data file is empty. Nothing to clean.")
        return

    clerk = _get_clerk()
    engine = _get_engine()
    factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    print(f"\n=== Cleaning {len(seed_data)} previously seeded user(s) ===\n")

    user_ids = [entry["user_id"] for entry in seed_data if entry.get("user_id")]

    async with factory() as session:
        await _clean_db_for_users(session, user_ids)

    _delete_clerk_users(clerk, seed_data)

    _SEED_DATA_PATH.write_text("[]")
    print("\n=== Clean complete ===\n")


def _print_summary(users: list[dict]) -> None:
    print("Seeded users:")
    print(f"  {'user_id':<30}  {'email':<45}  first_name")
    print("  " + "-" * 90)
    for u in users:
        print(f"  {u['user_id']:<30}  {u['email']:<45}  {u['first_name']}")
    print()
    print(f"Each user has {len(_APP_TEMPLATES)} job applications seeded with the following statuses:")
    status_names = {1: "Applied", 2: "Interview", 3: "2nd Interview", 4: "3rd Interview", 5: "Offer", 6: "Rejected", 7: "Ghosted"}
    for spec in _APP_TEMPLATES:
        label = status_names.get(spec["status"], str(spec["status"]))
        hist = " → ".join(
            f"{status_names.get(f, f)}→{status_names.get(t, t)}" for f, t in spec["history"]
        ) or "(none)"
        print(f"  [{label:<13}]  {spec['company']}: {spec['position']}  |  history: {hist}")
    print()
    print("To get a fresh JWT for a seeded user, run:")
    print("  python -m tests.token <user_id>")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Applitrack database with mock data.")
    parser.add_argument(
        "--users", "-u",
        type=int,
        default=2,
        metavar="N",
        help="Number of mock users to create (default: 2, max: 5)",
    )
    parser.add_argument(
        "--clean", "-c",
        action="store_true",
        help="Delete previously seeded data (users + DB rows) before seeding",
    )
    args = parser.parse_args()

    if args.users < 1 or args.users > len(_USER_TEMPLATES):
        print(f"[ERROR] --users must be between 1 and {len(_USER_TEMPLATES)}")
        sys.exit(1)

    if args.clean:
        asyncio.run(run_clean())

    asyncio.run(run_seed(args.users))


if __name__ == "__main__":
    main()
