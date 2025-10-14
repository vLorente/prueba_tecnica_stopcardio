"""
Aplicación principal del sistema de gestión de RRHH.

Backend desarrollado con FastAPI, SQLModel y arquitectura limpia.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth_router, users_router
from app.core.config import settings
from app.database import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación.

    Inicializa la base de datos al inicio y limpia recursos al finalizar.
    """
    # Startup
    if settings.is_development:
        # En desarrollo, crear tablas automáticamente
        await init_db()

    yield

    # Shutdown
    # Aquí se pueden agregar tareas de limpieza
# Crear instancia de FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Sistema de gestión de fichajes y recursos humanos",
    lifespan=lifespan,
    debug=settings.debug,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Verifica el estado de la aplicación.

    Returns:
        dict: Estado de la aplicación
    """
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.env,
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def read_root():
    """
    Endpoint raíz de la API.

    Returns:
        dict: Información básica de la API
    """
    return {
        "message": f"Bienvenido a {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }
