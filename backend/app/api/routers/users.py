"""
Router de usuarios.

Endpoints CRUD para gestión de usuarios.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.dependencies.auth import CurrentHR, CurrentUser
from app.core.exceptions import (
    AuthenticationException,
    AuthorizationException,
    ConflictException,
    NotFoundException,
    ValidationException,
)
from app.database import SessionDep
from app.models.user import UserRole
from app.schemas.user import (
    UserChangePassword,
    UserCreate,
    UserCreateByHR,
    UserListResponse,
    UserResponse,
    UserUpdate,
    UserUpdateSelf,
)
from app.services.user_service import UserService

router = APIRouter()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear usuario",
    description="Crea un nuevo usuario. HR puede crear cualquier usuario, empleados solo pueden auto-registrarse.",
)
async def create_user(
    user_data: UserCreate | UserCreateByHR,
    session: SessionDep,
    current_user: CurrentUser | None = None,
) -> UserResponse:
    """
    Crea un nuevo usuario.

    - **HR**: Puede crear usuarios con cualquier rol y definir is_active
    - **Empleado**: Solo puede auto-registrarse con rol EMPLOYEE
    - **Sin auth**: Permite auto-registro público (opcional, configurar en producción)

    Args:
        user_data: Datos del nuevo usuario
        session: Sesión de base de datos
        current_user: Usuario actual (opcional para auto-registro)

    Returns:
        UserResponse: Usuario creado

    Raises:
        HTTPException: Si hay conflicto de email o falta autorización
    """
    try:
        user_service = UserService(session)

        # Si hay usuario actual
        if current_user:
            # HR puede crear cualquier usuario
            if isinstance(user_data, UserCreateByHR):
                if not current_user.is_hr:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Solo HR puede usar UserCreateByHR",
                    )
                user = await user_service.create_user_by_hr(user_data)
            else:
                # Empleado puede auto-registrarse
                user = await user_service.create_user(user_data=user_data, created_by=current_user)
        else:
            # Auto-registro sin autenticación (solo EMPLOYEE)
            if isinstance(user_data, UserCreateByHR):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No se permite crear usuarios con este endpoint sin autenticación",
                )
            user = await user_service.create_user(user_data=user_data)

        return UserResponse.model_validate(user)

    except ConflictException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message) from e
    except AuthorizationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message) from e


@router.get(
    "/",
    response_model=UserListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar usuarios",
    description="Lista todos los usuarios (solo HR). Soporta paginación y filtros.",
)
async def list_users(
    session: SessionDep,
    _current_hr: CurrentHR,
    skip: Annotated[int, Query(ge=0, description="Número de registros a omitir")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Número máximo de registros")] = 10,
    role: Annotated[UserRole | None, Query(description="Filtrar por rol")] = None,
    is_active: Annotated[bool | None, Query(description="Filtrar por estado activo")] = None,
) -> UserListResponse:
    """
    Lista todos los usuarios con paginación y filtros.

    Solo accesible por usuarios HR.

    Args:
        session: Sesión de base de datos
        _current_hr: Usuario HR actual (no usado pero requerido para auth)
        skip: Registros a omitir (paginación)
        limit: Registros máximos a devolver
        role: Filtrar por rol (opcional)
        is_active: Filtrar por estado (opcional)

    Returns:
        UserListResponse: Lista paginada de usuarios
    """
    user_service = UserService(session)

    users = await user_service.get_all_users(skip=skip, limit=limit, role=role, is_active=is_active)

    total = await user_service.user_repo.count(role=role, is_active=is_active)

    return UserListResponse(
        users=[UserResponse.model_validate(user) for user in users],
        total=total,
        page=(skip // limit) + 1 if limit > 0 else 1,
        page_size=limit,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener perfil actual",
    description="Obtiene el perfil del usuario autenticado",
)
async def get_current_user_profile(current_user: CurrentUser) -> UserResponse:
    """
    Obtiene el perfil del usuario autenticado.

    Args:
        current_user: Usuario actual

    Returns:
        UserResponse: Perfil del usuario
    """
    return UserResponse.model_validate(current_user)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener usuario por ID",
    description="Obtiene un usuario específico. HR puede ver cualquiera, empleados solo a sí mismos.",
)
async def get_user(user_id: int, session: SessionDep, current_user: CurrentUser) -> UserResponse:
    """
    Obtiene un usuario por ID.

    - **HR**: Puede ver cualquier usuario
    - **Empleado**: Solo puede ver su propio perfil

    Args:
        user_id: ID del usuario
        session: Sesión de base de datos
        current_user: Usuario actual

    Returns:
        UserResponse: Datos del usuario

    Raises:
        HTTPException: Si no existe o no tiene permisos
    """
    try:
        user_service = UserService(session)
        user = await user_service.get_user_by_id(user_id)

        # Solo HR o el mismo usuario pueden ver el perfil
        if not current_user.is_hr and current_user.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para ver este usuario",
            )

        return UserResponse.model_validate(user)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message) from e


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Actualizar usuario (HR)",
    description="Actualiza un usuario completamente (solo HR)",
)
async def update_user(
    user_id: int, user_data: UserUpdate, session: SessionDep, current_hr: CurrentHR
) -> UserResponse:
    """
    Actualiza un usuario (solo HR).

    Args:
        user_id: ID del usuario a actualizar
        user_data: Nuevos datos del usuario
        session: Sesión de base de datos
        current_hr: Usuario HR actual

    Returns:
        UserResponse: Usuario actualizado

    Raises:
        HTTPException: Si no existe o hay conflicto de email
    """
    try:
        user_service = UserService(session)
        user = await user_service.update_user(
            user_id=user_id, user_data=user_data, updated_by=current_hr
        )

        return UserResponse.model_validate(user)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message) from e
    except ConflictException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message) from e


@router.patch(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Actualizar perfil propio",
    description="Actualiza el perfil del usuario autenticado",
)
async def update_own_profile(
    user_data: UserUpdateSelf, session: SessionDep, current_user: CurrentUser
) -> UserResponse:
    """
    Actualiza el perfil del usuario autenticado.

    Los usuarios solo pueden actualizar su propio nombre y email.

    Args:
        user_data: Datos a actualizar
        session: Sesión de base de datos
        current_user: Usuario actual

    Returns:
        UserResponse: Usuario actualizado

    Raises:
        HTTPException: Si hay conflicto de email
    """
    try:
        user_service = UserService(session)
        user = await user_service.update_self(
            user_id=current_user.id,  # type: ignore
            user_data=user_data,
        )

        return UserResponse.model_validate(user)

    except ConflictException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message) from e


@router.post(
    "/change-password",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Cambiar contraseña",
    description="Cambia la contraseña del usuario autenticado",
)
async def change_password(
    password_data: UserChangePassword, session: SessionDep, current_user: CurrentUser
) -> dict:
    """
    Cambia la contraseña del usuario autenticado.

    Requiere la contraseña actual para verificación.

    Args:
        password_data: Contraseña actual y nueva
        session: Sesión de base de datos
        current_user: Usuario actual

    Returns:
        dict: Mensaje de éxito

    Raises:
        HTTPException: Si la contraseña actual es incorrecta
    """
    try:
        user_service = UserService(session)
        await user_service.change_password(
            user_id=current_user.id,  # type: ignore
            current_password=password_data.current_password,
            new_password=password_data.new_password,
        )

        return {"message": "Contraseña actualizada exitosamente"}

    except AuthenticationException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message) from e


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar usuario",
    description="Elimina un usuario (solo HR, no puede eliminarse a sí mismo)",
)
async def delete_user(user_id: int, session: SessionDep, current_hr: CurrentHR) -> None:
    """
    Elimina un usuario (solo HR).

    Un usuario HR no puede eliminarse a sí mismo.

    Args:
        user_id: ID del usuario a eliminar
        session: Sesión de base de datos
        current_hr: Usuario HR actual

    Raises:
        HTTPException: Si no existe o intenta eliminarse a sí mismo
    """
    try:
        user_service = UserService(session)
        await user_service.delete_user(user_id=user_id, deleted_by=current_hr)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message) from e
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message) from e
