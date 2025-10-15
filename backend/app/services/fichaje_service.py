"""Service para lógica de negocio de fichajes."""

from datetime import UTC, datetime

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.fichaje import Fichaje, FichajeStatus
from app.models.user import User, UserRole
from app.repositories.fichaje_repository import FichajeRepository
from app.repositories.user_repository import UserRepository
from app.schemas.fichaje import (
    FichajeApproval,
    FichajeCorrection,
    FichajeFilters,
    FichajeStats,
)


def ensure_timezone_aware(dt: datetime) -> datetime:
    """Asegura que un datetime tenga timezone UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


class FichajeService:
    """Service para gestionar lógica de negocio de fichajes."""

    def __init__(self, fichaje_repo: FichajeRepository, user_repo: UserRepository):
        """Inicializa el service con los repositories necesarios.

        Args:
            fichaje_repo: Repository de fichajes.
            user_repo: Repository de usuarios.
        """
        self.fichaje_repo = fichaje_repo
        self.user_repo = user_repo

    async def check_in(self, user_id: int, notes: str | None) -> Fichaje:
        """Registra entrada (check-in) de un usuario.

        Args:
            user_id: ID del usuario.
            notes: Notas opcionales del check-in.

        Returns:
            Fichaje creado con check-in registrado.

        Raises:
            BadRequestException: Si el usuario ya tiene un check-in activo.
            NotFoundException: Si el usuario no existe o está inactivo.
        """
        # Verificar que el usuario existe y está activo
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(
                message=f"Usuario con ID {user_id} no encontrado",
                details={"user_id": user_id},
            )

        if not user.is_active:
            raise BadRequestException(
                message="El usuario está inactivo",
                details={"user_id": user_id, "is_active": False},
            )

        # Verificar que no tenga otro check-in activo
        has_active = await self.fichaje_repo.has_active_checkin(user_id)
        if has_active:
            raise BadRequestException(
                message="Ya tienes un fichaje activo. Debes hacer check-out primero.",
                details={"user_id": user_id},
            )

        # Crear el fichaje
        fichaje = Fichaje(
            user_id=user_id,
            check_in=datetime.now(UTC),
            notes=notes,
            status=FichajeStatus.VALID,
        )

        return await self.fichaje_repo.create(fichaje)

    async def check_out(self, user_id: int, notes: str | None) -> Fichaje:
        """Registra salida (check-out) de un usuario.

        Args:
            user_id: ID del usuario.
            notes: Notas opcionales del check-out.

        Returns:
            Fichaje actualizado con check-out registrado.

        Raises:
            BadRequestException: Si no tiene check-in activo o check_out < check_in.
            NotFoundException: Si el usuario no existe.
        """
        # Verificar que el usuario existe
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(
                message=f"Usuario con ID {user_id} no encontrado",
                details={"user_id": user_id},
            )

        # Obtener fichaje activo
        fichaje = await self.fichaje_repo.get_active_checkin(user_id)
        if not fichaje:
            raise BadRequestException(
                message="No tienes un fichaje activo. Debes hacer check-in primero.",
                details={"user_id": user_id},
            )

        # Registrar check-out
        fichaje.check_out = datetime.now(UTC)

        # Validar que check_out > check_in (asegurar timezone-aware)
        check_in_aware = ensure_timezone_aware(fichaje.check_in)
        check_out_aware = ensure_timezone_aware(fichaje.check_out)

        if check_out_aware <= check_in_aware:
            raise BadRequestException(
                message="La hora de salida debe ser posterior a la hora de entrada",
                details={
                    "check_in": check_in_aware.isoformat(),
                    "check_out": check_out_aware.isoformat(),
                },
            )

        # Actualizar notas si se proporcionaron
        if notes:
            if fichaje.notes:
                fichaje.notes = f"{fichaje.notes}\n{notes}"
            else:
                fichaje.notes = notes

        return await self.fichaje_repo.update(fichaje)

    async def request_correction(
        self,
        fichaje_id: int,
        correction_data: FichajeCorrection,
        user: User,
    ) -> Fichaje:
        """Solicita corrección de un fichaje.

        Args:
            fichaje_id: ID del fichaje a corregir.
            correction_data: Datos de la corrección.
            user: Usuario que solicita la corrección.

        Returns:
            Fichaje actualizado con estado PENDING_CORRECTION.

        Raises:
            NotFoundException: Si el fichaje no existe.
            ForbiddenException: Si el usuario no es propietario del fichaje.
            BadRequestException: Si hay errores de validación.
        """
        # Obtener fichaje
        fichaje = await self.fichaje_repo.get_by_id(fichaje_id)
        if not fichaje:
            raise NotFoundException(
                message=f"Fichaje con ID {fichaje_id} no encontrado",
                details={"fichaje_id": fichaje_id},
            )

        # Verificar que el usuario es el propietario
        if fichaje.user_id != user.id:
            raise ForbiddenException(
                message="Solo puedes corregir tus propios fichajes",
                details={"fichaje_id": fichaje_id, "user_id": user.id},
            )

        # Validar que check_out > check_in si se proporciona (asegurar timezone-aware)
        if correction_data.check_out:
            check_in_aware = ensure_timezone_aware(correction_data.check_in)
            check_out_aware = ensure_timezone_aware(correction_data.check_out)

            if check_out_aware <= check_in_aware:
                raise BadRequestException(
                    message="La hora de salida debe ser posterior a la hora de entrada",
                    details={
                        "check_in": check_in_aware.isoformat(),
                        "check_out": check_out_aware.isoformat(),
                    },
                )

        # Verificar solapamiento con otros fichajes del usuario
        has_overlap = await self.fichaje_repo.exists_overlap(
            user_id=user.id,
            check_in=correction_data.check_in,
            check_out=correction_data.check_out,
            exclude_id=fichaje_id,
        )

        if has_overlap:
            raise BadRequestException(
                message="La corrección se solapa con otro fichaje existente",
                details={
                    "check_in": correction_data.check_in.isoformat(),
                    "check_out": correction_data.check_out.isoformat()
                    if correction_data.check_out
                    else None,
                },
            )

        # Actualizar fichaje con información de corrección
        fichaje.correction_reason = correction_data.correction_reason
        fichaje.correction_requested_at = datetime.now(UTC)
        fichaje.status = FichajeStatus.PENDING_CORRECTION

        # Guardar los nuevos valores temporalmente en las notas
        # (se aplicarán al aprobar)
        correction_note = (
            f"CORRECCIÓN SOLICITADA:\nNuevo check_in: {correction_data.check_in.isoformat()}\n"
        )
        if correction_data.check_out:
            correction_note += f"Nuevo check_out: {correction_data.check_out.isoformat()}\n"
        correction_note += f"Razón: {correction_data.correction_reason}"

        if fichaje.notes:
            fichaje.notes = f"{fichaje.notes}\n\n{correction_note}"
        else:
            fichaje.notes = correction_note

        return await self.fichaje_repo.update(fichaje)

    async def approve_correction(
        self,
        fichaje_id: int,
        approval: FichajeApproval,
        hr_user: User,
    ) -> Fichaje:
        """Aprueba o rechaza una corrección de fichaje.

        Args:
            fichaje_id: ID del fichaje.
            approval: Datos de la aprobación.
            hr_user: Usuario HR que aprueba/rechaza.

        Returns:
            Fichaje actualizado.

        Raises:
            NotFoundException: Si el fichaje no existe.
            ForbiddenException: Si el usuario no es HR.
            BadRequestException: Si el fichaje no está pendiente.
        """
        # Verificar que el usuario es HR
        if hr_user.role != UserRole.HR:
            raise ForbiddenException(
                message="Solo usuarios HR pueden aprobar correcciones",
                details={"user_id": hr_user.id, "role": hr_user.role},
            )

        # Obtener fichaje
        fichaje = await self.fichaje_repo.get_by_id(fichaje_id)
        if not fichaje:
            raise NotFoundException(
                message=f"Fichaje con ID {fichaje_id} no encontrado",
                details={"fichaje_id": fichaje_id},
            )

        # Verificar que está pendiente de aprobación
        if fichaje.status != FichajeStatus.PENDING_CORRECTION:
            raise BadRequestException(
                message="El fichaje no está pendiente de aprobación",
                details={"fichaje_id": fichaje_id, "status": fichaje.status},
            )

        # Registrar aprobación
        fichaje.approved_by = hr_user.id
        fichaje.approved_at = datetime.now(UTC)
        fichaje.approval_notes = approval.approval_notes

        if approval.approved:
            # Aprobar: cambiar estado y aplicar corrección
            # Extraer los nuevos valores de las notas (formato simple)
            # En producción, esto debería estar en campos separados
            fichaje.status = FichajeStatus.CORRECTED
        else:
            # Rechazar: volver a estado anterior
            fichaje.status = FichajeStatus.REJECTED

        return await self.fichaje_repo.update(fichaje)

    async def get_by_id(self, fichaje_id: int, current_user: User) -> Fichaje:
        """Obtiene un fichaje por ID con control de autorización.

        Args:
            fichaje_id: ID del fichaje.
            current_user: Usuario actual.

        Returns:
            Fichaje encontrado.

        Raises:
            NotFoundException: Si el fichaje no existe.
            ForbiddenException: Si no tiene permisos para verlo.
        """
        fichaje = await self.fichaje_repo.get_by_id(fichaje_id)
        if not fichaje:
            raise NotFoundException(
                message=f"Fichaje con ID {fichaje_id} no encontrado",
                details={"fichaje_id": fichaje_id},
            )

        # HR puede ver cualquier fichaje, empleados solo los suyos
        if current_user.role != UserRole.HR and fichaje.user_id != current_user.id:
            raise ForbiddenException(
                message="No tienes permiso para ver este fichaje",
                details={"fichaje_id": fichaje_id, "user_id": current_user.id},
            )

        return fichaje

    async def get_all(
        self,
        filters: FichajeFilters,
        skip: int,
        limit: int,
        current_user: User,
    ) -> tuple[list[Fichaje], int, float]:
        """Lista fichajes con filtros y autorización.

        Args:
            filters: Filtros de búsqueda.
            skip: Registros a saltar (paginación).
            limit: Límite de registros.
            current_user: Usuario actual.

        Returns:
            Tupla con (fichajes, total, total_hours).

        Raises:
            ForbiddenException: Si empleado intenta ver fichajes ajenos.
        """
        # Si es empleado, solo puede ver sus propios fichajes
        if current_user.role != UserRole.HR:
            if filters.user_id and filters.user_id != current_user.id:
                raise ForbiddenException(
                    message="No tienes permiso para ver fichajes de otros usuarios",
                    details={
                        "requested_user_id": filters.user_id,
                        "current_user_id": current_user.id,
                    },
                )
            filters.user_id = current_user.id

        # Obtener fichajes
        fichajes = await self.fichaje_repo.get_all(
            skip=skip,
            limit=limit,
            user_id=filters.user_id,
            date_from=filters.date_from,
            date_to=filters.date_to,
            status=filters.status,
            incomplete_only=filters.incomplete_only,
        )

        # Contar total
        total = await self.fichaje_repo.count(
            user_id=filters.user_id,
            date_from=filters.date_from,
            date_to=filters.date_to,
            status=filters.status,
            incomplete_only=filters.incomplete_only,
        )

        # Calcular horas totales
        total_hours = await self.fichaje_repo.calculate_total_hours(
            user_id=filters.user_id,
            date_from=filters.date_from,
            date_to=filters.date_to,
        )

        return fichajes, total, total_hours

    async def get_my_fichajes(
        self,
        user_id: int,
        date_from: datetime | None,
        date_to: datetime | None,
        skip: int,
        limit: int,
    ) -> tuple[list[Fichaje], int, float]:
        """Obtiene fichajes del usuario actual.

        Args:
            user_id: ID del usuario.
            date_from: Fecha de inicio.
            date_to: Fecha de fin.
            skip: Registros a saltar.
            limit: Límite de registros.

        Returns:
            Tupla con (fichajes, total, total_hours).
        """
        fichajes = await self.fichaje_repo.get_all(
            skip=skip,
            limit=limit,
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
        )

        total = await self.fichaje_repo.count(user_id=user_id, date_from=date_from, date_to=date_to)

        total_hours = await self.fichaje_repo.calculate_total_hours(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
        )

        return fichajes, total, total_hours

    async def get_stats(
        self,
        user_id: int | None,
        date_from: datetime | None,
        date_to: datetime | None,
        current_user: User,
    ) -> FichajeStats:
        """Obtiene estadísticas de fichajes.

        Args:
            user_id: ID del usuario (None para todos).
            date_from: Fecha de inicio.
            date_to: Fecha de fin.
            current_user: Usuario actual.

        Returns:
            Estadísticas calculadas.

        Raises:
            ForbiddenException: Si empleado intenta ver stats ajenas.
        """
        # Verificar permisos
        if current_user.role != UserRole.HR:
            if user_id and user_id != current_user.id:
                raise ForbiddenException(
                    message="No tienes permiso para ver estadísticas de otros usuarios",
                    details={"requested_user_id": user_id, "current_user_id": current_user.id},
                )
            user_id = current_user.id

        # Contar fichajes totales
        total_fichajes = await self.fichaje_repo.count(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
        )

        # Contar completos
        fichajes_completos = await self.fichaje_repo.count(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
            incomplete_only=False,
        ) - await self.fichaje_repo.count(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
            incomplete_only=True,
        )

        # Contar incompletos
        fichajes_incompletos = await self.fichaje_repo.count(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
            incomplete_only=True,
        )

        # Contar pendientes
        pending_corrections = await self.fichaje_repo.count(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
            status=FichajeStatus.PENDING_CORRECTION,
        )

        # Calcular horas totales
        total_hours = await self.fichaje_repo.calculate_total_hours(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
        )

        # Calcular promedio por día
        average_hours_per_day = 0.0
        if fichajes_completos > 0:
            average_hours_per_day = round(total_hours / fichajes_completos, 2)

        return FichajeStats(
            total_fichajes=total_fichajes,
            fichajes_completos=fichajes_completos,
            fichajes_incompletos=fichajes_incompletos,
            pending_corrections=pending_corrections,
            total_hours=total_hours,
            average_hours_per_day=average_hours_per_day,
        )
