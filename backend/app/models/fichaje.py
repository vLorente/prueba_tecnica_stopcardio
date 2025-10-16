"""Modelo de fichaje para registro de entradas/salidas."""

from datetime import UTC, datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class FichajeStatus(str, Enum):
    """Estados posibles de un fichaje."""

    VALID = "valid"  # Fichaje válido
    PENDING_CORRECTION = "pending_correction"  # Corrección pendiente de aprobación
    CORRECTED = "corrected"  # Corregido y aprobado por HR
    REJECTED = "rejected"  # Corrección rechazada por HR


class Fichaje(BaseModel, table=True):
    """Modelo de fichaje (entrada/salida).

    Representa un registro de asistencia con entrada (check-in) y salida (check-out).
    Soporta correcciones que deben ser aprobadas por usuarios HR.
    """

    # Relación con usuario (propietario del fichaje)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    user: "User" = Relationship(
        back_populates="fichajes",
        sa_relationship_kwargs={"foreign_keys": "Fichaje.user_id"},
    )

    # Datos del fichaje
    check_in: datetime = Field(index=True, nullable=False)
    check_out: datetime | None = Field(default=None, index=True)

    # Metadatos
    status: FichajeStatus = Field(default=FichajeStatus.VALID, nullable=False)
    notes: str | None = Field(default=None, max_length=500)

    # Información de corrección
    correction_reason: str | None = Field(default=None, max_length=1000)
    correction_requested_at: datetime | None = Field(default=None)

    # Valores propuestos en la corrección
    proposed_check_in: datetime | None = Field(default=None)
    proposed_check_out: datetime | None = Field(default=None)

    # Información de aprobación
    approved_by: int | None = Field(default=None, foreign_key="user.id")
    approved_by_user: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Fichaje.approved_by"},
    )
    approved_at: datetime | None = Field(default=None)
    approval_notes: str | None = Field(default=None, max_length=500)

    @property
    def hours_worked(self) -> float | None:
        """Calcula las horas trabajadas en el fichaje.

        Returns:
            float: Horas trabajadas redondeadas a 2 decimales, o None si no hay check_out.
        """
        if not self.check_out:
            return None

        # Normalizar timezone para evitar errores al restar datetime
        check_in = self.check_in
        check_out = self.check_out

        # Si uno tiene timezone y el otro no, agregar UTC a los naive
        if check_in.tzinfo is None and check_out.tzinfo is not None:
            check_in = check_in.replace(tzinfo=UTC)
        elif check_out.tzinfo is None and check_in.tzinfo is not None:
            check_out = check_out.replace(tzinfo=UTC)

        delta = check_out - check_in
        return round(delta.total_seconds() / 3600, 2)

    @property
    def is_complete(self) -> bool:
        """Verifica si el fichaje está completo (tiene check-out).

        Returns:
            bool: True si tiene check_out, False en caso contrario.
        """
        return self.check_out is not None

    @property
    def is_pending_approval(self) -> bool:
        """Verifica si el fichaje está pendiente de aprobación.

        Returns:
            bool: True si el estado es PENDING_CORRECTION.
        """
        return self.status == FichajeStatus.PENDING_CORRECTION

    def __repr__(self) -> str:
        """Representación en string del fichaje."""
        return (
            f"<Fichaje(id={self.id}, user_id={self.user_id}, "
            f"check_in={self.check_in}, check_out={self.check_out}, "
            f"status={self.status})>"
        )
