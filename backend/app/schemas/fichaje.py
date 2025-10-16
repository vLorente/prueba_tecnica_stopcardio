"""Schemas Pydantic para fichajes (entradas/salidas)."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer

from app.models.fichaje import FichajeStatus

# ============================================================================
# Schemas de Request (Entrada)
# ============================================================================


class FichajeCheckIn(BaseModel):
    """Request para registrar entrada (check-in)."""

    notes: str | None = Field(
        default=None, max_length=500, description="Notas opcionales del check-in"
    )


class FichajeCheckOut(BaseModel):
    """Request para registrar salida (check-out)."""

    notes: str | None = Field(
        default=None, max_length=500, description="Notas opcionales del check-out"
    )


class FichajeCorrection(BaseModel):
    """Request para solicitar corrección de un fichaje."""

    check_in: datetime = Field(description="Nueva fecha/hora de entrada")
    check_out: datetime | None = Field(
        default=None, description="Nueva fecha/hora de salida (opcional)"
    )
    correction_reason: str = Field(
        min_length=10,
        max_length=1000,
        description="Razón de la corrección (mínimo 10 caracteres)",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "check_in": "2025-10-15T08:00:00",
                "check_out": "2025-10-15T17:00:00",
                "correction_reason": "Olvidé registrar la salida ayer. Salí a las 17:00.",
            }
        }
    )


class FichajeApproval(BaseModel):
    """Request para aprobar o rechazar una corrección."""

    approved: bool = Field(description="True para aprobar, False para rechazar")
    approval_notes: str | None = Field(
        default=None,
        max_length=500,
        description="Notas opcionales sobre la decisión",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "approved": True,
                "approval_notes": "Corrección aprobada. Motivo justificado.",
            }
        }
    )


class FichajeFilters(BaseModel):
    """Filtros para consulta de fichajes."""

    user_id: int | None = Field(default=None, description="Filtrar por ID de usuario")
    date_from: date | None = Field(default=None, description="Fecha de inicio (inclusive)")
    date_to: date | None = Field(default=None, description="Fecha de fin (inclusive)")
    status: FichajeStatus | None = Field(default=None, description="Filtrar por estado")
    incomplete_only: bool = Field(default=False, description="Solo fichajes sin check-out")


# ============================================================================
# Schemas de Response (Salida)
# ============================================================================


class FichajeResponse(BaseModel):
    """Respuesta con datos completos de un fichaje."""

    # Identificación
    id: int
    user_id: int
    user_email: str
    user_full_name: str

    # Datos del fichaje
    check_in: datetime
    check_out: datetime | None
    hours_worked: float | None

    # Metadatos
    status: FichajeStatus
    notes: str | None

    # Información de corrección
    correction_reason: str | None
    correction_requested_at: datetime | None

    # Información de aprobación
    approved_by: int | None
    approved_at: datetime | None
    approval_notes: str | None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer(
        "check_in",
        "check_out",
        "correction_requested_at",
        "approved_at",
        "created_at",
        "updated_at",
    )
    def serialize_datetime(self, dt: datetime | None, _info) -> str | None:
        """Serializa datetime a ISO 8601 con sufijo Z (UTC)."""
        if dt is None:
            return None
        # Convertir a UTC si tiene timezone y formatear con Z
        if dt.tzinfo is not None:
            return dt.isoformat().replace("+00:00", "Z")
        # Si no tiene timezone, asumir UTC y agregar Z
        return f"{dt.isoformat()}Z"


class FichajeListResponse(BaseModel):
    """Respuesta paginada de fichajes con estadísticas."""

    fichajes: list[FichajeResponse]
    total: int = Field(description="Total de fichajes que cumplen los filtros")
    page: int = Field(description="Página actual")
    page_size: int = Field(description="Tamaño de página")
    total_hours: float = Field(description="Suma total de horas trabajadas en el periodo")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "fichajes": [],
                "total": 42,
                "page": 1,
                "page_size": 10,
                "total_hours": 168.5,
            }
        }
    )


class FichajeStats(BaseModel):
    """Estadísticas de fichajes de un usuario o periodo."""

    total_fichajes: int = Field(description="Total de fichajes")
    fichajes_completos: int = Field(description="Fichajes con check-in y check-out")
    fichajes_incompletos: int = Field(description="Fichajes solo con check-in")
    pending_corrections: int = Field(description="Correcciones pendientes de aprobación")
    total_hours: float = Field(description="Total de horas trabajadas")
    average_hours_per_day: float = Field(description="Promedio de horas por día trabajado")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_fichajes": 20,
                "fichajes_completos": 19,
                "fichajes_incompletos": 1,
                "pending_corrections": 0,
                "total_hours": 168.5,
                "average_hours_per_day": 8.88,
            }
        }
    )
