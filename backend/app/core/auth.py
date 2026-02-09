"""Clerk request authentication using the official clerk-backend-api SDK."""

from __future__ import annotations

import logging

import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton Clerk SDK client – reused across requests.
# ---------------------------------------------------------------------------
_clerk: Clerk | None = None


def _get_clerk() -> Clerk:
    """Return a module-level Clerk SDK client, creating it on first use."""
    global _clerk  # noqa: PLW0603
    if _clerk is None:
        if not settings.clerk_secret_key:
            raise RuntimeError(
                "CLERK_SECRET_KEY is not set. "
                "Make sure it is defined in your environment."
            )
        _clerk = Clerk(bearer_auth=settings.clerk_secret_key)
    return _clerk


def authenticate_request(request: httpx.Request) -> str | None:
    """Verify a Clerk session token via the SDK and return the user id (``sub``).

    Returns ``None`` when verification fails so the caller can raise an
    appropriate HTTP error.
    """
    try:
        clerk = _get_clerk()

        authorized_parties = [
            origin.strip()
            for origin in settings.cors_origins.split(",")
            if origin.strip()
        ]

        request_state = clerk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                authorized_parties=authorized_parties,
            ),
        )

        if not request_state.is_signed_in:
            logger.warning("Clerk auth failed: %s", request_state.reason)
            return None

        # The payload contains standard JWT claims; ``sub`` is the Clerk user id.
        return request_state.payload.get("sub") if request_state.payload else None

    except Exception:
        logger.exception("Unexpected error during Clerk authentication")
        return None
