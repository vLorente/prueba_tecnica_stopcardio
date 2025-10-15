"""Modelo de solicitudes de vacaciones y ausencias."""

from datetime import UTC, date, datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class SolicitudStatus(str, Enum):
    """Estados posibles de una solicitud."""

    PENDING = "pending"  # Pendiente de revisión
    APPROVED = "approved"  # Aprobada por HR
    REJECTED = "rejected"  # Rechazada por HR
    CANCELLED = "cancelled"  # Cancelada por el empleado


class SolicitudTipo(str, Enum):
    """Tipos de solicitud."""

    VACATION = "vacation"  # Vacaciones
    SICK_LEAVE = "sick_leave"  # Baja por enfermedad
    PERSONAL = "personal"  # Asunto personal
    OTHER = "other"  # Otro motivo


class Solicitud(BaseModel, table=True):
    """Modelo de solicitud de vacaciones/ausencias."""

    # Relación con usuario (solicitante)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    user: "User" = Relationship(
        back_populates="solicitudes",
        sa_relationship_kwargs={"foreign_keys": "Solicitud.user_id"},
    )

    # Datos de la solicitud
    tipo: SolicitudTipo = Field(nullable=False)
    fecha_inicio: date = Field(index=True, nullable=False)
    fecha_fin: date = Field(index=True, nullable=False)
    dias_solicitados: int = Field(nullable=False)  # Calculado automáticamente
    motivo: str = Field(max_length=1000, nullable=False)

    # Estado
    status: SolicitudStatus = Field(default=SolicitudStatus.PENDING, nullable=False, index=True)

    # Información de revisión (HR)
    reviewed_by: int | None = Field(default=None, foreign_key="user.id")
    reviewed_by_user: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Solicitud.reviewed_by"}
    )
    reviewed_at: datetime | None = Field(default=None)
    comentarios_revision: str | None = Field(default=None, max_length=500)

    # Propiedades calculadas
    @property
    def is_pending(self) -> bool:
        """Verifica si está pendiente de revisión."""
        return self.status == SolicitudStatus.PENDING

    @property
    def is_approved(self) -> bool:
        """Verifica si fue aprobada."""
        return self.status == SolicitudStatus.APPROVED

    @property
    def is_active(self) -> bool:
        """Verifica si la solicitud está en periodo activo."""
        today = datetime.now(tz=UTC).date()
        return (
            self.status == SolicitudStatus.APPROVED and self.fecha_inicio <= today <= self.fecha_fin
        )
