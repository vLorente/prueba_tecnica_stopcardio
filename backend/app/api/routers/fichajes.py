"""Router para endpoints de fichajes (entradas/salidas)."""

from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies.auth import CurrentHR, CurrentUser
from app.core.exceptions import NotFoundException
from app.database import get_session
from app.models.fichaje import Fichaje, FichajeStatus
from app.models.user import User
from app.repositories.fichaje_repository import FichajeRepository
from app.repositories.user_repository import UserRepository
from app.schemas.fichaje import (
    FichajeApproval,
    FichajeCheckIn,
    FichajeCheckOut,
    FichajeCorrection,
    FichajeFilters,
    FichajeListResponse,
    FichajeResponse,
    FichajeStats,
)
from app.services.fichaje_service import FichajeService

router = APIRouter(tags=["Fichajes"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def _build_fichaje_response(fichaje: Fichaje, user: User | None = None) -> FichajeResponse:
    """Construye una respuesta de fichaje con todos los campos.

    Args:
        fichaje: Instancia de Fichaje con relaciones cargadas.
        user: Usuario opcional para sobrescribir email y nombre.

    Returns:
        FichajeResponse con todos los campos.
    """
    user_email = user.email if user else (fichaje.user.email if fichaje.user else "")
    user_full_name = user.full_name if user else (fichaje.user.full_name if fichaje.user else "")

    return FichajeResponse(
        id=fichaje.id,  # type: ignore
        user_id=fichaje.user_id,
        user_email=user_email,
        user_full_name=user_full_name,
        check_in=fichaje.check_in,
        check_out=fichaje.check_out,
        hours_worked=fichaje.hours_worked,
        status=fichaje.status,
        notes=fichaje.notes,
        correction_reason=fichaje.correction_reason,
        correction_requested_at=fichaje.correction_requested_at,
        proposed_check_in=fichaje.proposed_check_in,
        proposed_check_out=fichaje.proposed_check_out,
        approved_by=fichaje.approved_by,
        approved_at=fichaje.approved_at,
        approval_notes=fichaje.approval_notes,
        created_at=fichaje.created_at,  # type: ignore
        updated_at=fichaje.updated_at,  # type: ignore
    )


def _date_to_datetime(d: date | None) -> datetime | None:
    """Convierte date a datetime (inicio del día en UTC)."""
    if d is None:
        return None
    return datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=UTC)


def _date_to_datetime_end(d: date | None) -> datetime | None:
    """Convierte date a datetime (fin del día en UTC)."""
    if d is None:
        return None
    return datetime(d.year, d.month, d.day, 23, 59, 59, tzinfo=UTC)


def get_fichaje_service(session: SessionDep) -> FichajeService:
    """Dependency para obtener el service de fichajes."""
    fichaje_repo = FichajeRepository(session)
    user_repo = UserRepository(session)
    return FichajeService(fichaje_repo, user_repo)


FichajeServiceDep = Annotated[FichajeService, Depends(get_fichaje_service)]


@router.post(
    "/check-in",
    response_model=FichajeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar entrada (check-in)",
    description="Registra la entrada del usuario actual. No puede tener otro check-in activo.",
)
async def check_in(
    data: FichajeCheckIn,
    current_user: CurrentUser,
    fichaje_service: FichajeServiceDep,
) -> FichajeResponse:
    """Registra check-in del usuario actual."""
    fichaje = await fichaje_service.check_in(
        user_id=current_user.id,  # type: ignore
        notes=data.notes,
    )

    return _build_fichaje_response(fichaje, current_user)


@router.post(
    "/check-out",
    response_model=FichajeResponse,
    status_code=status.HTTP_200_OK,
    summary="Registrar salida (check-out)",
    description="Registra la salida del usuario actual. Debe tener un check-in activo.",
)
async def check_out(
    data: FichajeCheckOut,
    current_user: CurrentUser,
    fichaje_service: FichajeServiceDep,
) -> FichajeResponse:
    """Registra check-out del usuario actual."""
    fichaje = await fichaje_service.check_out(
        user_id=current_user.id,  # type: ignore
        notes=data.notes,
    )

    return _build_fichaje_response(fichaje, current_user)


@router.get(
    "/",
    response_model=FichajeListResponse,
    summary="Listar todos los fichajes (solo HR)",
    description="Lista todos los fichajes con filtros. Solo accesible para usuarios HR.",
)
async def list_fichajes(
    fichaje_service: FichajeServiceDep,
    current_hr: CurrentHR,
    skip: int = Query(default=0, ge=0, description="Registros a saltar"),
    limit: int = Query(default=10, ge=1, le=100, description="Límite de registros"),
    user_id: int | None = Query(default=None, description="Filtrar por usuario"),
    date_from: date | None = Query(default=None, description="Fecha desde"),
    date_to: date | None = Query(default=None, description="Fecha hasta"),
    status: str | None = Query(default=None, description="Filtrar por estado"),
    incomplete_only: bool = Query(default=False, description="Solo fichajes sin check-out"),
) -> FichajeListResponse:
    """Lista todos los fichajes con filtros (solo HR)."""
    filters = FichajeFilters(
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        status=FichajeStatus(status) if status else None,
        incomplete_only=incomplete_only,
    )

    fichajes, total, total_hours = await fichaje_service.get_all(
        filters=filters,
        skip=skip,
        limit=limit,
        current_user=current_hr,
    )

    # Convertir a responses
    fichaje_responses = [_build_fichaje_response(f) for f in fichajes]

    page = (skip // limit) + 1 if limit > 0 else 1

    return FichajeListResponse(
        fichajes=fichaje_responses,
        total=total,
        page=page,
        page_size=limit,
        total_hours=total_hours,
    )


@router.get(
    "/me",
    response_model=FichajeListResponse,
    summary="Mis fichajes",
    description="Obtiene los fichajes del usuario actual.",
)
async def get_my_fichajes(
    fichaje_service: FichajeServiceDep,
    current_user: CurrentUser,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
) -> FichajeListResponse:
    """Obtiene fichajes del usuario actual."""
    fichajes, total, total_hours = await fichaje_service.get_my_fichajes(
        user_id=current_user.id,  # type: ignore
        date_from=_date_to_datetime(date_from),
        date_to=_date_to_datetime_end(date_to),
        skip=skip,
        limit=limit,
    )

    fichaje_responses = [_build_fichaje_response(f, current_user) for f in fichajes]

    page = (skip // limit) + 1 if limit > 0 else 1

    return FichajeListResponse(
        fichajes=fichaje_responses,
        total=total,
        page=page,
        page_size=limit,
        total_hours=total_hours,
    )


@router.get(
    "/me/active",
    response_model=FichajeResponse,
    summary="Mi fichaje activo",
    description="Obtiene el fichaje activo (sin check-out) del usuario actual.",
)
async def get_my_active_fichaje(
    fichaje_service: FichajeServiceDep,
    current_user: CurrentUser,
) -> FichajeResponse:
    """Obtiene el fichaje activo del usuario actual."""
    fichaje_repo = FichajeRepository(fichaje_service.fichaje_repo.session)
    fichaje = await fichaje_repo.get_active_checkin(current_user.id)  # type: ignore

    if not fichaje:
        raise NotFoundException(
            message="No tienes fichaje activo",
            details={"user_id": current_user.id},
        )

    return _build_fichaje_response(fichaje, current_user)


@router.get(
    "/me/stats",
    response_model=FichajeStats,
    summary="Mis estadísticas",
    description="Obtiene estadísticas de fichajes del usuario actual.",
)
async def get_my_stats(
    fichaje_service: FichajeServiceDep,
    current_user: CurrentUser,
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
) -> FichajeStats:
    """Obtiene estadísticas del usuario actual."""
    return await fichaje_service.get_stats(
        user_id=current_user.id,  # type: ignore
        date_from=_date_to_datetime(date_from),
        date_to=_date_to_datetime_end(date_to),
        current_user=current_user,
    )


@router.get(
    "/{fichaje_id}",
    response_model=FichajeResponse,
    summary="Obtener fichaje por ID",
    description="Obtiene un fichaje específico. HR puede ver cualquiera, empleados solo los suyos.",
)
async def get_fichaje(
    fichaje_id: int,
    fichaje_service: FichajeServiceDep,
    current_user: CurrentUser,
) -> FichajeResponse:
    """Obtiene un fichaje por ID."""
    fichaje = await fichaje_service.get_by_id(fichaje_id=fichaje_id, current_user=current_user)

    return _build_fichaje_response(fichaje)


@router.post(
    "/{fichaje_id}/correct",
    response_model=FichajeResponse,
    summary="Solicitar corrección",
    description="Solicita corrección de un fichaje. Solo el propietario puede solicitarla.",
)
async def request_correction(
    fichaje_id: int,
    correction_data: FichajeCorrection,
    fichaje_service: FichajeServiceDep,
    current_user: CurrentUser,
) -> FichajeResponse:
    """Solicita corrección de un fichaje."""
    fichaje = await fichaje_service.request_correction(
        fichaje_id=fichaje_id,
        correction_data=correction_data,
        user=current_user,
    )

    return _build_fichaje_response(fichaje, current_user)


@router.post(
    "/{fichaje_id}/approve",
    response_model=FichajeResponse,
    summary="Aprobar/rechazar corrección",
    description="Aprueba o rechaza una corrección de fichaje. Solo HR puede hacerlo.",
)
async def approve_correction(
    fichaje_id: int,
    approval: FichajeApproval,
    fichaje_service: FichajeServiceDep,
    current_hr: CurrentHR,
) -> FichajeResponse:
    """Aprueba o rechaza una corrección."""
    fichaje = await fichaje_service.approve_correction(
        fichaje_id=fichaje_id,
        approval=approval,
        hr_user=current_hr,
    )

    return _build_fichaje_response(fichaje)


@router.get(
    "/stats/general",
    response_model=FichajeStats,
    summary="Estadísticas generales",
    description="Obtiene estadísticas generales. HR puede ver de cualquier usuario.",
)
async def get_stats(
    fichaje_service: FichajeServiceDep,
    current_user: CurrentUser,
    user_id: int | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
) -> FichajeStats:
    """Obtiene estadísticas generales."""
    return await fichaje_service.get_stats(
        user_id=user_id,
        date_from=_date_to_datetime(date_from),
        date_to=_date_to_datetime_end(date_to),
        current_user=current_user,
    )
