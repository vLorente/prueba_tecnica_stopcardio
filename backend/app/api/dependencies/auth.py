"""
Dependencies de autenticación.

Funciones para obtener el usuario actual desde el token JWT.
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer as FastAPIHTTPBearer

from app.core.exceptions import AuthenticationException
from app.core.security import decode_token
from app.database import SessionDep
from app.models.user import User, UserRole
from app.services.user_service import UserService


class HTTPBearer(FastAPIHTTPBearer):
    """Custom HTTPBearer that returns 401 instead of 403 when credentials are missing."""

    def _raise_unauthorized(self) -> None:
        """Raise 401 Unauthorized exception."""
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionaron credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )

    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials:  # type: ignore[override]
        """Override to return 401 instead of 403."""
        try:
            result = await super().__call__(request)
        except HTTPException as exc:
            if exc.status_code == status.HTTP_403_FORBIDDEN:
                self._raise_unauthorized()
            raise

        if result is None:
            self._raise_unauthorized()

        return result


# Security scheme para JWT Bearer
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)], session: SessionDep
) -> User:
    """
    Obtiene el usuario actual desde el token JWT.

    Args:
        credentials: Credenciales HTTP Bearer (token)
        session: Sesión de base de datos

    Returns:
        User: Usuario autenticado

    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    try:
        # Decodificar token
        payload = decode_token(credentials.credentials)
        user_id: int | None = payload.get("sub")

        if user_id is None:
            raise HTTPException(  # noqa: TRY301
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Obtener usuario
        user_service = UserService(session)
        user = await user_service.get_user_by_id(int(user_id))

        # Verificar que el usuario esté activo
        # En este punto, el token es válido pero el usuario no puede acceder
        if not user.is_active:
            raise HTTPException(  # noqa: TRY301
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario inactivo",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Obtiene el usuario actual verificando que esté activo.

    Args:
        current_user: Usuario actual

    Returns:
        User: Usuario activo

    Raises:
        HTTPException: Si el usuario está inactivo
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")
    return current_user


async def require_hr(current_user: Annotated[User, Depends(get_current_active_user)]) -> User:
    """
    Requiere que el usuario actual sea HR.

    Args:
        current_user: Usuario actual

    Returns:
        User: Usuario HR

    Raises:
        HTTPException: Si el usuario no es HR
    """
    if current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de HR para esta operación",
        )
    return current_user


# Type hints para dependency injection
CurrentUser = Annotated[User, Depends(get_current_active_user)]
CurrentHR = Annotated[User, Depends(require_hr)]
