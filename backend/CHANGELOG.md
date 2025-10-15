# Changelog - Proyecto Backend HR

## [1.0.6] - 2025-10-15 - Iteración 6: Módulo de Vacaciones y Solicitudes Completo

### Agregado ✨
- **Módulo de Solicitudes** - Sistema completo de gestión de vacaciones y ausencias
  - `app/models/solicitud.py` - Modelo Solicitud con 4 tipos y 4 estados
  - `app/schemas/solicitud.py` - 6 schemas (SolicitudCreate, SolicitudUpdate, SolicitudReview, SolicitudFilters, SolicitudResponse, SolicitudListResponse, VacationBalanceResponse)
  - `app/repositories/solicitud_repository.py` - 12 métodos de acceso a datos
  - `app/services/solicitud_service.py` - 10 operaciones con 15+ reglas de negocio
  - `app/api/routers/vacaciones.py` - 10 endpoints RESTful

- **Enum SolicitudTipo**: Tipos de solicitud
  - `vacation` - Vacaciones
  - `sick_leave` - Baja médica
  - `personal` - Asuntos personales
  - `other` - Otros

- **Enum SolicitudStatus**: Estados de solicitud
  - `pending` - Pendiente de revisión
  - `approved` - Aprobada por HR
  - `rejected` - Rechazada por HR
  - `cancelled` - Cancelada por el empleado

- **10 Endpoints de Vacaciones**:
  - `POST /api/vacaciones/` - Crear solicitud (CurrentUser)
  - `GET /api/vacaciones/me` - Mis solicitudes con filtros (CurrentUser)
  - `GET /api/vacaciones/{id}` - Solicitud por ID (CurrentUser/CurrentHR)
  - `PUT /api/vacaciones/{id}` - Actualizar solicitud pendiente (CurrentUser)
  - `DELETE /api/vacaciones/{id}` - Cancelar solicitud (CurrentUser)
  - `POST /api/vacaciones/{id}/review` - Aprobar/rechazar (CurrentHR)
  - `GET /api/vacaciones/me/balance` - Mi balance de vacaciones (CurrentUser)
  - `GET /api/vacaciones/pending` - Solicitudes pendientes (CurrentHR)
  - `GET /api/vacaciones/` - Todas las solicitudes con filtros (CurrentHR)
  - `GET /api/vacaciones/balance/{user_id}` - Balance de empleado (CurrentHR)

- **Tests Completos**: `tests/test_solicitudes.py`
  - 39 tests organizados en 8 clases (100% passing)
  - TestCreateSolicitud (9 tests)
  - TestListSolicitudes (5 tests)
  - TestGetSolicitud (4 tests)
  - TestUpdateSolicitud (5 tests)
  - TestCancelSolicitud (3 tests)
  - TestReviewSolicitud (4 tests)
  - TestVacationBalance (5 tests)
  - TestHRListSolicitudes (4 tests)

- **Seed Data**: 15 solicitudes de ejemplo
  - 5 aprobadas (3 vacation, 1 sick_leave, 1 personal)
  - 4 pendientes (diferentes tipos)
  - 3 rechazadas con comentarios
  - 2 canceladas
  - 1 con fechas futuras

### Reglas de Negocio Implementadas 📏
- **RN-S01**: Usuario debe estar activo para crear solicitudes
- **RN-S02**: Fecha inicio debe ser >= fecha actual
- **RN-S03**: Fecha fin debe ser >= fecha inicio
- **RN-S04**: Motivo mínimo 10 caracteres
- **RN-S05**: No puede haber solapamiento de fechas aprobadas
- **RN-S06**: Balance de vacaciones suficiente para tipo vacation
- **RN-S07**: Solo el empleado puede actualizar sus solicitudes pendientes
- **RN-S08**: Solo solicitudes PENDING pueden actualizarse
- **RN-S09**: Solo el empleado puede cancelar sus solicitudes
- **RN-S10**: Solo solicitudes no finalizadas pueden cancelarse
- **RN-S11**: Solo HR puede revisar solicitudes
- **RN-S12**: Solo solicitudes PENDING pueden revisarse
- **RN-S13**: Comentario de revisión mínimo 10 caracteres al rechazar
- **RN-S14**: Balance se calcula con días naturales (no laborables)
- **RN-S15**: Estado cambia a APPROVED/REJECTED según decisión HR

### Corregido 🐛
- **SQLAlchemy relationship annotation**: Changed `reviewed_by_user: "User | None"` to `reviewed_by_user: "User"` (SQLModel no soporta Union en string literals)
- **Enum case sensitivity**: Cambiados todos los valores de enums de uppercase a lowercase (VACATION → vacation)
- **FastAPI routing order**: Movido endpoint `GET /pending` antes de `GET /{solicitud_id}` para evitar que "pending" se interprete como parámetro de ruta
- **Filter tipo handling**: Changed `tipo.upper()` to `tipo.lower()` en `_build_filters()` para coincidir con valores de enum
- **Authentication fixtures**: Agregados overrides para `get_current_user` y `get_current_hr` en `hr_authenticated_client`
- **Test data validation**: Todos los tests actualizados para usar valores lowercase en tipos y estados

### Modificado 🔧
- `app/models/user.py` - Agregado campo `vacation_days` (default 22) y relationship con solicitudes
- `app/main.py` - Agregado router de vacaciones
- `tests/conftest.py` - Mejorados fixtures de autenticación con overrides completos
- `app/api/routers/vacaciones.py` - Reordenadas rutas para correcta precedencia

### Migración 🗄️
- `alembic/versions/..._add_solicitud_table.py`
  - Tabla solicitud con foreign keys a user (user_id, reviewed_by)
  - Índices en user_id, tipo, status, start_date, end_date
  - Soporte para revisión con comentarios de HR
  - Campos de auditoría completos
  - Campo vacation_days agregado a users

### Características 🚀
- ✅ Clean Architecture (4 capas bien separadas)
- ✅ SOLID Principles aplicados
- ✅ 15 reglas de negocio implementadas y testeadas
- ✅ Cálculo automático de balance de vacaciones
- ✅ Validación de solapamiento de fechas
- ✅ Filtros avanzados (fecha, tipo, estado, usuario)
- ✅ Paginación en listados
- ✅ Autorización granular (EMPLOYEE vs HR)
- ✅ Dependency Injection (CurrentUser, CurrentHR)
- ✅ Workflow completo de aprobación/rechazo
- ✅ Cancelación de solicitudes por empleado

### Métricas 📊
- **Tests**: 109/109 (100%)
  - Solicitudes: 39/39 ✅
  - Fichajes: 24/24 ✅
  - Autenticación: 13/13 ✅
  - Usuarios: 33/33 ✅
- **Endpoints**: 10 nuevos (total 32)
- **Schemas**: 6 nuevos
- **Reglas de negocio**: 15/15 implementadas
- **Seed data**: +15 solicitudes
- **Líneas de código**: ~2000 nuevas
- **Tiempo ejecución tests**: 29.82s

### Calidad 📐
- Código pasó linting (Ruff, Pylint)
- Type hints completos
- Documentación exhaustiva
- Swagger UI actualizado
- Test coverage 100%

### Debugging y Optimizaciones 🔍
- Identificado y corregido problema de routing en FastAPI (orden de definición de rutas)
- Solucionado problema de anotaciones de tipo en SQLModel relationships
- Homogeneizada nomenclatura de enums (lowercase en todo el código)
- Optimizada configuración de fixtures de autenticación en tests

---

## [1.0.5] - 2025-10-15 - Iteración 5: Módulo de Fichajes Completo

### Agregado ✨
- **Módulo de Fichajes** - Sistema completo de gestión de entradas/salidas
  - `app/models/fichaje.py` - Modelo Fichaje con 4 estados y propiedades calculadas
  - `app/schemas/fichaje.py` - 6 schemas (FichajeCheckIn, FichajeCheckOut, FichajeCorrection, FichajeApproval, FichajeFilters, FichajeResponse, FichajeListResponse, FichajeStats)
  - `app/repositories/fichaje_repository.py` - 10 métodos de acceso a datos
  - `app/services/fichaje_service.py` - 11 operaciones con 10 reglas de negocio
  - `app/api/routers/fichajes.py` - 11 endpoints RESTful

- **Enum FichajeStatus**: Estados de fichaje
  - `VALID` - Fichaje válido
  - `PENDING_CORRECTION` - Corrección pendiente de aprobación
  - `CORRECTED` - Corregido y aprobado por HR
  - `REJECTED` - Corrección rechazada por HR

- **11 Endpoints de Fichajes**:
  - `POST /api/fichajes/check-in` - Registrar entrada (CurrentUser)
  - `POST /api/fichajes/check-out` - Registrar salida (CurrentUser)
  - `GET /api/fichajes/me` - Mis fichajes con filtros (CurrentUser)
  - `GET /api/fichajes/` - Todos los fichajes (CurrentHR)
  - `GET /api/fichajes/{id}` - Fichaje por ID (CurrentUser/CurrentHR)
  - `GET /api/fichajes/active` - Mi fichaje activo (CurrentUser)
  - `POST /api/fichajes/{id}/request-correction` - Solicitar corrección (CurrentUser)
  - `POST /api/fichajes/{id}/approve` - Aprobar/rechazar corrección (CurrentHR)
  - `GET /api/fichajes/stats/me` - Mis estadísticas (CurrentUser)
  - `GET /api/fichajes/stats/user/{user_id}` - Stats de empleado (CurrentHR)
  - `GET /api/fichajes/stats/general` - Stats generales (CurrentHR)

- **Tests Completos**: `tests/test_fichajes.py`
  - 24 tests organizados en 8 clases (100% passing)
  - TestCheckIn, TestCheckOut, TestListFichajes, TestRequestCorrection
  - TestApproveCorrection, TestGetFichaje, TestActiveFichaje, TestFichajeStats
  - Homogeneizados con test_users.py (class-based organization)

- **Seed Data**: 12 fichajes de ejemplo
  - 9 fichajes completos (semana laboral 3 empleados)
  - 1 fichaje activo (solo entrada)
  - 1 fichaje pendiente de corrección
  - 1 fichaje rechazado con motivo

- **Documentación de API**: `test_api.http`
  - +35 requests HTTP (total 81 requests)
  - Sección Gestión de Fichajes (19 requests)
  - Sección Correcciones (4 requests)
  - Sección Aprobación/Rechazo (4 requests)
  - Sección Estadísticas (8 requests)
  - 2 nuevas secuencias de prueba completas

### Reglas de Negocio Implementadas 📏
- **RN-F01**: Usuario debe estar activo para fichar
- **RN-F02**: No puede haber fichaje activo para check-in
- **RN-F03**: Debe existir fichaje activo para check-out
- **RN-F04**: Timestamps con timezone UTC (aware)
- **RN-F05**: check_out debe ser posterior a check_in
- **RN-F06**: Solo el empleado puede corregir sus fichajes
- **RN-F07**: Motivo de corrección mínimo 10 caracteres
- **RN-F08**: Solo HR puede aprobar/rechazar correcciones
- **RN-F09**: Solo fichajes PENDING_CORRECTION son aprobables
- **RN-F10**: Estado CORRECTED al aprobar, REJECTED al rechazar

### Corregido 🐛
- **Organización de tests**: Refactorizado test_fichajes.py de funciones a clases
- **Autorización endpoint**: Changed GET /api/fichajes/ from CurrentUser to CurrentHR
- **Exception handling**: get_my_active_fichaje ahora lanza NotFoundException (404) en vez de retornar None
- **Type conversions**: Agregados helpers _date_to_datetime() y _date_to_datetime_end() para filtros de fecha
- **Schema validation**: Corregidos nombres de campos en tests (check_in, check_out, correction_reason)
- **Import cleanup**: Removidos imports duplicados en fichajes.py router

### Modificado 🔧
- `app/models/user.py` - Agregado relationship con fichajes
- `app/main.py` - Agregado router de fichajes
- `scripts/seed_data.py` - Función create_fichajes() con 12 fichajes de ejemplo
- `test_api.http` - +245 líneas con requests de fichajes

### Migración 🗄️
- `alembic/versions/34c25f9618d2_add_fichaje_table.py`
  - Tabla fichaje con foreign keys a user
  - Índices en user_id, check_in, check_out
  - Soporte para correcciones y aprobaciones
  - Campos de auditoría completos

### Características 🚀
- ✅ Clean Architecture (4 capas bien separadas)
- ✅ SOLID Principles aplicados
- ✅ 10 reglas de negocio implementadas y testeadas
- ✅ Cálculo automático de horas trabajadas
- ✅ Timezone-aware datetimes (UTC)
- ✅ Filtros avanzados (fecha, estado, usuario)
- ✅ Estadísticas con agregaciones SQL
- ✅ Autorización granular (EMPLOYEE vs HR)
- ✅ Dependency Injection (CurrentUser, CurrentHR)
- ✅ FastAPI status constants (no magic numbers)

### Métricas 📊
- **Tests**: 70/70 (100%)
  - Fichajes: 24/24
  - Autenticación: 13/13
  - Usuarios: 33/33
- **Endpoints**: 11 nuevos
- **Schemas**: 6 nuevos
- **Reglas de negocio**: 10/10 implementadas
- **Seed data**: +12 fichajes
- **HTTP requests**: +35 (total 81)
- **Líneas de código**: ~1800 nuevas
- **Documentación**: `docs/Iteracion5-COMPLETADA.md` (500+ líneas)

### Calidad 📐
- Código pasó linting (Ruff, Pylint)
- Sin warnings críticos
- Type hints completos
- Documentación exhaustiva
- Swagger UI actualizado

---

## [1.0.4] - 2025-10-15 - Iteración 4: Testing Completo y Seed Data

### Agregado ✨
- **Suite de testing completa**: 46 tests (100% passing)
  - `tests/test_auth.py` - 19 tests de autenticación
  - `tests/test_users.py` - 27 tests de gestión de usuarios
  - `tests/conftest.py` - Fixtures reutilizables
  - `pytest.ini` - Configuración pytest-asyncio

- **Seed data system**: `scripts/seed_data.py`
  - 12 usuarios de prueba (4 HR, 6 empleados, 2 inactivos)
  - Limpieza opcional con confirmación interactiva
  - Output colorido con emojis
  - Comandos: `make seed` y `make seed-no-clear`

- **Testing manual**: `test_api.http`
  - 46 requests HTTP organizadas
  - Variables dinámicas y captura automática de tokens
  - Compatible con REST Client de VS Code

- **Documentación**:
  - `CHEATSHEET.md` - Guía rápida
  - `docs/Iteracion4.md` - Documentación completa

### Corregido 🐛
- **Error 422 en creación de usuarios**: Removido Union type problemático
- **Endpoint create_user**: Ahora requiere autenticación HR obligatoria
- **Status codes**: 401 en password incorrecta, 204 en DELETE exitoso
- **Test delete_user**: Ya no intenta auto-eliminación
- **Tuple unpacking**: Corregido en list_users endpoint
- **Validación delete**: Lanza NotFoundException si usuario no existe

### Modificado 🔧
- `app/api/routers/users.py` - Simplificado create_user, fixed list_users
- `app/services/user_service.py` - Agregada validación en delete_user
- `Makefile` - Agregados comandos seed
- `scripts/README.md` - Documentación seed data

### Métricas 📊
- Tests: 46/46 (100%)
- Usuarios seed: 12
- Requests HTTP: 46
- Líneas documentación: 500+

---

## [1.0.3] - 2025-10-14 - Iteración 3: Módulo de Usuarios

### Agregado ✨
- **Modelo User**: `app/models/user.py`
  - Roles: EMPLOYEE (default) y HR
  - Email único indexado
  - Timestamps automáticos
  - Propiedades de conveniencia (is_hr, is_employee)

- **Schemas Pydantic**: `app/schemas/user.py`
  - Entrada: UserCreate, UserCreateByHR, UserUpdate, UserUpdateSelf, UserLogin, UserChangePassword
  - Salida: UserResponse, UserListResponse
  - Validaciones: email, password (8+ chars)

- **Repository**: `app/repositories/user_repository.py`
  - CRUD asíncrono completo
  - Filtrado por rol y estado activo
  - Paginación con skip/limit
  - Validación email único

- **Service**: `app/services/user_service.py`
  - Lógica de negocio y autorización
  - 9 operaciones: create, get, list, update, delete, authenticate, change_password
  - Reglas RBAC: HR puede todo, EMPLOYEE limitado

- **Auth Dependencies**: `app/api/dependencies/auth.py`
  - get_current_user, get_current_active_user, require_hr
  - Type aliases: CurrentUser, CurrentHR
  - Validación JWT bearer tokens

- **API Routers**:
  - `app/api/routers/auth.py` - 3 endpoints: login, logout, me
  - `app/api/routers/users.py` - 8 endpoints CRUD completos
  - Paginación, filtros, autorización por rol

### Migración 🗄️
- `alembic/versions/..._add_user_table.py`
  - Tabla users con índices
  - Columnas: id, email, full_name, hashed_password, role, is_active, timestamps

### Características 🚀
- ✅ Clean Architecture (4 capas)
- ✅ JWT authentication (Bearer tokens)
- ✅ RBAC con EMPLOYEE/HR
- ✅ 11 endpoints RESTful
- ✅ 11 schemas Pydantic
- ✅ Password hashing con bcrypt
- ✅ Dependency injection
- ✅ SOLID principles

### Calidad 📐
- Código pasó linting con Ruff
- ~2500 líneas de código
- Documentación completa en `docs/Iteracion3.md`

---

## [1.0.2] - 2025-10-14 - Iteración 2: Core de la Aplicación

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
