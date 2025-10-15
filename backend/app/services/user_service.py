"""
Servicio de Usuarios.

Contiene la lógica de negocio para operaciones con usuarios.
Actúa como capa intermedia entre los routers y los repositorios.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuthenticationException,
    AuthorizationException,
    ConflictException,
    NotFoundException,
    ValidationException,
)
from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserCreateByHR, UserUpdate, UserUpdateSelf


class UserService:
    """
    Servicio para operaciones de negocio con usuarios.

    Implementa las reglas de negocio y coordina entre repositorios.
    """

    def __init__(self, session: AsyncSession):
        """
        Inicializa el servicio.

        Args:
            session: Sesión asíncrona de base de datos
        """
        self.session = session
        self.user_repo = UserRepository(session)

    async def create_user(self, user_data: UserCreate, created_by: User | None = None) -> User:
        """
        Crea un nuevo usuario.

        Args:
            user_data: Datos del usuario a crear
            created_by: Usuario que crea (opcional, para validación)

        Returns:
            User: Usuario creado

        Raises:
            ConflictException: Si el email ya existe
            AuthorizationException: Si intenta crear HR sin ser HR
        """
        # Solo HR puede crear otros usuarios HR
        if user_data.role == UserRole.HR and (not created_by or not created_by.is_hr):
            raise AuthorizationException(
                message="Solo HR puede crear usuarios con rol HR", details={"required_role": "HR"}
            )

        # Crear usuario
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role,
            is_active=True,
        )

        return await self.user_repo.create(user)

    async def create_user_by_hr(self, user_data: UserCreateByHR) -> User:
        """
        Crea un nuevo usuario (por HR).

        Permite especificar el estado is_active desde la creación.

        Args:
            user_data: Datos del usuario a crear

        Returns:
            User: Usuario creado
        """
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role,
            is_active=user_data.is_active,
        )

        return await self.user_repo.create(user)

    async def get_user_by_id(self, user_id: int) -> User:
        """
        Obtiene un usuario por ID.

        Args:
            user_id: ID del usuario

        Returns:
            User: Usuario encontrado

        Raises:
            NotFoundException: Si no se encuentra el usuario
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(
                message=f"Usuario con ID {user_id} no encontrado", details={"user_id": user_id}
            )
        return user

    async def get_user_by_email(self, email: str) -> User:
        """
        Obtiene un usuario por email.

        Args:
            email: Email del usuario

        Returns:
            User: Usuario encontrado

        Raises:
            NotFoundException: Si no se encuentra el usuario
        """
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundException(
                message=f"Usuario con email {email} no encontrado", details={"email": email}
            )
        return user

    async def get_all_users(
        self,
        skip: int = 0,
        limit: int = 100,
        role: UserRole | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[User], int]:
        """
        Obtiene lista de usuarios con paginación.

        Args:
            skip: Registros a saltar
            limit: Máximo de registros
            role: Filtrar por rol (opcional)
            is_active: Filtrar por estado (opcional)

        Returns:
            tuple[list[User], int]: Lista de usuarios y total
        """
        users = await self.user_repo.get_all(skip=skip, limit=limit, role=role, is_active=is_active)
        total = await self.user_repo.count(role=role, is_active=is_active)
        return users, total

    async def update_user(self, user_id: int, user_data: UserUpdate, updated_by: User) -> User:
        """
        Actualiza un usuario (por HR).

        Args:
            user_id: ID del usuario a actualizar
            user_data: Datos a actualizar
            updated_by: Usuario que actualiza

        Returns:
            User: Usuario actualizado

        Raises:
            NotFoundException: Si no se encuentra el usuario
            AuthorizationException: Si no es HR
            ConflictException: Si el nuevo email ya existe
        """
        # Solo HR puede actualizar usuarios
        if not updated_by.is_hr:
            raise AuthorizationException(
                message="Solo HR puede actualizar usuarios", details={"required_role": "HR"}
            )

        user = await self.get_user_by_id(user_id)

        # Actualizar campos
        if user_data.email is not None:
            # Verificar que el email no exista
            if await self.user_repo.exists_by_email(user_data.email, exclude_id=user_id):
                raise ConflictException(
                    message=f"El email {user_data.email} ya está registrado",
                    details={"email": user_data.email},
                )
            user.email = user_data.email

        if user_data.full_name is not None:
            user.full_name = user_data.full_name

        if user_data.password is not None:
            user.hashed_password = get_password_hash(user_data.password)

        if user_data.role is not None:
            user.role = user_data.role

        if user_data.is_active is not None:
            user.is_active = user_data.is_active

        return await self.user_repo.update(user)

    async def update_self(self, user_id: int, user_data: UserUpdateSelf) -> User:
        """
        Actualiza los propios datos del usuario.

        Args:
            user_id: ID del usuario a actualizar
            user_data: Datos a actualizar

        Returns:
            User: Usuario actualizado

        Raises:
            NotFoundException: Si no se encuentra el usuario
        """
        user = await self.get_user_by_id(user_id)

        # Actualizar campos permitidos
        if user_data.full_name is not None:
            user.full_name = user_data.full_name

        if user_data.password is not None:
            user.hashed_password = get_password_hash(user_data.password)

        return await self.user_repo.update(user)

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> User:
        """
        Cambia la contraseña del usuario.

        Args:
            user_id: ID del usuario
            current_password: Contraseña actual
            new_password: Nueva contraseña

        Returns:
            User: Usuario actualizado

        Raises:
            NotFoundException: Si no se encuentra el usuario
            AuthenticationException: Si la contraseña actual es incorrecta
        """
        user = await self.get_user_by_id(user_id)

        # Verificar contraseña actual
        if not verify_password(current_password, user.hashed_password):
            raise AuthenticationException(
                message="Contraseña actual incorrecta", details={"field": "current_password"}
            )

        # Actualizar contraseña
        user.hashed_password = get_password_hash(new_password)
        return await self.user_repo.update(user)

    async def delete_user(self, user_id: int, deleted_by: User) -> bool:
        """
        Elimina un usuario.

        Args:
            user_id: ID del usuario a eliminar
            deleted_by: Usuario que elimina

        Returns:
            bool: True si se eliminó

        Raises:
            AuthorizationException: Si no es HR
            ValidationException: Si intenta eliminarse a sí mismo
        """
        # Solo HR puede eliminar usuarios
        if not deleted_by.is_hr:
            raise AuthorizationException(
                message="Solo HR puede eliminar usuarios", details={"required_role": "HR"}
            )

        # No puede eliminarse a sí mismo
        if user_id == deleted_by.id:
            raise ValidationException(
                message="No puedes eliminarte a ti mismo", details={"user_id": user_id}
            )

        deleted = await self.user_repo.delete(user_id)

        if not deleted:
            raise NotFoundException(
                message=f"Usuario con ID {user_id} no encontrado", details={"user_id": user_id}
            )

        return deleted

    async def authenticate_user(self, email: str, password: str) -> User:
        """
        Autentica un usuario por email y contraseña.

        Args:
            email: Email del usuario
            password: Contraseña en texto plano

        Returns:
            User: Usuario autenticado

        Raises:
            AuthenticationException: Si las credenciales son inválidas
        """
        user = await self.user_repo.get_by_email(email)

        if not user:
            raise AuthenticationException(
                message="Credenciales inválidas", details={"field": "email"}
            )

        if not verify_password(password, user.hashed_password):
            raise AuthenticationException(
                message="Credenciales inválidas", details={"field": "password"}
            )

        if not user.is_active:
            raise AuthenticationException(message="Usuario inactivo", details={"email": email})

        return user
