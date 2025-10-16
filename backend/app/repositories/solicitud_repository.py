"""
Repositorio de Solicitudes.

Capa de acceso a datos para el modelo Solicitud.
Implementa el patrón Repository para abstraer la lógica de persistencia.
"""

from datetime import UTC, date, datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.solicitud import Solicitud, SolicitudStatus, SolicitudTipo
from app.models.user import User
from app.schemas.solicitud import SolicitudFilters


class SolicitudRepository:
    """
    Repositorio para operaciones CRUD de solicitudes.

    Maneja toda la interacción con la base de datos para el modelo Solicitud.
    """

    def __init__(self, session: AsyncSession):
        """
        Inicializa el repositorio.

        Args:
            session: Sesión asíncrona de base de datos
        """
        self.session = session

    # ============================================================================
    # CRUD BÁSICO
    # ============================================================================

    async def create(self, solicitud: Solicitud) -> Solicitud:
        """
        Crea una nueva solicitud en la base de datos.

        Args:
            solicitud: Instancia de Solicitud a crear

        Returns:
            Solicitud: Solicitud creada con ID asignado
        """
        self.session.add(solicitud)
        await self.session.flush()
        await self.session.refresh(solicitud)
        return solicitud

    async def get_by_id(self, solicitud_id: int) -> Solicitud | None:
        """
        Obtiene una solicitud por ID con relaciones cargadas.

        Args:
            solicitud_id: ID de la solicitud

        Returns:
            Solicitud | None: Solicitud encontrada o None
        """
        stmt = (
            select(Solicitud)
            .options(
                selectinload(Solicitud.user),
                selectinload(Solicitud.reviewed_by_user),
            )
            .where(Solicitud.id == solicitud_id)  # type: ignore[arg-type]
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, solicitud: Solicitud) -> Solicitud:
        """
        Actualiza una solicitud en la base de datos.

        Args:
            solicitud: Solicitud con los cambios a aplicar

        Returns:
            Solicitud: Solicitud actualizada
        """
        self.session.add(solicitud)
        await self.session.flush()
        await self.session.refresh(solicitud)
        return solicitud

    async def delete(self, solicitud_id: int) -> bool:
        """
        Elimina una solicitud de la base de datos.

        Args:
            solicitud_id: ID de la solicitud a eliminar

        Returns:
            bool: True si se eliminó, False si no se encontró
        """
        solicitud = await self.get_by_id(solicitud_id)
        if not solicitud:
            return False

        await self.session.delete(solicitud)
        await self.session.flush()
        return True

    # ============================================================================
    # QUERIES ESPECIALIZADAS
    # ============================================================================

    async def get_by_user(
        self,
        user_id: int,
        filters: SolicitudFilters,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Solicitud], int]:
        """
        Obtiene solicitudes de un usuario específico con filtros opcionales.

        Args:
            user_id: ID del usuario
            filters: Filtros a aplicar
            skip: Número de registros a saltar (paginación)
            limit: Número máximo de registros a retornar

        Returns:
            tuple[list[Solicitud], int]: Lista de solicitudes y total
        """
        # Query base
        stmt = select(Solicitud).options(
            selectinload(Solicitud.user),
            selectinload(Solicitud.reviewed_by_user),
        )

        # Filtro obligatorio: usuario
        stmt = stmt.where(Solicitud.user_id == user_id)

        # Aplicar filtros opcionales
        stmt = self._apply_filters(stmt, filters)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Ordenar por fecha de creación descendente
        stmt = stmt.order_by(Solicitud.created_at.desc())

        # Aplicar paginación
        stmt = stmt.offset(skip).limit(limit)

        # Ejecutar query
        result = await self.session.execute(stmt)
        solicitudes = list(result.scalars().all())

        return solicitudes, total

    async def get_all(
        self,
        filters: SolicitudFilters,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Solicitud], int]:
        """
        Obtiene todas las solicitudes con filtros opcionales (HR).

        Args:
            filters: Filtros a aplicar
            skip: Número de registros a saltar (paginación)
            limit: Número máximo de registros a retornar

        Returns:
            tuple[list[Solicitud], int]: Lista de solicitudes y total
        """
        # Query base
        stmt = select(Solicitud).options(
            selectinload(Solicitud.user),
            selectinload(Solicitud.reviewed_by_user),
        )

        # Aplicar filtros
        stmt = self._apply_filters(stmt, filters)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Ordenar por fecha de creación descendente
        stmt = stmt.order_by(Solicitud.created_at.desc())

        # Aplicar paginación
        stmt = stmt.offset(skip).limit(limit)

        # Ejecutar query
        result = await self.session.execute(stmt)
        solicitudes = list(result.scalars().all())

        return solicitudes, total

    async def get_pending(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Solicitud], int]:
        """
        Obtiene solicitudes pendientes de revisión.

        Args:
            skip: Número de registros a saltar (paginación)
            limit: Número máximo de registros a retornar

        Returns:
            tuple[list[Solicitud], int]: Lista de solicitudes y total
        """
        stmt = (
            select(Solicitud)
            .options(
                selectinload(Solicitud.user),
                selectinload(Solicitud.reviewed_by_user),
            )
            .where(Solicitud.status == SolicitudStatus.PENDING)
            .order_by(Solicitud.created_at.asc())
        )

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Aplicar paginación
        stmt = stmt.offset(skip).limit(limit)

        # Ejecutar query
        result = await self.session.execute(stmt)
        solicitudes = list(result.scalars().all())

        return solicitudes, total

    async def check_date_conflict(
        self,
        user_id: int,
        fecha_inicio: date,
        fecha_fin: date,
        exclude_id: int | None = None,
    ) -> bool:
        """
        Verifica si hay conflicto de fechas con solicitudes aprobadas o pendientes.

        Regla de Negocio: No se puede crear/actualizar una solicitud si alguno de sus días
        coincide con una solicitud del mismo usuario en estado PENDING o APPROVED.

        Args:
            user_id: ID del usuario
            fecha_inicio: Fecha de inicio de la nueva solicitud
            fecha_fin: Fecha de fin de la nueva solicitud
            exclude_id: ID de solicitud a excluir (para updates)

        Returns:
            bool: True si existe conflicto, False si no hay conflicto
        """
        stmt = select(Solicitud).where(
            and_(
                Solicitud.user_id == user_id,
                # Verificar contra solicitudes PENDING o APPROVED
                or_(
                    Solicitud.status == SolicitudStatus.APPROVED,
                    Solicitud.status == SolicitudStatus.PENDING,
                ),
                # Verificar solapamiento de fechas
                or_(
                    # La nueva solicitud comienza durante una existente
                    and_(
                        Solicitud.fecha_inicio <= fecha_inicio,
                        Solicitud.fecha_fin >= fecha_inicio,
                    ),
                    # La nueva solicitud termina durante una existente
                    and_(
                        Solicitud.fecha_inicio <= fecha_fin,
                        Solicitud.fecha_fin >= fecha_fin,
                    ),
                    # La nueva solicitud envuelve completamente una existente
                    and_(
                        Solicitud.fecha_inicio >= fecha_inicio,
                        Solicitud.fecha_fin <= fecha_fin,
                    ),
                ),
            )
        )

        # Excluir la solicitud actual si es una actualización
        if exclude_id:
            stmt = stmt.where(Solicitud.id != exclude_id)

        result = await self.session.execute(stmt)
        conflicting_solicitud = result.first()

        return conflicting_solicitud is not None

    async def get_approved_days_in_year(
        self,
        user_id: int,
        year: int,
    ) -> int:
        """
        Calcula total de días de vacaciones aprobados en un año específico.

        Args:
            user_id: ID del usuario
            year: Año a consultar

        Returns:
            int: Total de días aprobados
        """
        stmt = select(func.sum(Solicitud.dias_solicitados)).where(
            and_(
                Solicitud.user_id == user_id,
                Solicitud.tipo == SolicitudTipo.VACATION,
                Solicitud.status == SolicitudStatus.APPROVED,
                func.extract("year", Solicitud.fecha_inicio) == year,
            )
        )

        result = await self.session.execute(stmt)
        total = result.scalar()

        return total or 0

    async def get_pending_days(
        self,
        user_id: int,
    ) -> int:
        """
        Calcula total de días en solicitudes pendientes de tipo VACATION.

        Args:
            user_id: ID del usuario

        Returns:
            int: Total de días pendientes
        """
        stmt = select(func.sum(Solicitud.dias_solicitados)).where(
            and_(
                Solicitud.user_id == user_id,
                Solicitud.tipo == SolicitudTipo.VACATION,
                Solicitud.status == SolicitudStatus.PENDING,
            )
        )

        result = await self.session.execute(stmt)
        total = result.scalar()

        return total or 0

    async def get_active_requests(
        self,
        user_id: int | None = None,
    ) -> list[Solicitud]:
        """
        Obtiene solicitudes aprobadas que están actualmente en curso.

        Args:
            user_id: ID del usuario (opcional, si no se proporciona retorna todas)

        Returns:
            list[Solicitud]: Lista de solicitudes activas
        """
        today = datetime.now(tz=UTC).date()

        stmt = (
            select(Solicitud)
            .options(
                selectinload(Solicitud.user),
                selectinload(Solicitud.reviewed_by_user),
            )
            .where(
                and_(
                    Solicitud.status == SolicitudStatus.APPROVED,
                    Solicitud.fecha_inicio <= today,
                    Solicitud.fecha_fin >= today,
                )
            )
        )

        if user_id:
            stmt = stmt.where(Solicitud.user_id == user_id)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_vacation_balance(
        self,
        user_id: int,
    ) -> dict:
        """
        Obtiene balance completo de vacaciones de un usuario.

        Args:
            user_id: ID del usuario

        Returns:
            dict: Diccionario con información de balance

        Raises:
            ValueError: Si el usuario no existe
        """
        # Obtener usuario con información de balance
        user_stmt = select(User).where(User.id == user_id)
        user_result = await self.session.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            msg = f"Usuario con id {user_id} no encontrado"
            raise ValueError(msg)

        # Días tomados este año (solo VACATION aprobadas)
        year = datetime.now(tz=UTC).year
        dias_tomados = await self.get_approved_days_in_year(user_id, year)

        # Días pendientes (solo VACATION pendientes)
        dias_pendientes = await self.get_pending_days(user_id)

        # Contar solicitudes por estado
        count_pending_stmt = select(func.count()).where(
            and_(
                Solicitud.user_id == user_id,
                Solicitud.status == SolicitudStatus.PENDING,
            )
        )
        pending_result = await self.session.execute(count_pending_stmt)
        solicitudes_pendientes = pending_result.scalar() or 0

        count_approved_stmt = select(func.count()).where(
            and_(
                Solicitud.user_id == user_id,
                Solicitud.status == SolicitudStatus.APPROVED,
            )
        )
        approved_result = await self.session.execute(count_approved_stmt)
        solicitudes_aprobadas = approved_result.scalar() or 0

        # Próxima solicitud aprobada (futura)
        today = datetime.now(tz=UTC).date()
        next_stmt = (
            select(Solicitud.fecha_inicio)
            .where(
                and_(
                    Solicitud.user_id == user_id,
                    Solicitud.status == SolicitudStatus.APPROVED,
                    Solicitud.fecha_inicio > today,
                )
            )
            .order_by(Solicitud.fecha_inicio.asc())
            .limit(1)
        )
        next_result = await self.session.execute(next_stmt)
        proximo_periodo = next_result.scalar_one_or_none()

        return {
            "dias_anuales": user.dias_vacaciones_anuales,
            "dias_disponibles": user.dias_vacaciones_disponibles,
            "dias_tomados": dias_tomados,
            "dias_pendientes": dias_pendientes,
            "solicitudes_pendientes": solicitudes_pendientes,
            "solicitudes_aprobadas": solicitudes_aprobadas,
            "proximo_periodo": proximo_periodo,
        }

    # ============================================================================
    # FUNCIONES AUXILIARES PRIVADAS
    # ============================================================================

    def _apply_filters(self, stmt, filters: SolicitudFilters):
        """
        Aplica filtros opcionales a una query de solicitudes.

        Args:
            stmt: Statement de SQLAlchemy
            filters: Filtros a aplicar

        Returns:
            Statement con filtros aplicados
        """
        if filters.user_id:
            stmt = stmt.where(Solicitud.user_id == filters.user_id)

        if filters.tipo:
            stmt = stmt.where(Solicitud.tipo == filters.tipo)

        if filters.status:
            stmt = stmt.where(Solicitud.status == filters.status)

        if filters.fecha_desde:
            stmt = stmt.where(Solicitud.fecha_inicio >= filters.fecha_desde)

        if filters.fecha_hasta:
            stmt = stmt.where(Solicitud.fecha_fin <= filters.fecha_hasta)

        if filters.activas_only:
            today = datetime.now(tz=UTC).date()
            stmt = stmt.where(
                and_(
                    Solicitud.status == SolicitudStatus.APPROVED,
                    Solicitud.fecha_inicio <= today,
                    Solicitud.fecha_fin >= today,
                )
            )

        return stmt
