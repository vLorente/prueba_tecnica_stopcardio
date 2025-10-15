"""
Router de Solicitudes de Vacaciones y Ausencias.

Endpoints para gestión de solicitudes de vacaciones, permisos y ausencias.
Implementa separación de permisos entre empleados y RRHH.
"""

from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_hr, get_current_user
from app.database import get_session
from app.models.solicitud import SolicitudStatus, SolicitudTipo
from app.models.user import User
from app.schemas.solicitud import (
    SolicitudCreate,
    SolicitudFilters,
    SolicitudListResponse,
    SolicitudResponse,
    SolicitudReview,
    SolicitudUpdate,
    VacationBalance,
)
from app.services.solicitud_service import SolicitudService

router = APIRouter(prefix="/vacaciones", tags=["Vacaciones"])


# ============================================================================
# HELPERS
# ============================================================================


def _build_solicitud_response(solicitud) -> SolicitudResponse:
    """Construye respuesta de solicitud con datos de usuario."""
    return SolicitudResponse(
        id=solicitud.id,
        created_at=solicitud.created_at,
        updated_at=solicitud.updated_at,
        user_id=solicitud.user_id,
        user_email=solicitud.user.email if solicitud.user else "",
        user_full_name=solicitud.user.full_name if solicitud.user else "",
        tipo=solicitud.tipo,
        fecha_inicio=solicitud.fecha_inicio,
        fecha_fin=solicitud.fecha_fin,
        dias_solicitados=solicitud.dias_solicitados,
        motivo=solicitud.motivo,
        status=solicitud.status,
        reviewed_by=solicitud.reviewed_by,
        reviewed_by_name=solicitud.reviewed_by_user.full_name
        if solicitud.reviewed_by_user
        else None,
        reviewed_at=solicitud.reviewed_at,
        comentarios_revision=solicitud.comentarios_revision,
        is_pending=solicitud.is_pending,
        is_approved=solicitud.is_approved,
        is_active=solicitud.is_active,
    )


def _build_filters(
    user_id: int | None = None,
    tipo: str | None = None,
    estado: str | None = None,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
    activas_only: bool = False,
) -> SolicitudFilters:
    """Construye objeto de filtros desde parámetros de query."""
    # Validar y convertir tipo
    tipo_enum = None
    if tipo:
        try:
            tipo_enum = SolicitudTipo(tipo.lower())
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo inválido. Valores permitidos: {[t.value for t in SolicitudTipo]}",
            ) from err

    # Validar y convertir estado
    status_enum = None
    if estado:
        try:
            status_enum = SolicitudStatus(estado.lower())
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado inválido. Valores permitidos: {[s.value for s in SolicitudStatus]}",
            ) from err

    # Validar y convertir fechas
    fecha_desde_parsed = None
    if fecha_desde:
        try:
            fecha_desde_parsed = date_type.fromisoformat(fecha_desde)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="fecha_desde debe estar en formato YYYY-MM-DD",
            ) from err

    fecha_hasta_parsed = None
    if fecha_hasta:
        try:
            fecha_hasta_parsed = date_type.fromisoformat(fecha_hasta)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="fecha_hasta debe estar en formato YYYY-MM-DD",
            ) from err

    return SolicitudFilters(
        user_id=user_id,
        tipo=tipo_enum,
        status=status_enum,
        fecha_desde=fecha_desde_parsed,
        fecha_hasta=fecha_hasta_parsed,
        activas_only=activas_only,
    )


# ============================================================================
# ENDPOINTS PARA EMPLEADOS
# ============================================================================


@router.post(
    "/",
    response_model=SolicitudResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva solicitud",
    description="Crear solicitud de vacaciones o ausencia. Calcula días hábiles automáticamente.",
)
async def create_solicitud(
    data: SolicitudCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SolicitudResponse:
    """
    Crear nueva solicitud de vacaciones/ausencia.

    **Validaciones automáticas:**
    - Balance disponible suficiente (para VACATION)
    - Sin conflictos con solicitudes aprobadas
    - Fechas válidas (inicio <= fin, futuras)
    - Motivo mínimo 10 caracteres
    - Cálculo de días hábiles (excluye sábados y domingos)

    **Tipos de solicitud:**
    - VACATION: Vacaciones (descuenta del balance)
    - SICK_LEAVE: Baja médica
    - PERSONAL: Asuntos personales
    - OTHER: Otros motivos
    """
    service = SolicitudService(session)
    solicitud = await service.create_solicitud(current_user, data)

    # Recargar con relaciones para respuesta completa
    solicitud = await service.get_solicitud_by_id(solicitud.id, current_user)  # type: ignore

    return _build_solicitud_response(solicitud)


@router.get(
    "/me",
    response_model=SolicitudListResponse,
    summary="Listar mis solicitudes",
    description="Obtener listado de solicitudes propias con filtros opcionales.",
)
async def get_my_solicitudes(
    tipo: str | None = Query(None, description="Filtrar por tipo (VACATION, SICK_LEAVE, etc)"),
    estado: str | None = Query(
        None,
        alias="status",
        description="Filtrar por estado (pending, approved, rejected, cancelled)",
    ),
    fecha_desde: str | None = Query(None, description="Fecha inicio del rango (YYYY-MM-DD)"),
    fecha_hasta: str | None = Query(None, description="Fecha fin del rango (YYYY-MM-DD)"),
    activas_only: bool = Query(False, description="Solo solicitudes actualmente en curso"),
    skip: int = Query(0, ge=0, description="Registros a saltar (paginación)"),
    limit: int = Query(100, ge=1, le=100, description="Máximo de registros a retornar"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SolicitudListResponse:
    """
    Obtener mis solicitudes con filtros opcionales.

    **Filtros disponibles:**
    - `tipo`: VACATION, SICK_LEAVE, PERSONAL, OTHER
    - `status`: pending, approved, rejected, cancelled
    - `fecha_desde` / `fecha_hasta`: Rango de fechas
    - `activas_only`: Solo solicitudes en curso actualmente

    **Ordenamiento:** Por fecha de creación (más recientes primero).
    """
    filters = _build_filters(
        tipo=tipo,
        estado=estado,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        activas_only=activas_only,
    )

    service = SolicitudService(session)
    solicitudes, total = await service.get_my_solicitudes(
        user=current_user,
        filters=filters,
        skip=skip,
        limit=limit,
    )

    return SolicitudListResponse(
        solicitudes=[_build_solicitud_response(s) for s in solicitudes],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/me/balance",
    response_model=VacationBalance,
    summary="Consultar balance de vacaciones",
    description="Obtener información completa del balance de vacaciones disponible.",
)
async def get_my_balance(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> VacationBalance:
    """
    Obtener balance de vacaciones del usuario actual.

    **Información retornada:**
    - Días anuales asignados
    - Días disponibles actuales
    - Días tomados este año
    - Días en solicitudes pendientes
    - Contadores de solicitudes por estado
    - Próximo período de vacaciones aprobado
    """
    service = SolicitudService(session)
    return await service.get_my_balance(current_user)


@router.get(
    "/pending",
    response_model=SolicitudListResponse,
    summary="[HR] Listar solicitudes pendientes",
    description="Obtener todas las solicitudes pendientes de revisión.",
    dependencies=[Depends(get_current_hr)],
)
async def get_pending_solicitudes(
    skip: int = Query(0, ge=0, description="Registros a saltar (paginación)"),
    limit: int = Query(100, ge=1, le=100, description="Máximo de registros a retornar"),
    session: AsyncSession = Depends(get_session),
) -> SolicitudListResponse:
    """
    Obtener solicitudes pendientes de revisión (solo HR).

    **Acceso:** Solo usuarios con rol HR.

    **Filtro automático:** Solo solicitudes con status=PENDING.

    **Ordenamiento:** Por fecha de creación (más antiguas primero),
    priorizando las que llevan más tiempo esperando.
    """
    service = SolicitudService(session)
    solicitudes, total = await service.solicitud_repo.get_pending(
        skip=skip,
        limit=limit,
    )

    return SolicitudListResponse(
        solicitudes=[_build_solicitud_response(s) for s in solicitudes],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{solicitud_id}",
    response_model=SolicitudResponse,
    summary="Obtener solicitud por ID",
    description="Consultar detalles de una solicitud específica.",
)
async def get_solicitud(
    solicitud_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SolicitudResponse:
    """
    Obtener una solicitud por ID.

    **Permisos:**
    - Empleados: Solo pueden ver sus propias solicitudes
    - HR: Puede ver cualquier solicitud
    """
    service = SolicitudService(session)
    solicitud = await service.get_solicitud_by_id(solicitud_id, current_user)

    return _build_solicitud_response(solicitud)


@router.put(
    "/{solicitud_id}",
    response_model=SolicitudResponse,
    summary="Actualizar solicitud",
    description="Modificar fechas o motivo de una solicitud propia pendiente.",
)
async def update_solicitud(
    solicitud_id: int,
    data: SolicitudUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SolicitudResponse:
    """
    Actualizar solicitud propia (solo si está pendiente).

    **Campos modificables:**
    - Fechas de inicio y/o fin
    - Motivo

    **Restricciones:**
    - Solo solicitudes en estado PENDING
    - Solo el propietario puede actualizar
    - Se recalculan días hábiles automáticamente
    - Se valida balance si cambian las fechas
    """
    service = SolicitudService(session)
    solicitud = await service.update_solicitud(solicitud_id, current_user, data)

    return _build_solicitud_response(solicitud)


@router.post(
    "/{solicitud_id}/cancel",
    response_model=SolicitudResponse,
    summary="Cancelar solicitud",
    description="Cancelar una solicitud propia pendiente.",
)
async def cancel_solicitud(
    solicitud_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SolicitudResponse:
    """
    Cancelar solicitud propia (solo si está pendiente).

    **Efecto:**
    - Cambia estado a CANCELLED
    - No afecta el balance de vacaciones
    - No se puede deshacer

    **Restricciones:**
    - Solo solicitudes en estado PENDING
    - Solo el propietario puede cancelar
    """
    service = SolicitudService(session)
    solicitud = await service.cancel_solicitud(solicitud_id, current_user)

    return _build_solicitud_response(solicitud)


# ============================================================================
# ENDPOINTS PARA HR (RECURSOS HUMANOS)
# ============================================================================


@router.get(
    "/",
    response_model=SolicitudListResponse,
    summary="[HR] Listar todas las solicitudes",
    description="Obtener listado completo de solicitudes con filtros avanzados.",
    dependencies=[Depends(get_current_hr)],
)
async def list_all_solicitudes(
    user_id: int | None = Query(None, description="Filtrar por ID de usuario"),
    tipo: str | None = Query(None, description="Filtrar por tipo de solicitud"),
    estado: str | None = Query(None, alias="status", description="Filtrar por estado"),
    fecha_desde: str | None = Query(None, description="Fecha inicio del rango (YYYY-MM-DD)"),
    fecha_hasta: str | None = Query(None, description="Fecha fin del rango (YYYY-MM-DD)"),
    activas_only: bool = Query(False, description="Solo solicitudes actualmente en curso"),
    skip: int = Query(0, ge=0, description="Registros a saltar (paginación)"),
    limit: int = Query(100, ge=1, le=100, description="Máximo de registros a retornar"),
    session: AsyncSession = Depends(get_session),
) -> SolicitudListResponse:
    """
    Listar todas las solicitudes (solo HR).

    **Acceso:** Solo usuarios con rol HR.

    **Filtros disponibles:**
    - `user_id`: Usuario específico
    - `tipo`: VACATION, SICK_LEAVE, PERSONAL, OTHER
    - `status`: pending, approved, rejected, cancelled
    - `fecha_desde` / `fecha_hasta`: Rango de fechas
    - `activas_only`: Solo en curso actualmente

    **Ordenamiento:** Por fecha de creación (más recientes primero).
    """
    filters = _build_filters(
        user_id=user_id,
        tipo=tipo,
        estado=estado,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        activas_only=activas_only,
    )

    service = SolicitudService(session)
    solicitudes, total = await service.get_all_solicitudes(
        filters=filters,
        skip=skip,
        limit=limit,
    )

    return SolicitudListResponse(
        solicitudes=[_build_solicitud_response(s) for s in solicitudes],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/{solicitud_id}/review",
    response_model=SolicitudResponse,
    summary="[HR] Aprobar o rechazar solicitud",
    description="Revisar una solicitud pendiente, aprobándola o rechazándola.",
    dependencies=[Depends(get_current_hr)],
)
async def review_solicitud(
    solicitud_id: int,
    data: SolicitudReview,
    session: AsyncSession = Depends(get_session),
    current_hr: User = Depends(get_current_hr),
) -> SolicitudResponse:
    """
    Aprobar o rechazar una solicitud (solo HR).

    **Acceso:** Solo usuarios con rol HR.

    **Efecto de APROBAR:**
    - Cambia estado a APPROVED
    - Descuenta días del balance (solo si tipo=VACATION)
    - Registra revisor y fecha de revisión
    - Puede incluir comentarios opcionales

    **Efecto de RECHAZAR:**
    - Cambia estado a REJECTED
    - NO descuenta días del balance
    - Registra revisor y fecha de revisión
    - Puede incluir comentarios (recomendado)

    **Restricciones:**
    - Solo solicitudes en estado PENDING
    - No se puede deshacer (cambio permanente)
    """
    service = SolicitudService(session)
    solicitud = await service.review_solicitud(solicitud_id, current_hr, data)

    return _build_solicitud_response(solicitud)


@router.get(
    "/balance/{user_id}",
    response_model=VacationBalance,
    summary="[HR] Consultar balance de usuario",
    description="Obtener balance de vacaciones de cualquier usuario.",
    dependencies=[Depends(get_current_hr)],
)
async def get_user_balance(
    user_id: int,
    session: AsyncSession = Depends(get_session),
) -> VacationBalance:
    """
    Obtener balance de vacaciones de un usuario (solo HR).

    **Acceso:** Solo usuarios con rol HR.

    **Información retornada:**
    - Días anuales asignados
    - Días disponibles actuales
    - Días tomados este año
    - Días en solicitudes pendientes
    - Contadores de solicitudes por estado
    - Próximo período de vacaciones aprobado
    """
    service = SolicitudService(session)
    return await service.get_user_balance(user_id)
