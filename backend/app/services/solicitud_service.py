"""
Servicio de Solicitudes de Vacaciones y Ausencias.

Contiene la lógica de negocio para operaciones con solicitudes.
Actúa como capa intermedia entre los routers y los repositorios.
"""

from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.solicitud import Solicitud, SolicitudStatus, SolicitudTipo
from app.models.user import User
from app.repositories.solicitud_repository import SolicitudRepository
from app.repositories.user_repository import UserRepository
from app.schemas.solicitud import (
    SolicitudCreate,
    SolicitudFilters,
    SolicitudReview,
    SolicitudUpdate,
    VacationBalance,
)

# ============================================================================
# REGLAS DE NEGOCIO (13 reglas)
# ============================================================================
# RN-V01: Usuario debe estar activo para solicitar vacaciones
# RN-V02: Fecha de inicio debe ser futura o actual
# RN-V03: Fecha de fin debe ser >= fecha de inicio
# RN-V04: Motivo debe tener al menos 10 caracteres
# RN-V05: No puede haber solapamiento con solicitudes pendientes o aprobadas del mismo usuario
# RN-V06: Días solicitados calculados excluyendo fines de semana
# RN-V07: Días solicitados no pueden exceder balance disponible (para tipo VACATION)
# RN-V08: Solo el empleado puede crear/actualizar/cancelar sus solicitudes
# RN-V09: Solo solicitudes PENDING pueden ser actualizadas/canceladas
# RN-V10: Solo HR puede aprobar/rechazar solicitudes
# RN-V11: Al aprobar, descontar días del balance (si es tipo VACATION)
# RN-V12: Al rechazar/cancelar, NO descontar días
# RN-V13: Solicitudes aprobadas no pueden ser modificadas/canceladas


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================


def calculate_business_days(fecha_inicio: date, fecha_fin: date) -> int:
    """
    Calcula días hábiles entre dos fechas (Lunes-Viernes).

    Excluye fines de semana (sábado y domingo).

    Args:
        fecha_inicio: Fecha de inicio del período
        fecha_fin: Fecha de fin del período

    Returns:
        int: Número de días hábiles (excluyendo sábados y domingos)
    """
    if fecha_fin < fecha_inicio:
        return 0

    WEEKDAYS = 5  # Lunes a Viernes
    days = 0
    current = fecha_inicio

    while current <= fecha_fin:
        # 0=Lun, 1=Mar, 2=Mie, 3=Jue, 4=Vie, 5=Sab, 6=Dom
        if current.weekday() < WEEKDAYS:
            days += 1
        current += timedelta(days=1)

    return days


# ============================================================================
# SERVICIO PRINCIPAL
# ============================================================================


class SolicitudService:
    """
    Servicio para operaciones de negocio con solicitudes de vacaciones/ausencias.

    Implementa las reglas de negocio y coordina entre repositorios.
    """

    def __init__(self, session: AsyncSession):
        """
        Inicializa el servicio.

        Args:
            session: Sesión asíncrona de base de datos
        """
        self.session = session
        self.solicitud_repo = SolicitudRepository(session)
        self.user_repo = UserRepository(session)

    async def create_solicitud(
        self,
        user: User,
        data: SolicitudCreate,
    ) -> Solicitud:
        """
        Crea una nueva solicitud de vacaciones/ausencia.

        Aplica reglas de negocio:
        - RN-V01: Usuario activo
        - RN-V02: Fecha inicio futura o actual
        - RN-V03: Fecha fin >= fecha inicio (validado en schema)
        - RN-V04: Motivo >= 10 caracteres (validado en schema)
        - RN-V05: Sin conflictos de fechas
        - RN-V06: Calcular días hábiles
        - RN-V07: Validar balance disponible (solo VACATION)

        Args:
            user: Usuario que crea la solicitud
            data: Datos de la solicitud

        Returns:
            Solicitud: Solicitud creada

        Raises:
            HTTPException: Si falla alguna validación
        """
        # RN-V01: Validar usuario activo
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo no puede crear solicitudes",
            )

        # RN-V02: Validar fecha de inicio
        today = datetime.now(tz=UTC).date()
        if data.fecha_inicio < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La fecha de inicio debe ser hoy o posterior",
            )

        # RN-V05: Verificar conflictos de fechas con solicitudes pendientes o aprobadas
        has_conflict = await self.solicitud_repo.check_date_conflict(
            user_id=user.id,  # type: ignore
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
        )
        if has_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una solicitud pendiente o aprobada que se solapa con estas fechas",
            )

        # RN-V06: Calcular días hábiles
        dias_solicitados = calculate_business_days(data.fecha_inicio, data.fecha_fin)

        if dias_solicitados == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La solicitud debe incluir al menos un día hábil",
            )

        # RN-V07: Validar balance disponible (solo para VACATION)
        if data.tipo == SolicitudTipo.VACATION:
            # Obtener días pendientes actuales
            dias_pendientes = await self.solicitud_repo.get_pending_days(user_id=user.id)  # type: ignore

            # Verificar si hay suficiente balance
            balance_requerido = dias_solicitados + dias_pendientes
            if balance_requerido > user.dias_vacaciones_disponibles:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Balance insuficiente. Disponible: {user.dias_vacaciones_disponibles}, "
                        f"Pendiente: {dias_pendientes}, Solicitado: {dias_solicitados}"
                    ),
                )

        # Crear solicitud
        solicitud = Solicitud(
            user_id=user.id,  # type: ignore
            tipo=data.tipo,
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
            dias_solicitados=dias_solicitados,
            motivo=data.motivo,
            status=SolicitudStatus.PENDING,
        )

        return await self.solicitud_repo.create(solicitud)

    async def get_my_solicitudes(
        self,
        user: User,
        filters: SolicitudFilters,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Solicitud], int]:
        """
        Obtiene las solicitudes del usuario actual con filtros opcionales.

        RN-V08: Solo el empleado puede ver sus solicitudes.

        Args:
            user: Usuario actual
            filters: Filtros a aplicar
            skip: Número de registros a saltar
            limit: Número máximo de registros

        Returns:
            tuple[list[Solicitud], int]: Lista de solicitudes y total
        """
        return await self.solicitud_repo.get_by_user(
            user_id=user.id,  # type: ignore
            filters=filters,
            skip=skip,
            limit=limit,
        )

    async def get_all_solicitudes(
        self,
        filters: SolicitudFilters,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Solicitud], int]:
        """
        Obtiene todas las solicitudes con filtros (solo HR).

        RN-V10 verificada en router.

        Args:
            filters: Filtros a aplicar
            skip: Número de registros a saltar
            limit: Número máximo de registros

        Returns:
            tuple[list[Solicitud], int]: Lista de solicitudes y total
        """
        return await self.solicitud_repo.get_all(
            filters=filters,
            skip=skip,
            limit=limit,
        )

    async def get_solicitud_by_id(
        self,
        solicitud_id: int,
        user: User,
    ) -> Solicitud:
        """
        Obtiene una solicitud por ID validando permisos.

        - RN-V08: Empleados solo pueden ver sus propias solicitudes
        - HR puede ver todas las solicitudes

        Args:
            solicitud_id: ID de la solicitud
            user: Usuario actual

        Returns:
            Solicitud: Solicitud encontrada

        Raises:
            HTTPException: Si no se encuentra o no tiene permisos
        """
        solicitud = await self.solicitud_repo.get_by_id(solicitud_id)

        if not solicitud:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud no encontrada",
            )

        # RN-V08: Validar permisos
        if not user.is_hr and solicitud.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para ver esta solicitud",
            )

        return solicitud

    async def update_solicitud(
        self,
        solicitud_id: int,
        user: User,
        data: SolicitudUpdate,
    ) -> Solicitud:
        """
        Actualiza una solicitud existente.

        Aplica reglas:
        - RN-V08: Solo el dueño puede actualizar
        - RN-V09: Solo solicitudes PENDING pueden ser actualizadas
        - RN-V05: Sin conflictos de fechas
        - RN-V06: Recalcular días hábiles
        - RN-V07: Validar balance si cambian fechas

        Args:
            solicitud_id: ID de la solicitud
            user: Usuario actual
            data: Datos a actualizar

        Returns:
            Solicitud: Solicitud actualizada

        Raises:
            HTTPException: Si falla alguna validación
        """
        # Obtener solicitud y validar permisos
        solicitud = await self.get_solicitud_by_id(solicitud_id, user)

        # RN-V08: Solo el dueño puede actualizar
        if solicitud.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puede actualizar sus propias solicitudes",
            )

        # RN-V09: Solo solicitudes PENDING
        if solicitud.status != SolicitudStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede actualizar una solicitud con estado {solicitud.status}",
            )

        # Preparar datos de actualización
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return solicitud

        # Determinar fechas finales
        nueva_fecha_inicio = data.fecha_inicio or solicitud.fecha_inicio
        nueva_fecha_fin = data.fecha_fin or solicitud.fecha_fin

        # RN-V05: Verificar conflictos si cambian las fechas
        if data.fecha_inicio or data.fecha_fin:
            has_conflict = await self.solicitud_repo.check_date_conflict(
                user_id=user.id,  # type: ignore
                fecha_inicio=nueva_fecha_inicio,
                fecha_fin=nueva_fecha_fin,
                exclude_id=solicitud_id,
            )
            if has_conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe una solicitud pendiente o aprobada que se solapa con estas fechas",
                )

            # RN-V06: Recalcular días hábiles
            nuevos_dias = calculate_business_days(nueva_fecha_inicio, nueva_fecha_fin)

            if nuevos_dias == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La solicitud debe incluir al menos un día hábil",
                )

            # RN-V07: Validar balance si es VACATION y cambian los días
            if (
                solicitud.tipo == SolicitudTipo.VACATION
                and nuevos_dias != solicitud.dias_solicitados
            ):
                dias_pendientes = await self.solicitud_repo.get_pending_days(user_id=user.id)  # type: ignore
                # Restar los días actuales de esta solicitud
                dias_pendientes -= solicitud.dias_solicitados

                balance_requerido = nuevos_dias + dias_pendientes
                if balance_requerido > user.dias_vacaciones_disponibles:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Balance insuficiente. Disponible: {user.dias_vacaciones_disponibles}, "
                            f"Pendiente: {dias_pendientes}, Solicitado: {nuevos_dias}"
                        ),
                    )

            update_data["dias_solicitados"] = nuevos_dias

        # Aplicar actualización a solicitud
        for key, value in update_data.items():
            setattr(solicitud, key, value)

        updated_solicitud = await self.solicitud_repo.update(solicitud)

        if not updated_solicitud:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar la solicitud",
            )

        return updated_solicitud

    async def cancel_solicitud(
        self,
        solicitud_id: int,
        user: User,
    ) -> Solicitud:
        """
        Cancela una solicitud (cambia estado a CANCELLED).

        Aplica reglas:
        - RN-V08: Solo el dueño puede cancelar
        - RN-V09: Solo solicitudes PENDING pueden ser canceladas
        - RN-V12: NO descontar días del balance

        Args:
            solicitud_id: ID de la solicitud
            user: Usuario actual

        Returns:
            Solicitud: Solicitud cancelada

        Raises:
            HTTPException: Si falla alguna validación
        """
        # Obtener solicitud y validar permisos
        solicitud = await self.get_solicitud_by_id(solicitud_id, user)

        # RN-V08: Solo el dueño puede cancelar
        if solicitud.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puede cancelar sus propias solicitudes",
            )

        # RN-V09 y RN-V13: Solo solicitudes PENDING
        if solicitud.status != SolicitudStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede cancelar una solicitud con estado {solicitud.status}",
            )

        # Cambiar estado a CANCELLED
        solicitud.status = SolicitudStatus.CANCELLED
        updated_solicitud = await self.solicitud_repo.update(solicitud)

        if not updated_solicitud:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al cancelar la solicitud",
            )

        return updated_solicitud

    async def review_solicitud(
        self,
        solicitud_id: int,
        reviewer: User,
        data: SolicitudReview,
    ) -> Solicitud:
        """
        Aprueba o rechaza una solicitud (solo HR).

        Aplica reglas:
        - RN-V10: Solo HR puede revisar (verificado en router)
        - RN-V09: Solo solicitudes PENDING pueden ser revisadas
        - RN-V11: Al aprobar VACATION, descontar días del balance
        - RN-V12: Al rechazar, NO descontar días

        Args:
            solicitud_id: ID de la solicitud
            reviewer: Usuario HR que revisa
            data: Datos de la revisión

        Returns:
            Solicitud: Solicitud revisada

        Raises:
            HTTPException: Si falla alguna validación
        """
        # Obtener solicitud
        solicitud = await self.solicitud_repo.get_by_id(solicitud_id)

        if not solicitud:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud no encontrada",
            )

        # RN-V09: Solo solicitudes PENDING
        if solicitud.status != SolicitudStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede revisar una solicitud con estado {solicitud.status}",
            )

        # Determinar nuevo estado
        new_status = SolicitudStatus.APPROVED if data.approved else SolicitudStatus.REJECTED

        # RN-V11: Si se aprueba una VACATION, descontar del balance
        if data.approved and solicitud.tipo == SolicitudTipo.VACATION:
            # Obtener usuario solicitante
            solicitante = await self.user_repo.get_by_id(solicitud.user_id)

            if not solicitante:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario solicitante no encontrado",
                )

            # Descontar días del balance
            nuevo_balance = solicitante.dias_vacaciones_disponibles - solicitud.dias_solicitados
            solicitante.dias_vacaciones_disponibles = nuevo_balance
            await self.user_repo.update(solicitante)

        # Actualizar solicitud con revisión
        solicitud.status = new_status
        solicitud.reviewed_by = reviewer.id  # type: ignore
        solicitud.reviewed_at = datetime.now(tz=UTC)
        solicitud.comentarios_revision = data.comentarios_revision

        updated_solicitud = await self.solicitud_repo.update(solicitud)

        if not updated_solicitud:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al revisar la solicitud",
            )

        return updated_solicitud

    async def get_my_balance(
        self,
        user: User,
    ) -> VacationBalance:
        """
        Obtiene el balance de vacaciones del usuario actual.

        Args:
            user: Usuario actual

        Returns:
            VacationBalance: Balance de vacaciones
        """
        balance_data = await self.solicitud_repo.get_vacation_balance(user_id=user.id)  # type: ignore

        return VacationBalance(
            user_id=user.id,  # type: ignore
            user_email=user.email,
            user_full_name=user.full_name,
            **balance_data,
        )

    async def get_user_balance(
        self,
        user_id: int,
    ) -> VacationBalance:
        """
        Obtiene el balance de vacaciones de un usuario (solo HR).

        RN-V10 verificada en router.

        Args:
            user_id: ID del usuario

        Returns:
            VacationBalance: Balance de vacaciones

        Raises:
            HTTPException: Si el usuario no existe
        """
        # Obtener usuario
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        balance_data = await self.solicitud_repo.get_vacation_balance(user_id=user_id)

        return VacationBalance(
            user_id=user.id,  # type: ignore
            user_email=user.email,
            user_full_name=user.full_name,
            **balance_data,
        )
