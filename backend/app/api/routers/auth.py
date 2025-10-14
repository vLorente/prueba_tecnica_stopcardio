"""
Router de autenticación.

Endpoints para login, logout y refresh tokens.
"""

from fastapi import APIRouter, HTTPException, status

from app.api.dependencies.auth import CurrentUser
from app.core.exceptions import AuthenticationException
from app.core.security import create_access_token
from app.database import SessionDep
from app.schemas.user import UserLogin, UserResponse
from app.services.user_service import UserService

router = APIRouter()


@router.post(
    "/login",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Iniciar sesión",
    description="Autenticar usuario con email y contraseña, devuelve JWT token",
)
async def login(
    credentials: UserLogin,
    session: SessionDep
) -> dict:
    """
    Inicia sesión con email y contraseña.

    Args:
        credentials: Email y contraseña
        session: Sesión de base de datos

    Returns:
        dict: Access token y tipo de token

    Raises:
        HTTPException: Si las credenciales son inválidas
    """
    try:
        user_service = UserService(session)
        user = await user_service.authenticate_user(
            email=credentials.email,
            password=credentials.password
        )

        # Crear access token
        access_token = create_access_token(data={"sub": str(user.id)})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user)
        }

    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Cerrar sesión",
    description="Cierra la sesión del usuario actual (token invalidation)",
)
async def logout(
    _current_user: CurrentUser
) -> dict:
    """
    Cierra la sesión del usuario actual.

    En esta implementación básica, el logout es del lado del cliente
    (eliminar el token). Para logout del lado del servidor se necesitaría
    una blacklist de tokens.

    Args:
        _current_user: Usuario actual (no usado pero requerido para auth)

    Returns:
        dict: Mensaje de éxito
    """
    return {
        "message": "Sesión cerrada exitosamente",
        "detail": "Elimine el token del lado del cliente"
    }
@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener perfil actual",
    description="Obtiene la información del usuario autenticado",
)
async def get_me(
    current_user: CurrentUser
) -> UserResponse:
    """
    Obtiene el perfil del usuario autenticado.

    Args:
        current_user: Usuario actual

    Returns:
        UserResponse: Datos del usuario actual
    """
    return UserResponse.model_validate(current_user)
