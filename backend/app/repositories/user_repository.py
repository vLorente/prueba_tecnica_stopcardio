"""
Repositorio de Usuarios.

Capa de acceso a datos para el modelo User.
Implementa el patrón Repository para abstraer la lógica de persistencia.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException
from app.models.user import User, UserRole


class UserRepository:
    """
    Repositorio para operaciones CRUD de usuarios.

    Maneja toda la interacción con la base de datos para el modelo User.
    """

    def __init__(self, session: AsyncSession):
        """
        Inicializa el repositorio.

        Args:
            session: Sesión asíncrona de base de datos
        """
        self.session = session

    async def create(self, user: User) -> User:
        """
        Crea un nuevo usuario en la base de datos.

        Args:
            user: Instancia de User a crear

        Returns:
            User: Usuario creado con ID asignado

        Raises:
            ConflictException: Si el email ya existe
        """
        # Verificar que el email no exista
        existing = await self.get_by_email(user.email)
        if existing:
            raise ConflictException(
                message=f"El email {user.email} ya está registrado", details={"email": user.email}
            )

        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        """
        Obtiene un usuario por su ID.

        Args:
            user_id: ID del usuario

        Returns:
            User | None: Usuario encontrado o None
        """
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """
        Obtiene un usuario por su email.

        Args:
            email: Email del usuario

        Returns:
            User | None: Usuario encontrado o None
        """
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        role: UserRole | None = None,
        is_active: bool | None = None,
    ) -> list[User]:
        """
        Obtiene una lista de usuarios con filtros opcionales.

        Args:
            skip: Número de registros a saltar (paginación)
            limit: Número máximo de registros a retornar
            role: Filtrar por rol (opcional)
            is_active: Filtrar por estado activo (opcional)

        Returns:
            list[User]: Lista de usuarios
        """
        query = select(User).offset(skip).limit(limit)

        if role is not None:
            query = query.where(User.role == role)

        if is_active is not None:
            query = query.where(User.is_active == is_active)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(self, role: UserRole | None = None, is_active: bool | None = None) -> int:
        """
        Cuenta el total de usuarios con filtros opcionales.

        Args:
            role: Filtrar por rol (opcional)
            is_active: Filtrar por estado activo (opcional)

        Returns:
            int: Total de usuarios
        """
        from sqlalchemy import func

        query = select(func.count(User.id))

        if role is not None:
            query = query.where(User.role == role)

        if is_active is not None:
            query = query.where(User.is_active == is_active)

        result = await self.session.execute(query)
        return result.scalar_one()

    async def update(self, user: User) -> User:
        """
        Actualiza un usuario en la base de datos.

        Args:
            user: Usuario con los cambios a aplicar

        Returns:
            User: Usuario actualizado
        """
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def delete(self, user_id: int) -> bool:
        """
        Elimina un usuario de la base de datos.

        Args:
            user_id: ID del usuario a eliminar

        Returns:
            bool: True si se eliminó, False si no se encontró
        """
        user = await self.get_by_id(user_id)
        if not user:
            return False

        await self.session.delete(user)
        await self.session.flush()
        return True

    async def exists_by_email(self, email: str, exclude_id: int | None = None) -> bool:
        """
        Verifica si existe un usuario con el email dado.

        Args:
            email: Email a verificar
            exclude_id: ID de usuario a excluir de la búsqueda (para updates)

        Returns:
            bool: True si existe, False si no
        """
        query = select(User.id).where(User.email == email)

        if exclude_id is not None:
            query = query.where(User.id != exclude_id)

        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None
