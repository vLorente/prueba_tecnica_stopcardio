"""
Modelos de base de datos.
"""

from app.models.base import BaseModel, TimestampMixin
from app.models.fichaje import Fichaje, FichajeStatus
from app.models.solicitud import Solicitud, SolicitudStatus, SolicitudTipo
from app.models.user import User, UserRole

__all__ = [
    "BaseModel",
    "Fichaje",
    "FichajeStatus",
    "Solicitud",
    "SolicitudStatus",
    "SolicitudTipo",
    "TimestampMixin",
    "User",
    "UserRole",
]
