# ============================================================================
# Multi-stage Dockerfile para FastAPI con uv
# Backend - Sistema de Gestión de RRHH
# ============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Instala dependencias
# -----------------------------------------------------------------------------
FROM python:3.13-slim AS builder

# Metadatos
LABEL maintainer="StopCardio HR Team"
LABEL description="HR Management System - Backend API"

# Variables de entorno para Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependencias de build necesarias para compilar paquetes de Python
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar uv (package manager)
RUN pip install uv

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY pyproject.toml uv.lock ./

# Instalar dependencias en un virtualenv
# Usar uv pip install para mayor compatibilidad
RUN uv venv /app/.venv && \
    . /app/.venv/bin/activate && \
    uv pip install -r pyproject.toml

# -----------------------------------------------------------------------------
# Stage 2: Runtime - Imagen final optimizada
# -----------------------------------------------------------------------------
FROM python:3.13-slim

# Variables de entorno para Python y la aplicación
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app:$PYTHONPATH"

# Instalar dependencias del sistema necesarias para PostgreSQL
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar uv para poder ejecutar comandos del Makefile
RUN pip install --no-cache-dir uv

# Crear usuario no-root para ejecutar la aplicación
RUN useradd -m -u 1000 -s /bin/bash appuser

# Crear directorio de trabajo
WORKDIR /app

# Copiar virtualenv desde el builder
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# Copiar código de la aplicación
COPY --chown=appuser:appuser app/ /app/app/
COPY --chown=appuser:appuser alembic/ /app/alembic/
COPY --chown=appuser:appuser scripts/ /app/scripts/
COPY --chown=appuser:appuser alembic.ini /app/alembic.ini
COPY --chown=appuser:appuser Makefile /app/Makefile

# Dar permisos de ejecución a los scripts
RUN chmod +x /app/scripts/*.sh || true

# Crear directorio para logs (opcional)
RUN mkdir -p /app/logs && chown appuser:appuser /app/logs

# Instalar make para usar comandos del Makefile
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends make && \
    rm -rf /var/lib/apt/lists/*

# Cambiar a usuario no-root
USER appuser

# Exponer puerto
EXPOSE 8000

# Healthcheck para verificar que la aplicación está funcionando
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando por defecto: ejecutar migraciones y luego el servidor usando Makefile
# make migrate + make prod (sin seed automático por problemas de timezone)
# Para ejecutar seed manualmente: docker-compose exec backend make seed-clear
CMD ["sh", "-c", "make init_prod_seed"]
