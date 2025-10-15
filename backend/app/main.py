"""
Aplicación principal del sistema de gestión de RRHH.

Backend desarrollado con FastAPI, SQLModel y arquitectura limpia.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers import auth_router, users_router
from app.api.routers.fichajes import router as fichajes_router
from app.api.routers.vacaciones import router as vacaciones_router
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationException,
    AuthorizationException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación.

    Inicializa la base de datos al inicio y limpia recursos al finalizar.
    """
    # Startup
    # NOTA: Las tablas se crean mediante migraciones de Alembic
    # No usar init_db() automáticamente para evitar inconsistencias
    # Ejecutar manualmente: make migrate

    # if settings.is_development:
    #     # DESHABILITADO: Usar migraciones de Alembic en su lugar
    #     await init_db()

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


# Configurar exception handlers
@app.exception_handler(BadRequestException)
async def bad_request_exception_handler(request: Request, exc: BadRequestException):
    """Handler para BadRequestException."""
    return JSONResponse(
        status_code=400,
        content={"detail": exc.message, "error_details": exc.details},
    )


@app.exception_handler(NotFoundException)
async def not_found_exception_handler(request: Request, exc: NotFoundException):
    """Handler para NotFoundException."""
    return JSONResponse(
        status_code=404,
        content={"detail": exc.message, "error_details": exc.details},
    )


@app.exception_handler(ForbiddenException)
async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
    """Handler para ForbiddenException."""
    return JSONResponse(
        status_code=403,
        content={"detail": exc.message, "error_details": exc.details},
    )


@app.exception_handler(ConflictException)
async def conflict_exception_handler(request: Request, exc: ConflictException):
    """Handler para ConflictException."""
    return JSONResponse(
        status_code=409,
        content={"detail": exc.message, "error_details": exc.details},
    )


@app.exception_handler(AuthenticationException)
async def authentication_exception_handler(request: Request, exc: AuthenticationException):
    """Handler para AuthenticationException."""
    return JSONResponse(
        status_code=401,
        content={"detail": exc.message, "error_details": exc.details},
    )


@app.exception_handler(AuthorizationException)
async def authorization_exception_handler(request: Request, exc: AuthorizationException):
    """Handler para AuthorizationException."""
    return JSONResponse(
        status_code=403,
        content={"detail": exc.message, "error_details": exc.details},
    )


@app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException):
    """Handler para ValidationException."""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.message, "error_details": exc.details},
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
app.include_router(fichajes_router, prefix="/api/fichajes", tags=["Fichajes"])
app.include_router(vacaciones_router, prefix="/api", tags=["Vacaciones"])


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
