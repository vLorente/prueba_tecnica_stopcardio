"""Repository para operaciones de base de datos de fichajes."""

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.fichaje import Fichaje, FichajeStatus


class FichajeRepository:
    """Repository para gestionar fichajes en la base de datos."""

    def __init__(self, session: AsyncSession):
        """Inicializa el repository con una sesión de base de datos.

        Args:
            session: Sesión asíncrona de SQLModel.
        """
        self.session = session

    async def create(self, fichaje: Fichaje) -> Fichaje:
        """Crea un nuevo fichaje en la base de datos.

        Args:
            fichaje: Instancia de Fichaje a crear.

        Returns:
            Fichaje: Fichaje creado con ID asignado.
        """
        self.session.add(fichaje)
        await self.session.commit()
        await self.session.refresh(fichaje)
        return fichaje

    async def get_by_id(self, fichaje_id: int) -> Fichaje | None:
        """Obtiene un fichaje por su ID.

        Args:
            fichaje_id: ID del fichaje.

        Returns:
            Fichaje si existe, None en caso contrario.
        """
        statement = (
            select(Fichaje)
            .options(
                selectinload(Fichaje.user),
                selectinload(Fichaje.approved_by_user),
            )
            .where(Fichaje.id == fichaje_id)
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_active_checkin(self, user_id: int) -> Fichaje | None:
        """Obtiene el fichaje activo (sin check-out) de un usuario.

        Args:
            user_id: ID del usuario.

        Returns:
            Fichaje activo si existe, None en caso contrario.
        """
        statement = (
            select(Fichaje)
            .where(Fichaje.user_id == user_id)
            .where(Fichaje.check_out.is_(None))
            .order_by(Fichaje.check_in.desc())
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: int | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        status: FichajeStatus | None = None,
        incomplete_only: bool = False,
    ) -> list[Fichaje]:
        """Obtiene fichajes con filtros y paginación.

        Args:
            skip: Número de registros a saltar.
            limit: Número máximo de registros a devolver.
            user_id: Filtrar por ID de usuario.
            date_from: Fecha de inicio (inclusive).
            date_to: Fecha de fin (inclusive).
            status: Filtrar por estado.
            incomplete_only: Solo fichajes sin check-out.

        Returns:
            Lista de fichajes que cumplen los criterios.
        """
        statement = select(Fichaje).options(
            selectinload(Fichaje.user),
            selectinload(Fichaje.approved_by_user),
        )

        # Aplicar filtros
        if user_id is not None:
            statement = statement.where(Fichaje.user_id == user_id)

        if date_from is not None:
            statement = statement.where(func.date(Fichaje.check_in) >= date_from)

        if date_to is not None:
            statement = statement.where(func.date(Fichaje.check_in) <= date_to)

        if status is not None:
            statement = statement.where(Fichaje.status == status)

        if incomplete_only:
            statement = statement.where(Fichaje.check_out.is_(None))

        # Ordenar por fecha más reciente primero
        statement = statement.order_by(Fichaje.check_in.desc())

        # Aplicar paginación
        statement = statement.offset(skip).limit(limit)

        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def count(
        self,
        user_id: int | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        status: FichajeStatus | None = None,
        incomplete_only: bool = False,
    ) -> int:
        """Cuenta fichajes que cumplen los criterios especificados.

        Args:
            user_id: Filtrar por ID de usuario.
            date_from: Fecha de inicio (inclusive).
            date_to: Fecha de fin (inclusive).
            status: Filtrar por estado.
            incomplete_only: Solo fichajes sin check-out.

        Returns:
            Número de fichajes que cumplen los criterios.
        """
        statement = select(func.count(Fichaje.id))

        # Aplicar los mismos filtros que en get_all
        if user_id is not None:
            statement = statement.where(Fichaje.user_id == user_id)

        if date_from is not None:
            statement = statement.where(func.date(Fichaje.check_in) >= date_from)

        if date_to is not None:
            statement = statement.where(func.date(Fichaje.check_in) <= date_to)

        if status is not None:
            statement = statement.where(Fichaje.status == status)

        if incomplete_only:
            statement = statement.where(Fichaje.check_out.is_(None))

        result = await self.session.execute(statement)
        return result.scalar_one()

    async def update(self, fichaje: Fichaje) -> Fichaje:
        """Actualiza un fichaje existente.

        Args:
            fichaje: Instancia de Fichaje con los datos actualizados.

        Returns:
            Fichaje actualizado con relaciones cargadas.
        """
        self.session.add(fichaje)
        await self.session.flush()

        # Recargar con relaciones para evitar lazy loading
        stmt = (
            select(Fichaje)
            .options(
                selectinload(Fichaje.user),
                selectinload(Fichaje.approved_by_user),
            )
            .where(Fichaje.id == fichaje.id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def calculate_total_hours(
        self,
        user_id: int | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> float:
        """Calcula el total de horas trabajadas en un periodo.

        Args:
            user_id: Filtrar por ID de usuario.
            date_from: Fecha de inicio (inclusive).
            date_to: Fecha de fin (inclusive).

        Returns:
            Total de horas trabajadas (solo fichajes completos).
        """
        statement = select(Fichaje).where(Fichaje.check_out.is_not(None))

        if user_id is not None:
            statement = statement.where(Fichaje.user_id == user_id)

        if date_from is not None:
            statement = statement.where(func.date(Fichaje.check_in) >= date_from)

        if date_to is not None:
            statement = statement.where(func.date(Fichaje.check_in) <= date_to)

        result = await self.session.execute(statement)
        fichajes = result.scalars().all()

        total_hours = 0.0
        for fichaje in fichajes:
            if fichaje.check_out and fichaje.check_in:
                delta = fichaje.check_out - fichaje.check_in
                total_hours += delta.total_seconds() / 3600

        return round(total_hours, 2)

    async def has_active_checkin(self, user_id: int) -> bool:
        """Verifica si un usuario tiene un fichaje activo (sin check-out).

        Args:
            user_id: ID del usuario.

        Returns:
            True si tiene fichaje activo, False en caso contrario.
        """
        fichaje = await self.get_active_checkin(user_id)
        return fichaje is not None

    async def exists_overlap(
        self,
        user_id: int,
        check_in: datetime,
        check_out: datetime | None,
        exclude_id: int | None = None,
    ) -> bool:
        """Verifica si existe solapamiento de fichajes para un usuario.

        Args:
            user_id: ID del usuario.
            check_in: Hora de entrada del fichaje a verificar.
            check_out: Hora de salida del fichaje a verificar (puede ser None).
            exclude_id: ID de fichaje a excluir de la búsqueda (para actualizaciones).

        Returns:
            True si existe solapamiento, False en caso contrario.

        Raises:
            ConflictException: Si se detecta solapamiento.
        """
        # Si no hay check_out, no podemos verificar solapamiento completo
        if check_out is None:
            # Solo verificamos si hay otro check-in sin check-out
            statement = (
                select(Fichaje).where(Fichaje.user_id == user_id).where(Fichaje.check_out.is_(None))
            )

            if exclude_id is not None:
                statement = statement.where(Fichaje.id != exclude_id)

            result = await self.session.execute(statement)
            overlapping = result.scalar_one_or_none()
            return overlapping is not None

        # Buscar fichajes que se solapen con el rango [check_in, check_out]
        statement = (
            select(Fichaje)
            .where(Fichaje.user_id == user_id)
            .where(Fichaje.check_out.is_not(None))
            .where(
                # El nuevo fichaje empieza antes de que termine uno existente
                # Y el nuevo fichaje termina después de que empiece uno existente
                (Fichaje.check_in < check_out) & (Fichaje.check_out > check_in)
            )
        )

        if exclude_id is not None:
            statement = statement.where(Fichaje.id != exclude_id)

        result = await self.session.execute(statement)
        overlapping = result.scalar_one_or_none()

        return overlapping is not None
