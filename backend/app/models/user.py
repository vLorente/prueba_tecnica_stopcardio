"""
Modelo de Usuario.

Define la estructura de datos de usuarios en el sistema.
Incluye roles para control de acceso.
"""

from enum import Enum

from sqlalchemy import String
from sqlmodel import Column, Field

from app.models.base import BaseModel


class UserRole(str, Enum):
    """
    Roles de usuario en el sistema.

    - EMPLOYEE: Empleado estándar (puede ver sus propios datos)
    - HR: Recursos Humanos (acceso completo al sistema)
    """

    EMPLOYEE = "EMPLOYEE"
    HR = "HR"


class User(BaseModel, table=True):
    """
    Modelo de Usuario.

    Representa un usuario del sistema con autenticación y roles.
    """

    # Información básica
    email: str = Field(
        sa_column=Column(String(255), unique=True, index=True, nullable=False),
        description="Email del usuario (usado para login)"
    )
    full_name: str = Field(
        sa_column=Column(String(255), nullable=False),
        description="Nombre completo del usuario"
    )

    # Autenticación
    hashed_password: str = Field(
        sa_column=Column(String(255), nullable=False),
        description="Contraseña hasheada con bcrypt"
    )

    # Role y permisos
    role: UserRole = Field(
        default=UserRole.EMPLOYEE,
        description="Rol del usuario en el sistema"
    )

    # Estado
    is_active: bool = Field(
        default=True,
        description="Si el usuario está activo en el sistema"
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
