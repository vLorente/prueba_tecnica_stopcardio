"""Tests para endpoints de solicitudes de vacaciones y ausencias."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.solicitud import Solicitud, SolicitudStatus, SolicitudTipo
from app.models.user import User
from app.repositories.user_repository import UserRepository


def get_today():
    """Helper to get timezone-aware today date."""
    return datetime.now(UTC).date()


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
async def employee_solicitud_pending(
    session: AsyncSession,
    employee_user: User,
) -> Solicitud:
    """Create a pending vacation request for employee."""
    today = get_today()
    solicitud = Solicitud(
        user_id=employee_user.id,
        tipo=SolicitudTipo.VACATION,
        fecha_inicio=today + timedelta(days=10),
        fecha_fin=today + timedelta(days=14),
        dias_solicitados=5,
        motivo="Vacaciones de verano planificadas",
        status=SolicitudStatus.PENDING,
    )
    session.add(solicitud)
    await session.commit()
    await session.refresh(solicitud)
    return solicitud


@pytest.fixture
async def employee_solicitud_approved(
    session: AsyncSession,
    employee_user: User,
    hr_user: User,
) -> Solicitud:
    """Create an approved vacation request for employee."""
    today = get_today()
    solicitud = Solicitud(
        user_id=employee_user.id,
        tipo=SolicitudTipo.VACATION,
        fecha_inicio=today + timedelta(days=30),
        fecha_fin=today + timedelta(days=34),
        dias_solicitados=5,
        motivo="Vacaciones navideñas aprobadas",
        status=SolicitudStatus.APPROVED,
        reviewed_by=hr_user.id,
        reviewed_at=datetime.now(UTC),
        comentarios_revision="Aprobado según planificación",
    )
    session.add(solicitud)
    await session.commit()
    await session.refresh(solicitud)
    return solicitud


@pytest.fixture
async def employee_solicitud_rejected(
    session: AsyncSession,
    employee_user: User,
    hr_user: User,
) -> Solicitud:
    """Create a rejected vacation request for employee."""
    today = get_today()
    solicitud = Solicitud(
        user_id=employee_user.id,
        tipo=SolicitudTipo.SICK_LEAVE,
        fecha_inicio=today - timedelta(days=5),
        fecha_fin=today - timedelta(days=3),
        dias_solicitados=3,
        motivo="Baja médica por gripe",
        status=SolicitudStatus.REJECTED,
        reviewed_by=hr_user.id,
        reviewed_at=datetime.now(UTC),
        comentarios_revision="Falta documentación médica",
    )
    session.add(solicitud)
    await session.commit()
    await session.refresh(solicitud)
    return solicitud


@pytest.fixture
async def other_employee_solicitud(
    session: AsyncSession,
    hr_user: User,
) -> Solicitud:
    """Create a solicitud for a different employee."""
    today = get_today()
    solicitud = Solicitud(
        user_id=hr_user.id,
        tipo=SolicitudTipo.PERSONAL,
        fecha_inicio=today + timedelta(days=20),
        fecha_fin=today + timedelta(days=20),
        dias_solicitados=1,
        motivo="Asunto personal urgente que requiere atención",
        status=SolicitudStatus.PENDING,
    )
    session.add(solicitud)
    await session.commit()
    await session.refresh(solicitud)
    return solicitud


# ============================================================================
# TEST CLASSES
# ============================================================================


class TestCreateSolicitud:
    """Tests para POST /api/vacaciones/ - Crear solicitud."""

    async def test_create_solicitud_vacation_success(
        self,
        authenticated_client: AsyncClient,
        employee_user: User,
    ):
        """TC-V01: Crear solicitud de vacaciones exitosamente."""
        today = get_today()
        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(today + timedelta(days=15)),
                "fecha_fin": str(today + timedelta(days=19)),
                "motivo": "Vacaciones de verano para descansar",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["user_id"] == employee_user.id
        assert data["tipo"] == "vacation"
        assert data["dias_solicitados"] >= 1  # Al menos 1 día hábil
        assert data["status"] == "pending"
        assert data["is_pending"] is True

    async def test_create_solicitud_sick_leave_success(
        self,
        authenticated_client: AsyncClient,
    ):
        """TC-V02: Crear solicitud de baja médica exitosamente."""
        today = get_today()
        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "sick_leave",
                "fecha_inicio": str(today),
                "fecha_fin": str(today + timedelta(days=2)),
                "motivo": "Baja médica por enfermedad común",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["tipo"] == "sick_leave"
        assert data["status"] == "pending"

    async def test_create_solicitud_short_motivo(
        self,
        authenticated_client: AsyncClient,
    ):
        """TC-V03: Rechazar solicitud con motivo demasiado corto."""
        today = get_today()
        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(today + timedelta(days=10)),
                "fecha_fin": str(today + timedelta(days=12)),
                "motivo": "Corto",  # Menos de 10 caracteres
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_create_solicitud_invalid_dates(
        self,
        authenticated_client: AsyncClient,
    ):
        """TC-V04: Rechazar solicitud con fecha_fin anterior a fecha_inicio."""
        today = get_today()
        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(today + timedelta(days=15)),
                "fecha_fin": str(today + timedelta(days=10)),  # Anterior a inicio
                "motivo": "Esto no debería funcionar correctamente",
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_create_solicitud_past_date(
        self,
        authenticated_client: AsyncClient,
    ):
        """TC-V05: Rechazar solicitud con fecha de inicio en el pasado."""
        today = get_today()
        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(today - timedelta(days=5)),
                "fecha_fin": str(today - timedelta(days=3)),
                "motivo": "Solicitud retroactiva que no debería permitirse",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "fecha de inicio debe ser hoy o posterior" in response.json()["detail"].lower()

    async def test_create_solicitud_insufficient_balance(
        self,
        authenticated_client: AsyncClient,
        employee_user: User,
        session: AsyncSession,
    ):
        """TC-V06: Rechazar solicitud de vacaciones sin balance suficiente."""
        # Reducir balance disponible
        employee_user.dias_vacaciones_disponibles = 2.0
        session.add(employee_user)
        await session.commit()

        today = get_today()
        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(today + timedelta(days=10)),
                "fecha_fin": str(today + timedelta(days=14)),  # 5 días
                "motivo": "Necesito más días de los disponibles",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "balance insuficiente" in response.json()["detail"].lower()

    async def test_create_solicitud_date_conflict(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_approved: Solicitud,
    ):
        """TC-V07: Rechazar solicitud con conflicto de fechas aprobadas."""
        # Intentar crear solicitud que solape con una aprobada
        solicitud_aprobada = employee_solicitud_approved
        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(solicitud_aprobada.fecha_inicio),
                "fecha_fin": str(solicitud_aprobada.fecha_fin + timedelta(days=2)),
                "motivo": "Esta solicitud solapa con una ya aprobada",
            },
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "solapa" in response.json()["detail"].lower()

    async def test_create_solicitud_conflict_with_pending(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
    ):
        """TC-V07b: Rechazar solicitud con conflicto de fechas pendientes."""
        # Intentar crear solicitud que solape con una pendiente
        solicitud_pendiente = employee_solicitud_pending
        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(solicitud_pendiente.fecha_inicio + timedelta(days=1)),
                "fecha_fin": str(solicitud_pendiente.fecha_fin + timedelta(days=3)),
                "motivo": "Esta solicitud solapa con una solicitud pendiente de aprobación",
            },
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "solapa" in response.json()["detail"].lower()

    async def test_create_solicitud_only_weekends(
        self,
        authenticated_client: AsyncClient,
    ):
        """TC-V08: Rechazar solicitud que solo incluye fines de semana."""
        # Encontrar próximo sábado
        today = get_today()
        days_until_saturday = (5 - today.weekday()) % 7
        if days_until_saturday == 0:
            days_until_saturday = 7
        next_saturday = today + timedelta(days=days_until_saturday)
        next_sunday = next_saturday + timedelta(days=1)

        response = await authenticated_client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(next_saturday),
                "fecha_fin": str(next_sunday),
                "motivo": "Solo fin de semana sin días hábiles",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "al menos un día hábil" in response.json()["detail"].lower()

    async def test_create_solicitud_unauthorized(self, client: AsyncClient):
        """TC-V09: Rechazar creación sin autenticación."""
        today = get_today()
        response = await client.post(
            "/api/vacaciones/",
            json={
                "tipo": "vacation",
                "fecha_inicio": str(today + timedelta(days=10)),
                "fecha_fin": str(today + timedelta(days=12)),
                "motivo": "Solicitud sin autenticación",
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestListSolicitudes:
    """Tests para GET /api/vacaciones/me - Listar solicitudes propias."""

    async def test_list_my_solicitudes_empty(
        self,
        authenticated_client: AsyncClient,
    ):
        """TC-V10: Listar solicitudes cuando no hay ninguna."""
        response = await authenticated_client.get("/api/vacaciones/me")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0
        assert len(data["solicitudes"]) == 0

    async def test_list_my_solicitudes_with_data(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
        employee_solicitud_approved: Solicitud,
    ):
        """TC-V11: Listar solicitudes propias exitosamente."""
        response = await authenticated_client.get("/api/vacaciones/me")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 2
        assert len(data["solicitudes"]) == 2

    async def test_list_my_solicitudes_filter_by_status(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
        employee_solicitud_approved: Solicitud,
    ):
        """TC-V12: Filtrar solicitudes por estado."""
        response = await authenticated_client.get(
            "/api/vacaciones/me",
            params={"status": "pending"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert data["solicitudes"][0]["status"] == "pending"

    async def test_list_my_solicitudes_filter_by_tipo(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
        employee_solicitud_rejected: Solicitud,
    ):
        """TC-V13: Filtrar solicitudes por tipo."""
        response = await authenticated_client.get(
            "/api/vacaciones/me",
            params={"tipo": "vacation"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(s["tipo"] == "vacation" for s in data["solicitudes"])

    async def test_list_my_solicitudes_pagination(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
        employee_solicitud_approved: Solicitud,
    ):
        """TC-V14: Paginación de solicitudes."""
        response = await authenticated_client.get(
            "/api/vacaciones/me",
            params={"skip": 0, "limit": 1},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 2
        assert len(data["solicitudes"]) == 1
        assert data["skip"] == 0
        assert data["limit"] == 1


class TestGetSolicitud:
    """Tests para GET /api/vacaciones/{id} - Obtener solicitud por ID."""

    async def test_get_solicitud_by_id_success(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
    ):
        """TC-V15: Obtener solicitud propia por ID."""
        response = await authenticated_client.get(
            f"/api/vacaciones/{employee_solicitud_pending.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == employee_solicitud_pending.id
        assert data["tipo"] == employee_solicitud_pending.tipo.value

    async def test_get_non_existent_solicitud(
        self,
        authenticated_client: AsyncClient,
    ):
        """TC-V16: Error al obtener solicitud inexistente."""
        response = await authenticated_client.get("/api/vacaciones/99999")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_employee_cannot_view_other_solicitud(
        self,
        authenticated_client: AsyncClient,
        other_employee_solicitud: Solicitud,
    ):
        """TC-V17: Empleado no puede ver solicitudes de otros."""
        response = await authenticated_client.get(f"/api/vacaciones/{other_employee_solicitud.id}")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_hr_can_view_any_solicitud(
        self,
        hr_authenticated_client: AsyncClient,
        other_employee_solicitud: Solicitud,
    ):
        """TC-V18: HR puede ver cualquier solicitud."""
        response = await hr_authenticated_client.get(
            f"/api/vacaciones/{other_employee_solicitud.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == other_employee_solicitud.id


class TestUpdateSolicitud:
    """Tests para PUT /api/vacaciones/{id} - Actualizar solicitud."""

    async def test_update_solicitud_success(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
    ):
        """TC-V19: Actualizar solicitud pendiente exitosamente."""
        response = await authenticated_client.put(
            f"/api/vacaciones/{employee_solicitud_pending.id}",
            json={
                "motivo": "Motivo actualizado con más detalles para la solicitud",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "actualizado" in data["motivo"].lower()

    async def test_update_solicitud_dates(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
    ):
        """TC-V20: Actualizar fechas de solicitud pendiente."""
        # Encontrar próximo lunes para garantizar fechas predecibles
        today = get_today()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        next_monday = today + timedelta(days=days_until_monday + 14)  # Lunes en 2+ semanas

        # Lunes a Jueves = 4 días hábiles
        fecha_inicio = next_monday
        fecha_fin = next_monday + timedelta(days=3)  # Lunes + 3 = Jueves
        expected_days = 4

        response = await authenticated_client.put(
            f"/api/vacaciones/{employee_solicitud_pending.id}",
            json={
                "fecha_inicio": str(fecha_inicio),
                "fecha_fin": str(fecha_fin),
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["dias_solicitados"] == expected_days  # Recalculado

    async def test_update_solicitud_already_approved(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_approved: Solicitud,
    ):
        """TC-V21: No se puede actualizar solicitud aprobada."""
        response = await authenticated_client.put(
            f"/api/vacaciones/{employee_solicitud_approved.id}",
            json={
                "motivo": "Intentando actualizar solicitud ya aprobada",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_update_solicitud_other_user(
        self,
        authenticated_client: AsyncClient,
        other_employee_solicitud: Solicitud,
    ):
        """TC-V22: No se puede actualizar solicitud de otro usuario."""
        response = await authenticated_client.put(
            f"/api/vacaciones/{other_employee_solicitud.id}",
            json={
                "motivo": "Intentando actualizar solicitud de otro empleado",
            },
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_update_solicitud_invalid_dates(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
    ):
        """TC-V23: Rechazar actualización con fechas inválidas."""
        today = get_today()
        response = await authenticated_client.put(
            f"/api/vacaciones/{employee_solicitud_pending.id}",
            json={
                "fecha_inicio": str(today + timedelta(days=20)),
                "fecha_fin": str(today + timedelta(days=15)),  # Anterior a inicio
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestCancelSolicitud:
    """Tests para POST /api/vacaciones/{id}/cancel - Cancelar solicitud."""

    async def test_cancel_solicitud_success(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
    ):
        """TC-V24: Cancelar solicitud pendiente exitosamente."""
        response = await authenticated_client.post(
            f"/api/vacaciones/{employee_solicitud_pending.id}/cancel"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "cancelled"

    async def test_cancel_solicitud_already_approved(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_approved: Solicitud,
    ):
        """TC-V25: No se puede cancelar solicitud aprobada."""
        response = await authenticated_client.post(
            f"/api/vacaciones/{employee_solicitud_approved.id}/cancel"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_cancel_solicitud_other_user(
        self,
        authenticated_client: AsyncClient,
        other_employee_solicitud: Solicitud,
    ):
        """TC-V26: No se puede cancelar solicitud de otro usuario."""
        response = await authenticated_client.post(
            f"/api/vacaciones/{other_employee_solicitud.id}/cancel"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestReviewSolicitud:
    """Tests para POST /api/vacaciones/{id}/review - Revisar solicitud (HR)."""

    async def test_hr_approve_solicitud(
        self,
        hr_authenticated_client: AsyncClient,
        other_employee_solicitud: Solicitud,
        session: AsyncSession,
    ):
        """TC-V27: HR aprueba solicitud exitosamente."""
        # Obtener usuario antes para verificar balance
        user_repo = UserRepository(session)
        user_before = await user_repo.get_by_id(other_employee_solicitud.user_id)
        balance_before = user_before.dias_vacaciones_disponibles if user_before else 0

        response = await hr_authenticated_client.post(
            f"/api/vacaciones/{other_employee_solicitud.id}/review",
            json={
                "approved": True,
                "comentarios_revision": "Solicitud aprobada según calendario",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "approved"
        assert data["reviewed_by"] is not None
        assert data["reviewed_at"] is not None

        # Verificar que se descontó del balance si era VACATION
        if other_employee_solicitud.tipo == SolicitudTipo.VACATION:
            await session.refresh(user_before)
            assert user_before.dias_vacaciones_disponibles < balance_before

    async def test_hr_reject_solicitud(
        self,
        hr_authenticated_client: AsyncClient,
        other_employee_solicitud: Solicitud,
    ):
        """TC-V28: HR rechaza solicitud exitosamente."""
        response = await hr_authenticated_client.post(
            f"/api/vacaciones/{other_employee_solicitud.id}/review",
            json={
                "approved": False,
                "comentarios_revision": "Conflicto con proyecto crítico",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "rejected"
        assert "conflicto" in data["comentarios_revision"].lower()

    async def test_employee_cannot_review(
        self,
        authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
    ):
        """TC-V29: Empleado no puede revisar solicitudes."""
        response = await authenticated_client.post(
            f"/api/vacaciones/{employee_solicitud_pending.id}/review",
            json={
                "approved": True,
                "comentarios_revision": "Intentando auto-aprobar",
            },
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_review_non_pending_solicitud(
        self,
        hr_authenticated_client: AsyncClient,
        employee_solicitud_approved: Solicitud,
    ):
        """TC-V30: No se puede revisar solicitud ya revisada."""
        response = await hr_authenticated_client.post(
            f"/api/vacaciones/{employee_solicitud_approved.id}/review",
            json={
                "approved": False,
                "comentarios_revision": "Intentando cambiar decisión",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestVacationBalance:
    """Tests para balance de vacaciones."""

    async def test_get_my_balance(
        self,
        authenticated_client: AsyncClient,
        employee_user: User,
    ):
        """TC-V31: Obtener balance propio de vacaciones."""
        response = await authenticated_client.get("/api/vacaciones/me/balance")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == employee_user.id
        assert "dias_anuales" in data
        assert "dias_disponibles" in data
        assert "dias_tomados" in data
        assert "dias_pendientes" in data

    async def test_hr_get_user_balance(
        self,
        hr_authenticated_client: AsyncClient,
        employee_user: User,
    ):
        """TC-V32: HR obtiene balance de cualquier usuario."""
        response = await hr_authenticated_client.get(f"/api/vacaciones/balance/{employee_user.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == employee_user.id

    async def test_employee_cannot_get_other_balance(
        self,
        authenticated_client: AsyncClient,
        hr_user: User,
    ):
        """TC-V33: Empleado no puede ver balance de otros."""
        response = await authenticated_client.get(f"/api/vacaciones/balance/{hr_user.id}")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_balance_after_approval(
        self,
        hr_authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
        employee_user: User,
        session: AsyncSession,
    ):
        """TC-V34: Balance se actualiza correctamente tras aprobación."""
        # Obtener balance inicial
        balance_response = await hr_authenticated_client.get(
            f"/api/vacaciones/balance/{employee_user.id}"
        )
        balance_before = balance_response.json()["dias_disponibles"]

        # Aprobar solicitud VACATION
        if employee_solicitud_pending.tipo == SolicitudTipo.VACATION:
            await hr_authenticated_client.post(
                f"/api/vacaciones/{employee_solicitud_pending.id}/review",
                json={"approved": True},
            )

            # Verificar balance actualizado
            balance_response = await hr_authenticated_client.get(
                f"/api/vacaciones/balance/{employee_user.id}"
            )
            balance_after = balance_response.json()["dias_disponibles"]

            assert balance_after == balance_before - employee_solicitud_pending.dias_solicitados

    async def test_balance_after_rejection(
        self,
        hr_authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
        employee_user: User,
    ):
        """TC-V35: Balance no cambia tras rechazo."""
        # Obtener balance inicial
        balance_response = await hr_authenticated_client.get(
            f"/api/vacaciones/balance/{employee_user.id}"
        )
        balance_before = balance_response.json()["dias_disponibles"]

        # Rechazar solicitud
        await hr_authenticated_client.post(
            f"/api/vacaciones/{employee_solicitud_pending.id}/review",
            json={"approved": False, "comentarios_revision": "No aprobado"},
        )

        # Verificar que balance no cambió
        balance_response = await hr_authenticated_client.get(
            f"/api/vacaciones/balance/{employee_user.id}"
        )
        balance_after = balance_response.json()["dias_disponibles"]

        assert balance_after == balance_before


class TestHRListSolicitudes:
    """Tests para GET /api/vacaciones/ - Listar todas (HR)."""

    async def test_hr_list_all_solicitudes(
        self,
        hr_authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
        other_employee_solicitud: Solicitud,
    ):
        """TC-V36: HR lista todas las solicitudes."""
        response = await hr_authenticated_client.get("/api/vacaciones/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 2

    async def test_employee_cannot_list_all(
        self,
        authenticated_client: AsyncClient,
    ):
        """TC-V37: Empleado no puede listar todas las solicitudes."""
        response = await authenticated_client.get("/api/vacaciones/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_hr_list_pending_solicitudes(
        self,
        hr_authenticated_client: AsyncClient,
        employee_solicitud_pending: Solicitud,
        other_employee_solicitud: Solicitud,
    ):
        """TC-V38: HR lista solo solicitudes pendientes."""
        response = await hr_authenticated_client.get("/api/vacaciones/pending")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(s["status"] == "pending" for s in data["solicitudes"])

    async def test_hr_filter_by_user(
        self,
        hr_authenticated_client: AsyncClient,
        employee_user: User,
        employee_solicitud_pending: Solicitud,
    ):
        """TC-V39: HR filtra solicitudes por usuario."""
        response = await hr_authenticated_client.get(
            "/api/vacaciones/",
            params={"user_id": employee_user.id},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(s["user_id"] == employee_user.id for s in data["solicitudes"])
