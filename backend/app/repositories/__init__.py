"""
Repositorios - Capa de acceso a datos.

Implementa el patrón Repository para abstraer la persistencia.
"""

from app.repositories.fichaje_repository import FichajeRepository
from app.repositories.solicitud_repository import SolicitudRepository
from app.repositories.user_repository import UserRepository

__all__ = ["FichajeRepository", "SolicitudRepository", "UserRepository"]
