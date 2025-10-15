"""Schemas Pydantic para solicitudes de vacaciones y ausencias."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.solicitud import SolicitudStatus, SolicitudTipo

# ============================================================================
# REQUEST SCHEMAS
# ============================================================================


class SolicitudCreate(BaseModel):
    """Request para crear solicitud de vacaciones/ausencia."""

    tipo: SolicitudTipo
    fecha_inicio: date
    fecha_fin: date
    motivo: str = Field(min_length=10, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self) -> "SolicitudCreate":
        """Valida que fecha_fin >= fecha_inicio."""
        if self.fecha_fin < self.fecha_inicio:
            msg = "La fecha de fin debe ser posterior o igual a la fecha de inicio"
            raise ValueError(msg)
        return self


class SolicitudUpdate(BaseModel):
    """Request para actualizar solicitud (solo si está pendiente)."""

    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    motivo: str | None = Field(default=None, min_length=10, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self) -> "SolicitudUpdate":
        """Valida fechas si ambas están presentes."""
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            msg = "La fecha de fin debe ser posterior o igual a la fecha de inicio"
            raise ValueError(msg)
        return self


class SolicitudReview(BaseModel):
    """Request para aprobar/rechazar solicitud (solo HR)."""

    approved: bool
    comentarios_revision: str | None = Field(default=None, max_length=500)


class SolicitudFilters(BaseModel):
    """Filtros para consulta de solicitudes."""

    user_id: int | None = None
    tipo: SolicitudTipo | None = None
    status: SolicitudStatus | None = None
    fecha_desde: date | None = None
    fecha_hasta: date | None = None
    activas_only: bool = False  # Solo solicitudes en periodo activo


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================


class SolicitudResponse(BaseModel):
    """Respuesta con datos de solicitud."""

    id: int
    user_id: int
    user_email: str
    user_full_name: str
    tipo: SolicitudTipo
    fecha_inicio: date
    fecha_fin: date
    dias_solicitados: int
    motivo: str
    status: SolicitudStatus
    reviewed_by: int | None
    reviewed_by_name: str | None
    reviewed_at: datetime | None
    comentarios_revision: str | None
    is_pending: bool
    is_approved: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SolicitudListResponse(BaseModel):
    """Respuesta con lista paginada de solicitudes."""

    solicitudes: list[SolicitudResponse]
    total: int
    skip: int
    limit: int


class VacationBalance(BaseModel):
    """Balance de vacaciones de un empleado."""

    user_id: int
    user_email: str
    user_full_name: str
    dias_anuales: int
    dias_disponibles: float
    dias_tomados: int
    dias_pendientes: int  # Días en solicitudes pendientes
    solicitudes_pendientes: int
    solicitudes_aprobadas: int
    proximo_periodo: date | None  # Próxima solicitud aprobada

    model_config = ConfigDict(from_attributes=True)
