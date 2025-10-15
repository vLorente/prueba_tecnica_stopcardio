"""
Modelo de Usuario.

Define la estructura de datos de usuarios en el sistema.
Incluye roles para control de acceso.
"""

from enum import Enum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.fichaje import Fichaje


class UserRole(str, Enum):
    """
    Roles de usuario en el sistema.

    - EMPLOYEE: Empleado estándar (puede ver sus propios datos)
    - HR: Recursos Humanos (acceso completo al sistema)
    """

    EMPLOYEE = "employee"
    HR = "hr"


class User(BaseModel, table=True):
    """
    Modelo de Usuario.

    Representa un usuario del sistema con autenticación y roles.
    """

    # Información básica
    email: str = Field(
        unique=True,
        index=True,
        description="Email del usuario (usado para login)",
    )
    full_name: str = Field(description="Nombre completo del usuario")

    # Autenticación
    hashed_password: str = Field(description="Contraseña hasheada con bcrypt")

    # Role y permisos
    role: UserRole = Field(default=UserRole.EMPLOYEE, description="Rol del usuario en el sistema")

    # Estado
    is_active: bool = Field(default=True, description="Si el usuario está activo en el sistema")

    # Relaciones
    fichajes: list["Fichaje"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"foreign_keys": "Fichaje.user_id"},
    )

    def __repr__(self) -> str:
        """Representación en string del usuario."""
        return f"<User {self.email} ({self.role})>"

    @property
    def is_hr(self) -> bool:
        """Verifica si el usuario tiene rol de HR."""
        return self.role == UserRole.HR

    @property
    def is_employee(self) -> bool:
        """Verifica si el usuario es empleado."""
        return self.role == UserRole.EMPLOYEE
