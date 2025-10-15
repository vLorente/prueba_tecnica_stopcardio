"""
Schemas Pydantic para la API.

Modelos de entrada/salida separados de los modelos de base de datos.
"""

from app.schemas.fichaje import (
    FichajeApproval,
    FichajeCheckIn,
    FichajeCheckOut,
    FichajeCorrection,
    FichajeResponse,
)
from app.schemas.solicitud import (
    SolicitudCreate,
    SolicitudFilters,
    SolicitudListResponse,
    SolicitudResponse,
    SolicitudReview,
    SolicitudUpdate,
    VacationBalance,
)
from app.schemas.user import (
    UserBase,
    UserChangePassword,
    UserCreate,
    UserCreateByHR,
    UserListResponse,
    UserLogin,
    UserResponse,
    UserResponseWithPassword,
    UserUpdate,
    UserUpdateSelf,
)

__all__ = [
    "FichajeApproval",
    "FichajeCheckIn",
    "FichajeCheckOut",
    "FichajeCorrection",
    "FichajeResponse",
    "SolicitudCreate",
    "SolicitudFilters",
    "SolicitudListResponse",
    "SolicitudResponse",
    "SolicitudReview",
    "SolicitudUpdate",
    "UserBase",
    "UserChangePassword",
    "UserCreate",
    "UserCreateByHR",
    "UserListResponse",
    "UserLogin",
    "UserResponse",
    "UserResponseWithPassword",
    "UserUpdate",
    "UserUpdateSelf",
    "VacationBalance",
]
