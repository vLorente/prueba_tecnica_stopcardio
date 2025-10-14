# Changelog - Proyecto Backend HR

## [2.0.1] - 2025-10-14

### Corregido 🐛
- **Comando `make dev` actualizado para FastAPI CLI**
  - Cambiado de `uvicorn` a `fastapi dev`
  - Comando más moderno con mejor experiencia de desarrollo
  - Auto-reload habilitado por defecto
  - Mejor detección de cambios en el código

### Agregado ✨
- **`app/__init__.py`** - Archivo faltante para hacer `app` un paquete importable

### Archivos Modificados
- `Makefile` - Comando `dev` actualizado
- `app/__init__.py` - Creado

---

## [2.0.0] - 2025-10-14 - Iteración 2: Core de la Aplicación

### Agregado ✨

#### Core de la Aplicación
- **`app/core/config.py`** - Configuración centralizada con Pydantic Settings
  - Soporte para múltiples entornos (development/production/testing)
  - Validación automática de variables de entorno
  - Computed fields para helpers
  - Singleton pattern con lru_cache

- **`app/core/security.py`** - Módulo de seguridad
  - Hashing de contraseñas con bcrypt
  - Generación y validación de JWT tokens
  - Soporte para access y refresh tokens

- **`app/core/exceptions.py`** - Excepciones personalizadas
  - Jerarquía de excepciones del dominio
  - AppException base con detalles
  - Excepciones específicas (Auth, DB, Validation, etc.)

#### Base de Datos
- **`app/database.py`** - Configuración de base de datos asíncrona
  - AsyncEngine con SQLModel/SQLAlchemy
  - AsyncSessionmaker configurado
  - Dependency injection para FastAPI (SessionDep)
  - Manejo automático de commit/rollback
  - Función init_db() para desarrollo

- **`app/models/base.py`** - Modelo base para todas las tablas
  - TimestampMixin con created_at y updated_at
  - BaseModel con id y timestamps
  - Preparado para herencia

#### Aplicación FastAPI
- **`app/main.py`** - Aplicación principal reescrita
  - Lifespan events para inicialización
  - CORS middleware configurado
  - Health check endpoint
  - Documentación automática en /docs
  - Inicialización automática de DB en desarrollo

#### Alembic (Migraciones)
- **`alembic/`** - Sistema de migraciones configurado
  - `alembic.ini` - Configuración con timestamps en nombres
  - `alembic/env.py` - Soporte async para SQLModel
  - `alembic/versions/` - Primera migración generada
  - Render as batch para SQLite
  - Hook de Ruff para formateo automático

### Dependencias Instaladas 📦
- `pydantic-settings` - Configuración con validación
- `python-jose[cryptography]` - JWT tokens
- `passlib[bcrypt]` - Hashing de contraseñas
- `aiosqlite` - SQLite asíncrono

### Características 🚀
- ✅ Arquitectura limpia (core, models, api separados)
- ✅ Todo asíncrono (async/await)
- ✅ Type hints completos
- ✅ SOLID principles aplicados
- ✅ Dependency injection
- ✅ Configuración validada
- ✅ Migraciones automáticas

### Modificado 🔧
- **`.gitignore`** - Agregados archivos de BD y temporales
- **`app/core/config.py`** - Fixed CORS origins parsing (string → list)

### Documentación 📚
- **`docs/Iteracion2-COMPLETADA.md`** - Documentación completa de la iteración

---

## [1.0.2] - 2025-10-14

### Corregido 🐛
- **Script de verificación actualizado para usar `uv`**
  - Cambiado de `.venv/bin/python -m pip list` a `uv pip list`
  - Cambiado de `pip show` a `uv pip show`
  - Eliminada sección de Docker (no aplica en esta iteración)
  - Agregados comandos de `uv` en la ayuda
  - Mejorados mensajes para paquetes no instalados

### Justificación 💡
- `uv` es el gestor de paquetes del proyecto
- Comandos más consistentes con el workflow
- Mensajes de ayuda actualizados con `uv add`

### Archivos Modificados
- `scripts/check_environment.sh`

---

## [1.0.1] - 2025-10-14

### Optimizado ✨
- **DevContainer simplificado para desarrollo con SQLite**
  - Eliminado puerto 5432 (PostgreSQL) - no necesario en esta iteración
  - Solo puerto 8000 expuesto (FastAPI)
  - Eliminada extensión `mtxr.sqltools-driver-pg` (PostgreSQL)
  - Mantenida extensión `mtxr.sqltools-driver-sqlite`
  - Actualizada documentación en `setup-environment.md` y `Iteracion1-COMPLETADA.md`

### Justificación 💡
En la Iteración 1 usamos **SQLite** para desarrollo:
- ✅ Sin dependencias externas (sin necesidad de PostgreSQL)
- ✅ Base de datos local simple (archivo `hr_dev.db`)
- ✅ Tests más rápidos (SQLite en memoria)
- ✅ Desarrollo ágil sin overhead de contenedores de BD
- ✅ SQLModel permite migración transparente a PostgreSQL en producción

### Archivos Modificados
- `.devcontainer/devcontainer.json`
- `docs/setup-environment.md`
- `docs/Iteracion1-COMPLETADA.md`

---

## [1.0.0] - 2025-10-14

### Agregado ✨
- Script de instalación automática (`scripts/start_enviroment.sh`)
- Script de verificación del entorno (`scripts/check_environment.sh`)
- DevContainer configurado con Python 3.13
- Makefile con 15+ comandos útiles
- Plantilla de variables de entorno (`.env.example`)
- Documentación completa:
  - `scripts/README.md`
  - `docs/setup-environment.md`
  - `docs/Iteracion1-COMPLETADA.md`
  - `QUICKSTART.md`

### Características 🚀
- Instalación automática de `uv` (gestor de paquetes moderno)
- Verificación de Python 3.13
- Instalación de dependencias del sistema
- Configuración automática de variables de entorno
- Sincronización de dependencias Python
- Output con colores y manejo de errores
- Idempotencia (se puede ejecutar múltiples veces)

### Stack Técnico 🔧
- **Python**: 3.13
- **Gestor de paquetes**: uv (10-100x más rápido que pip)
- **Base de datos dev**: SQLite
- **Framework**: FastAPI (preparado)
- **ORM**: SQLModel (preparado)
- **DevContainer**: VS Code con extensiones preconfiguradas

### Principios Aplicados 📐
- ✅ DRY (Don't Repeat Yourself)
- ✅ Automatización total
- ✅ Documentación completa
- ✅ Idempotencia
- ✅ Feedback visual claro
- ✅ Manejo robusto de errores

---

**Nota**: Docker y PostgreSQL se implementarán en iteraciones futuras cuando sea necesario para producción.
