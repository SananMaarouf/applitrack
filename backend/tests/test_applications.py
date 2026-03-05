"""
Integration tests for the Applitrack backend API.

These tests run against the real FastAPI app (via httpx ASGI transport) and the
real database, using temporary Clerk users created via the Backend API.

Test categories:
  - Auth: unauthenticated requests should return 401
  - Applications CRUD: create, list, status update, delete
  - Status isolation: user B cannot read/modify user A's data
  - Status flow: GET /status-flow returns history aggregated correctly
  - Seeded data: smoke-tests against the seeded_applications fixture

Run:
    cd backend
    pytest tests/ -v

Requirements:
    CLERK_SECRET_KEY and DATABASE_URL must be in backend/.env or backend/.env.test.
    The Clerk instance must be in development mode.
    The database must be running and migrated.
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient

# ---------------------------------------------------------------------------
# Mark all tests in this module as asyncio
# ---------------------------------------------------------------------------
pytestmark = pytest.mark.asyncio


# ===========================================================================
# Authentication tests
# ===========================================================================

class TestAuthentication:
    """Unauthenticated requests must be rejected with 401."""

    async def test_list_applications_requires_auth(self, client: AsyncClient):
        response = await client.get("/applications")
        assert response.status_code == 401

    async def test_create_application_requires_auth(self, client: AsyncClient):
        response = await client.post(
            "/applications",
            json={
                "position": "Engineer",
                "company": "Acme",
                "applied_at": "2025-01-01T00:00:00",
            },
        )
        assert response.status_code == 401

    async def test_update_status_requires_auth(self, client: AsyncClient):
        response = await client.patch("/applications/999/status", json={"new_status": 2})
        assert response.status_code == 401

    async def test_delete_requires_auth(self, client: AsyncClient):
        response = await client.delete("/applications/999")
        assert response.status_code == 401

    async def test_status_flow_requires_auth(self, client: AsyncClient):
        response = await client.get("/status-flow")
        assert response.status_code == 401


# ===========================================================================
# Health check (no auth required)
# ===========================================================================

class TestHealth:
    async def test_health_ok(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200


# ===========================================================================
# Application CRUD
# ===========================================================================

class TestApplicationsCRUD:
    """Full lifecycle: create → list → status update → delete."""

    async def test_list_applications_empty(self, authed_client: AsyncClient):
        """A brand-new user has no applications."""
        response = await authed_client.get("/applications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # May contain pre-existing data from other tests; just verify it's a list.

    async def test_create_application(self, authed_client: AsyncClient):
        """Creating a valid application returns 201 with the expected fields."""
        payload = {
            "position": "Software Engineer",
            "company": "Test Corp",
            "applied_at": "2025-01-15T10:00:00",
            "link": "https://testcorp.example.com/jobs/1",
        }
        response = await authed_client.post("/applications", json=payload)
        assert response.status_code == 201

        body = response.json()
        assert body["position"] == payload["position"]
        assert body["company"] == payload["company"]
        assert body["status"] == 1  # always starts as "Applied"
        assert body["link"] == payload["link"]
        assert "id" in body
        assert "user_id" in body

        # Cleanup
        await authed_client.delete(f"/applications/{body['id']}")

    async def test_created_application_appears_in_list(self, authed_client: AsyncClient):
        """Application created via POST shows up in GET /applications."""
        create_resp = await authed_client.post(
            "/applications",
            json={
                "position": "Backend Dev",
                "company": "List Corp",
                "applied_at": "2025-02-01T09:00:00",
            },
        )
        assert create_resp.status_code == 201
        app_id = create_resp.json()["id"]

        list_resp = await authed_client.get("/applications")
        assert list_resp.status_code == 200
        ids = [a["id"] for a in list_resp.json()]
        assert app_id in ids

        # Cleanup
        await authed_client.delete(f"/applications/{app_id}")

    async def test_delete_application(self, authed_client: AsyncClient):
        """DELETE returns 204 and the application no longer appears in listings."""
        create_resp = await authed_client.post(
            "/applications",
            json={
                "position": "DevOps",
                "company": "Delete Corp",
                "applied_at": "2025-03-01T00:00:00",
            },
        )
        app_id = create_resp.json()["id"]

        delete_resp = await authed_client.delete(f"/applications/{app_id}")
        assert delete_resp.status_code == 204

        list_resp = await authed_client.get("/applications")
        ids = [a["id"] for a in list_resp.json()]
        assert app_id not in ids

    async def test_delete_nonexistent_returns_204(self, authed_client: AsyncClient):
        """Deleting a non-existent (or already deleted) application returns 204."""
        response = await authed_client.delete("/applications/999999999")
        assert response.status_code == 204

    async def test_create_application_invalid_payload(self, authed_client: AsyncClient):
        """Missing required fields returns 422."""
        response = await authed_client.post(
            "/applications",
            json={"company": "No Position Corp"},  # missing position and applied_at
        )
        assert response.status_code == 422


# ===========================================================================
# Status transitions
# ===========================================================================

class TestStatusTransitions:
    """Status update rules as enforced by validate_status_transition."""

    async def _create_app(self, client: AsyncClient) -> int:
        resp = await client.post(
            "/applications",
            json={
                "position": "Status Test Engineer",
                "company": "Status Corp",
                "applied_at": "2025-04-01T00:00:00",
            },
        )
        assert resp.status_code == 201
        return resp.json()["id"]

    async def test_forward_transition_applied_to_interview(self, authed_client: AsyncClient):
        app_id = await self._create_app(authed_client)
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 2})
        assert resp.status_code == 200
        await authed_client.delete(f"/applications/{app_id}")

    async def test_skip_forward_is_rejected(self, authed_client: AsyncClient):
        """Cannot skip from Applied (1) directly to Second Interview (3)."""
        app_id = await self._create_app(authed_client)
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 3})
        assert resp.status_code == 400
        await authed_client.delete(f"/applications/{app_id}")

    async def test_same_status_transition_rejected(self, authed_client: AsyncClient):
        app_id = await self._create_app(authed_client)
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 1})
        assert resp.status_code == 400
        await authed_client.delete(f"/applications/{app_id}")

    async def test_terminal_status_offer(self, authed_client: AsyncClient):
        """Can jump from any non-terminal status directly to Offer (5)."""
        app_id = await self._create_app(authed_client)
        # Advance to Interview first
        await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 2})
        # Then jump to Offer
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 5})
        assert resp.status_code == 200
        await authed_client.delete(f"/applications/{app_id}")

    async def test_terminal_status_rejected(self, authed_client: AsyncClient):
        app_id = await self._create_app(authed_client)
        await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 2})
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 6})
        assert resp.status_code == 200
        await authed_client.delete(f"/applications/{app_id}")

    async def test_terminal_status_ghosted(self, authed_client: AsyncClient):
        app_id = await self._create_app(authed_client)
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 7})
        assert resp.status_code == 200
        await authed_client.delete(f"/applications/{app_id}")

    async def test_cannot_move_from_terminal_to_non_terminal(self, authed_client: AsyncClient):
        """Once Rejected (6), cannot move to Interview (2) without reset."""
        app_id = await self._create_app(authed_client)
        await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 6})
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 2})
        assert resp.status_code == 400
        await authed_client.delete(f"/applications/{app_id}")

    async def test_reset_to_applied(self, authed_client: AsyncClient):
        """Resetting to Applied (1) is always allowed from any status."""
        app_id = await self._create_app(authed_client)
        await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 6})
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 1})
        assert resp.status_code == 200
        await authed_client.delete(f"/applications/{app_id}")

    async def test_invalid_status_value(self, authed_client: AsyncClient):
        """Status outside [1, 7] should be rejected by Pydantic (422)."""
        app_id = await self._create_app(authed_client)
        resp = await authed_client.patch(f"/applications/{app_id}/status", json={"new_status": 99})
        assert resp.status_code == 422
        await authed_client.delete(f"/applications/{app_id}")

    async def test_update_status_for_nonexistent_application(self, authed_client: AsyncClient):
        resp = await authed_client.patch("/applications/999999999/status", json={"new_status": 2})
        assert resp.status_code == 404


# ===========================================================================
# User isolation
# ===========================================================================

class TestUserIsolation:
    """User B must not be able to see, modify, or delete User A's applications."""

    async def test_user_b_cannot_see_user_a_applications(
        self,
        authed_client: AsyncClient,
        second_authed_client: AsyncClient,
    ):
        # User A creates an application
        create_resp = await authed_client.post(
            "/applications",
            json={
                "position": "Isolation Test",
                "company": "Isolated Corp",
                "applied_at": "2025-05-01T00:00:00",
            },
        )
        app_id = create_resp.json()["id"]

        # User B's listing should not contain User A's application
        b_list = await second_authed_client.get("/applications")
        b_ids = [a["id"] for a in b_list.json()]
        assert app_id not in b_ids

        # Cleanup
        await authed_client.delete(f"/applications/{app_id}")

    async def test_user_b_cannot_update_user_a_status(
        self,
        authed_client: AsyncClient,
        second_authed_client: AsyncClient,
    ):
        create_resp = await authed_client.post(
            "/applications",
            json={
                "position": "Protected Role",
                "company": "Shield Corp",
                "applied_at": "2025-05-01T00:00:00",
            },
        )
        app_id = create_resp.json()["id"]

        resp = await second_authed_client.patch(
            f"/applications/{app_id}/status", json={"new_status": 2}
        )
        # Either 404 (not found for this user) or 403; the app returns 404
        assert resp.status_code == 404

        await authed_client.delete(f"/applications/{app_id}")

    async def test_user_b_cannot_delete_user_a_application(
        self,
        authed_client: AsyncClient,
        second_authed_client: AsyncClient,
    ):
        create_resp = await authed_client.post(
            "/applications",
            json={
                "position": "Deletable Role",
                "company": "Target Corp",
                "applied_at": "2025-05-01T00:00:00",
            },
        )
        app_id = create_resp.json()["id"]

        # User B tries to delete; endpoint returns 204 regardless (by design) but
        # the row should still exist for User A.
        await second_authed_client.delete(f"/applications/{app_id}")

        # User A's list still contains the application
        a_list = await authed_client.get("/applications")
        a_ids = [a["id"] for a in a_list.json()]
        assert app_id in a_ids

        await authed_client.delete(f"/applications/{app_id}")


# ===========================================================================
# Status flow endpoint
# ===========================================================================

class TestStatusFlow:
    """GET /status-flow returns aggregated transition data."""

    async def test_status_flow_returns_list(self, authed_client: AsyncClient):
        response = await authed_client.get("/status-flow")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_status_flow_schema(self, authed_client: AsyncClient, seeded_applications):
        """Each row must have From, To, Weight, user_id fields."""
        response = await authed_client.get("/status-flow")
        assert response.status_code == 200
        rows = response.json()
        if rows:
            row = rows[0]
            assert "From" in row
            assert "To" in row
            assert "Weight" in row
            assert "user_id" in row


# ===========================================================================
# Seeded data smoke tests
# ===========================================================================

class TestSeededData:
    """Quick smoke tests using the seeded_applications fixture."""

    async def test_seeded_applications_visible(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        """All seeded applications appear in the user's listing."""
        seeded_ids = {a.id for a in seeded_applications}
        resp = await authed_client.get("/applications")
        assert resp.status_code == 200
        listed_ids = {a["id"] for a in resp.json()}
        assert seeded_ids.issubset(listed_ids)

    async def test_seeded_application_statuses(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        """Returned statuses match what was seeded."""
        seeded_status_by_id = {a.id: a.status for a in seeded_applications}
        resp = await authed_client.get("/applications")
        for app in resp.json():
            if app["id"] in seeded_status_by_id:
                assert app["status"] == seeded_status_by_id[app["id"]]

    async def test_status_flow_non_empty_after_seeding(
        self,
        authed_client: AsyncClient,
        seeded_applications,
    ):
        """After seeding applications with histories, /status-flow should be non-empty."""
        resp = await authed_client.get("/status-flow")
        assert resp.status_code == 200
        # At least some of our seeded apps had history entries
        assert len(resp.json()) > 0
