"""
Schemas Pydantic para usuarios.

Define los modelos de entrada/salida para la API de usuarios.
Separados del modelo de base de datos para mayor flexibilidad.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


# Schemas base
class UserBase(BaseModel):
    """Schema base con campos comunes de usuario."""

    email: EmailStr = Field(description="Email del usuario", examples=["usuario@example.com"])
    full_name: str = Field(
        min_length=1,
        max_length=255,
        description="Nombre completo del usuario",
        examples=["Juan Pérez"],
    )


# Schemas para creación
class UserCreate(UserBase):
    """Schema para crear un usuario."""

    password: str = Field(
        min_length=8,
        max_length=100,
        description="Contraseña del usuario (mínimo 8 caracteres)",
        examples=["SecurePass123!"],
    )
    role: UserRole = Field(default=UserRole.EMPLOYEE, description="Rol del usuario")


class UserCreateByHR(UserCreate):
    """
    Schema para que HR cree usuarios.

    Permite especificar si el usuario está activo desde la creación.
    """

    is_active: bool = Field(default=True, description="Si el usuario está activo")


# Schemas para actualización
class UserUpdate(BaseModel):
    """Schema para actualizar un usuario."""

    email: EmailStr | None = Field(default=None, description="Nuevo email del usuario")
    full_name: str | None = Field(
        default=None, min_length=1, max_length=255, description="Nuevo nombre completo"
    )
    password: str | None = Field(
        default=None, min_length=8, max_length=100, description="Nueva contraseña"
    )
    role: UserRole | None = Field(default=None, description="Nuevo rol")
    is_active: bool | None = Field(default=None, description="Nuevo estado activo")


class UserUpdateSelf(BaseModel):
    """
    Schema para que un usuario actualice sus propios datos.

    No permite cambiar rol ni estado activo.
    """

    full_name: str | None = Field(
        default=None, min_length=1, max_length=255, description="Nuevo nombre completo"
    )
    password: str | None = Field(
        default=None, min_length=8, max_length=100, description="Nueva contraseña"
    )


# Schemas de respuesta
class UserResponse(UserBase):
    """Schema de respuesta con información pública del usuario."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="ID del usuario")
    role: UserRole = Field(description="Rol del usuario")
    is_active: bool = Field(description="Si el usuario está activo")
    created_at: datetime = Field(description="Fecha de creación")
    updated_at: datetime = Field(description="Fecha de última actualización")


class UserResponseWithPassword(UserResponse):
    """
    Schema de respuesta que incluye el hash de la contraseña.

    SOLO para uso interno del sistema, NUNCA exponer en la API.
    """

    hashed_password: str = Field(description="Contraseña hasheada")


# Schema para login
class UserLogin(BaseModel):
    """Schema para login de usuario."""

    email: EmailStr = Field(description="Email del usuario", examples=["usuario@example.com"])
    password: str = Field(description="Contraseña del usuario", examples=["SecurePass123!"])


# Schema para cambiar contraseña
class UserChangePassword(BaseModel):
    """Schema para cambiar la contraseña."""

    current_password: str = Field(description="Contraseña actual", examples=["OldPassword123!"])
    new_password: str = Field(
        min_length=8,
        max_length=100,
        description="Nueva contraseña (mínimo 8 caracteres)",
        examples=["NewPassword123!"],
    )


# Schema para lista de usuarios
class UserListResponse(BaseModel):
    """Schema de respuesta para lista de usuarios."""

    users: list[UserResponse] = Field(description="Lista de usuarios")
    total: int = Field(description="Total de usuarios")
    page: int = Field(description="Página actual", ge=1)
    page_size: int = Field(description="Tamaño de página", ge=1)
