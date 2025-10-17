"""
Modelo base para todos los modelos de la aplicación.

Define campos comunes y funcionalidad compartida.
"""

from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class TimestampMixin(SQLModel):
    """
    Mixin que agrega campos de timestamp a los modelos.

    Incluye created_at y updated_at que se manejan automáticamente.
    """

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False,
        description="Fecha de creación del registro",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": lambda: datetime.now(UTC)},
        nullable=False,
        description="Fecha de última actualización del registro",
    )


class BaseModel(TimestampMixin, SQLModel):
    """
    Modelo base para todas las tablas.

    Incluye:
    - id: Primary key
    - created_at: Timestamp de creación
    - updated_at: Timestamp de actualización
    """

    id: int | None = Field(
        default=None, primary_key=True, index=True, description="ID único del registro"
    )
