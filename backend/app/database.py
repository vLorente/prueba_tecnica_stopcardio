"""
Configuración de la base de datos.

Maneja la conexión a la base de datos usando SQLModel (basado en SQLAlchemy).
Implementa el patrón de AsyncSession para operaciones asíncronas.
"""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.core.config import settings

# Motor de base de datos asíncrono
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    future=True,
)

# Session maker para crear sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """
    Inicializa la base de datos creando todas las tablas.

    Solo se debe usar en desarrollo. En producción usar Alembic.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession]:
    """
    Dependency para obtener una sesión de base de datos.

    Yields:
        AsyncSession: Sesión de base de datos asíncrona

    Example:
        @app.get("/users")
        async def get_users(session: AsyncSession = Depends(get_session)):
            # usar session aquí
            pass
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Type hint para dependency injection
SessionDep = Annotated[AsyncSession, Depends(get_session)]
