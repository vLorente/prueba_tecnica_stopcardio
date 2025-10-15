"""Tests for fichajes (time tracking) endpoints."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fichaje import Fichaje, FichajeStatus
from app.models.user import User

# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
async def employee_fichaje(session: AsyncSession, employee_user: User) -> Fichaje:
    """Create a completed fichaje for employee."""
    fichaje = Fichaje(
        user_id=employee_user.id,
        check_in=datetime.now(UTC) - timedelta(hours=8),
        check_out=datetime.now(UTC),
        status=FichajeStatus.VALID,
    )
    session.add(fichaje)
    await session.commit()
    await session.refresh(fichaje)
    return fichaje


@pytest.fixture
async def active_fichaje(session: AsyncSession, employee_user: User) -> Fichaje:
    """Create an active fichaje (without check-out) for employee."""
    fichaje = Fichaje(
        user_id=employee_user.id,
        check_in=datetime.now(UTC) - timedelta(hours=2),
        status=FichajeStatus.VALID,
    )
    session.add(fichaje)
    await session.commit()
    await session.refresh(fichaje)
    return fichaje


@pytest.fixture
async def pending_fichaje(session: AsyncSession, employee_user: User) -> Fichaje:
    """Create a fichaje pending correction."""
    fichaje = Fichaje(
        user_id=employee_user.id,
        check_in=datetime.now(UTC) - timedelta(hours=8),
        check_out=datetime.now(UTC),
        status=FichajeStatus.PENDING_CORRECTION,
        correction_reason="Olvidé fichar a la hora correcta",
        correction_requested_at=datetime.now(UTC),
    )
    session.add(fichaje)
    await session.commit()
    await session.refresh(fichaje)
    return fichaje


# ============================================================================
# TEST CLASSES
# ============================================================================


class TestCheckIn:
    """Tests for POST /api/fichajes/check-in endpoint."""

    async def test_check_in_success(self, authenticated_client: AsyncClient, employee_user: User):
        """TC-F01: Employee performs check-in without active fichaje."""
        response = await authenticated_client.post(
            "/api/fichajes/check-in",
            json={"notes": "Inicio de jornada"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["user_id"] == employee_user.id
        assert data["check_out"] is None
        assert data["status"] == "valid"
        assert data["notes"] == "Inicio de jornada"
        assert "check_in" in data
        assert "id" in data

    async def test_check_in_with_active_fichaje(
        self, authenticated_client: AsyncClient, active_fichaje: Fichaje
    ):
        """TC-F10: Error when trying check-in with existing active fichaje."""
        response = await authenticated_client.post(
            "/api/fichajes/check-in",
            json={},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "activo" in data["detail"].lower()


class TestCheckOut:
    """Tests for POST /api/fichajes/check-out endpoint."""

    async def test_check_out_success(
        self, authenticated_client: AsyncClient, active_fichaje: Fichaje
    ):
        """TC-F02: Employee performs check-out with active fichaje."""
        response = await authenticated_client.post(
            "/api/fichajes/check-out",
            json={"notes": "Fin de jornada"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == active_fichaje.id
        assert data["check_out"] is not None
        assert data["hours_worked"] is not None
        assert data["hours_worked"] > 0
        assert data["notes"] == "Fin de jornada"

    async def test_check_out_without_active_fichaje(self, authenticated_client: AsyncClient):
        """TC-F11: Error when trying check-out without active fichaje."""
        response = await authenticated_client.post(
            "/api/fichajes/check-out",
            json={},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "activo" in data["detail"].lower()


class TestListFichajes:
    """Tests for GET /api/fichajes endpoints."""

    async def test_list_my_fichajes(
        self, authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """TC-F06: Employee lists their own fichajes."""
        response = await authenticated_client.get("/api/fichajes/me")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "fichajes" in data
        assert "total" in data
        assert data["total"] >= 1
        assert len(data["fichajes"]) >= 1
        assert data["fichajes"][0]["user_id"] == employee_fichaje.user_id

    async def test_list_my_fichajes_with_filters(
        self, authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """TC-F06: Employee lists fichajes with date filters."""
        date_from = (datetime.now(UTC) - timedelta(days=1)).date().isoformat()
        date_to = (datetime.now(UTC) + timedelta(days=1)).date().isoformat()

        response = await authenticated_client.get(
            f"/api/fichajes/me?date_from={date_from}&date_to={date_to}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1

    async def test_hr_list_all_fichajes(
        self, hr_authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """TC-F07: HR lists all fichajes."""
        response = await hr_authenticated_client.get("/api/fichajes/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "fichajes" in data
        assert "total" in data

    async def test_employee_cannot_list_all(self, authenticated_client: AsyncClient):
        """TC-F18: Employee cannot list all fichajes."""
        response = await authenticated_client.get("/api/fichajes/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "hr" in data["detail"].lower() or "permiso" in data["detail"].lower()


class TestRequestCorrection:
    """Tests for POST /api/fichajes/{id}/correct endpoint."""

    async def test_request_correction_success(
        self, authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """TC-F03: Employee requests correction for their fichaje."""
        new_check_in = (employee_fichaje.check_in + timedelta(minutes=30)).isoformat()
        new_check_out = (employee_fichaje.check_out + timedelta(minutes=30)).isoformat()

        response = await authenticated_client.post(
            f"/api/fichajes/{employee_fichaje.id}/correct",
            json={
                "check_in": new_check_in,
                "check_out": new_check_out,
                "correction_reason": "Olvidé fichar a la hora correcta, llegué 30 minutos después",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "pending_correction"
        assert data["correction_reason"] is not None

    async def test_request_correction_short_reason(
        self, authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """TC-F17: Validation error with short correction reason."""
        new_check_in = (employee_fichaje.check_in + timedelta(minutes=30)).isoformat()
        new_check_out = (employee_fichaje.check_out + timedelta(minutes=30)).isoformat()

        response = await authenticated_client.post(
            f"/api/fichajes/{employee_fichaje.id}/correct",
            json={
                "check_in": new_check_in,
                "check_out": new_check_out,
                "correction_reason": "corto",  # Less than 10 characters
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_request_correction_other_user(
        self, hr_authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """TC-F12: Error when trying to correct another user's fichaje."""
        new_check_in = (employee_fichaje.check_in + timedelta(minutes=30)).isoformat()
        new_check_out = (employee_fichaje.check_out + timedelta(minutes=30)).isoformat()

        response = await hr_authenticated_client.post(
            f"/api/fichajes/{employee_fichaje.id}/correct",
            json={
                "check_in": new_check_in,
                "check_out": new_check_out,
                "correction_reason": "Intentando corregir fichaje ajeno",
            },
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_request_correction_invalid_times(
        self, authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """TC-F16: Error when check-out is before check-in."""
        new_check_in = employee_fichaje.check_in.isoformat()
        new_check_out = (employee_fichaje.check_in - timedelta(hours=1)).isoformat()

        response = await authenticated_client.post(
            f"/api/fichajes/{employee_fichaje.id}/correct",
            json={
                "check_in": new_check_in,
                "check_out": new_check_out,
                "correction_reason": "Horarios incorrectos a propósito",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "posterior" in data["detail"].lower() or "después" in data["detail"].lower()


class TestApproveCorrection:
    """Tests for POST /api/fichajes/{id}/approve endpoint."""

    async def test_hr_approve_correction(
        self, hr_authenticated_client: AsyncClient, pending_fichaje: Fichaje
    ):
        """TC-F04: HR approves a correction."""
        response = await hr_authenticated_client.post(
            f"/api/fichajes/{pending_fichaje.id}/approve",
            json={
                "approved": True,
                "notes": "Corrección aprobada",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "corrected"
        assert data["approved_by"] is not None
        assert data["approved_at"] is not None

    async def test_hr_reject_correction(
        self, hr_authenticated_client: AsyncClient, pending_fichaje: Fichaje
    ):
        """TC-F05: HR rejects a correction."""
        response = await hr_authenticated_client.post(
            f"/api/fichajes/{pending_fichaje.id}/approve",
            json={
                "approved": False,
                "notes": "Corrección rechazada: datos incorrectos",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "rejected"
        assert data["approved_by"] is not None
        assert data["approved_at"] is not None

    async def test_employee_cannot_approve(
        self, authenticated_client: AsyncClient, pending_fichaje: Fichaje
    ):
        """TC-F13: Employee cannot approve corrections."""
        response = await authenticated_client.post(
            f"/api/fichajes/{pending_fichaje.id}/approve",
            json={
                "approved": True,
                "notes": "Intento de aprobación",
            },
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_approve_non_pending_fichaje(
        self, hr_authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """TC-F14: Error when approving fichaje that is not pending."""
        response = await hr_authenticated_client.post(
            f"/api/fichajes/{employee_fichaje.id}/approve",
            json={
                "approved": True,
                "notes": "Intento de aprobación",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "pendiente" in data["detail"].lower()


class TestGetFichaje:
    """Tests for GET /api/fichajes/{id} and related endpoints."""

    async def test_get_fichaje_by_id(
        self, authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """Employee retrieves their fichaje by ID."""
        response = await authenticated_client.get(f"/api/fichajes/{employee_fichaje.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == employee_fichaje.id
        assert data["user_id"] == employee_fichaje.user_id

    async def test_get_non_existent_fichaje(self, authenticated_client: AsyncClient):
        """TC-F19: Error when fetching non-existent fichaje."""
        response = await authenticated_client.get("/api/fichajes/99999")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_employee_cannot_view_other_fichaje(
        self,
        authenticated_client: AsyncClient,
        session: AsyncSession,
        hr_user: User,
    ):
        """Employee cannot view another user's fichaje."""
        # Create HR's fichaje
        hr_fichaje = Fichaje(
            user_id=hr_user.id,
            check_in=datetime.now(UTC) - timedelta(hours=8),
            check_out=datetime.now(UTC),
            status=FichajeStatus.VALID,
        )
        session.add(hr_fichaje)
        await session.commit()
        await session.refresh(hr_fichaje)

        # Try to access as employee
        response = await authenticated_client.get(f"/api/fichajes/{hr_fichaje.id}")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_hr_can_view_any_fichaje(
        self, hr_authenticated_client: AsyncClient, employee_fichaje: Fichaje
    ):
        """HR can view any user's fichaje."""
        response = await hr_authenticated_client.get(f"/api/fichajes/{employee_fichaje.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == employee_fichaje.id


class TestActiveFichaje:
    """Tests for GET /api/fichajes/me/active endpoint."""

    async def test_get_active_fichaje(
        self, authenticated_client: AsyncClient, active_fichaje: Fichaje
    ):
        """Employee retrieves their active fichaje."""
        response = await authenticated_client.get("/api/fichajes/me/active")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == active_fichaje.id
        assert data["check_out"] is None

    async def test_get_active_fichaje_none(self, authenticated_client: AsyncClient):
        """Error when employee has no active fichaje."""
        response = await authenticated_client.get("/api/fichajes/me/active")

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestFichajeStats:
    """Tests for GET /api/fichajes/stats endpoints."""

    async def test_get_my_stats(self, authenticated_client: AsyncClient, employee_fichaje: Fichaje):
        """TC-F08: Employee retrieves their own statistics."""
        response = await authenticated_client.get("/api/fichajes/me/stats")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_fichajes" in data
        assert "fichajes_completos" in data
        assert "fichajes_incompletos" in data
        assert "pending_corrections" in data
        assert "total_hours" in data
        assert data["total_fichajes"] >= 1

    async def test_hr_get_employee_stats(
        self,
        hr_authenticated_client: AsyncClient,
        employee_user: User,
        employee_fichaje: Fichaje,
    ):
        """TC-F09: HR retrieves employee statistics."""
        response = await hr_authenticated_client.get(
            f"/api/fichajes/stats/general?user_id={employee_user.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_fichajes" in data
        assert data["total_fichajes"] >= 1
