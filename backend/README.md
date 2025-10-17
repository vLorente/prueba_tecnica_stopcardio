# 🏢 Sistema de Gestión de Fichajes y RRHH

Backend REST API para gestión de recursos humanos con **FastAPI**, **SQLModel** y **Clean Architecture**.

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.119-green.svg)](https://fastapi.tiangolo.com/)
[![SQLModel](https://img.shields.io/badge/SQLModel-0.0.27-orange.svg)](https://sqlmodel.tiangolo.com/)
---

## 📋 Funcionalidades

### ✅ Módulos Implementados

- **Autenticación JWT** - Login/logout con tokens Bearer
- **Gestión de Usuarios** - CRUD completo con RBAC (Employee/HR)
- **Fichajes** - Check-in/check-out, correcciones, estadísticas
- **Solicitudes de Vacaciones** - Creación, aprobación/rechazo, balance

### 🎯 Características Técnicas

- ✅ Clean Architecture (4 capas: API → Services → Repositories → Models)
- ✅ SOLID Principles
- ✅ Async/Await en todas las operaciones
- ✅ Role-Based Access Control (RBAC)
- ✅ Validación Pydantic en todos los endpoints
- ✅ Documentación OpenAPI/Swagger automática
- ✅ DevContainer para desarrollo consistente

---

## 🚀 Quick Start

### Opción 1: DevContainer (Desarrollo Recomendado)

1. Abrir en VS Code con Remote Containers
2. El entorno se configura automáticamente
3. Servidor iniciado en `http://localhost:8000`

### Opción 2: Setup Manual

```bash
# 1. Instalar dependencias
make install

# 2. Aplicar migraciones
make migrate

# 3. Poblar base de datos con datos de ejemplo
make seed-clear

# 4. Ejecutar servidor
make dev

# Servidor: http://localhost:8000
# Docs: http://localhost:8000/docs
```

---

## 📚 API Endpoints

### 🔐 Autenticación (`/api/auth`)
- `POST /login` - Login con email/password
- `GET /me` - Perfil del usuario actual
- `POST /logout` - Cerrar sesión

### 👥 Usuarios (`/api/users`)
- `POST /` - Crear usuario (HR)
- `GET /` - Listar usuarios con filtros (HR)
- `GET /me` - Ver mi perfil
- `PUT /{id}` - Actualizar usuario (HR)
- `DELETE /{id}` - Eliminar usuario (HR)
- `POST /change-password` - Cambiar contraseña

### ⏰ Fichajes (`/api/fichajes`)
- `POST /check-in` - Registrar entrada
- `POST /check-out` - Registrar salida
- `GET /me` - Mis fichajes con filtros
- `GET /` - Todos los fichajes (HR)
- `POST /{id}/request-correction` - Solicitar corrección
- `POST /{id}/approve` - Aprobar/rechazar corrección (HR)
- `GET /stats/me` - Mis estadísticas
- `GET /stats/general` - Estadísticas generales (HR)

### 🏖️ Solicitudes de Vacaciones (`/api/vacaciones`)
- `POST /` - Crear solicitud
- `GET /me` - Mis solicitudes con filtros
- `GET /me/balance` - Mi balance de vacaciones
- `PUT /{id}` - Actualizar solicitud pendiente
- `DELETE /{id}` - Cancelar solicitud
- `GET /pending` - Solicitudes pendientes (HR)
- `POST /{id}/review` - Aprobar/rechazar (HR)
- `GET /balance/{user_id}` - Balance de empleado (HR)

**� Documentación completa:** `http://localhost:8000/docs`

---

## 🛠️ Comandos Principales

### Desarrollo
```bash
make dev              # Iniciar servidor (auto-reload)
make init_dev         # Setup completo (install + migrate + seed + dev)
```

### Docker
```bash
make docker-build     # Construir imagen Docker
make docker-run       # Ejecutar contenedor
make docker-logs      # Ver logs en tiempo real
make docker-shell     # Acceder al shell del contenedor
make docker-stop      # Detener contenedor
make docker-clean     # Detener y eliminar contenedor
make docker-health    # Verificar health check
```

### Base de Datos
```bash
make migrate          # Aplicar migraciones
make migration        # Crear nueva migración
make seed             # Poblar BD (con confirmación)
make seed-clear       # Poblar BD (sin confirmación)
```

# Tests y Calidad
```bash
make test             # Ejecutar tests (109 tests)
make lint             # Verificar código con Ruff
make format           # Formatear código

# Utilidades
make clean            # Limpiar archivos temporales
make status           # Verificar estado del entorno
make help             # Ver todos los comandos
```

---

## 🏗️ Arquitectura

```
app/
├── main.py                    # FastAPI application
├── core/                      # Configuración central
│   ├── config.py             # Settings (Pydantic)
│   ├── security.py           # JWT + bcrypt
│   └── exceptions.py         # Custom exceptions
├── models/                    # SQLModel (DB layer)
│   ├── user.py               # User + UserRole
│   ├── fichaje.py            # Fichaje + FichajeStatus
│   └── solicitud.py          # Solicitud + enums
├── schemas/                   # Pydantic (API layer)
│   ├── user.py               # 11 schemas
│   ├── fichaje.py            # 6 schemas
│   └── solicitud.py          # 6 schemas
├── repositories/              # Data access
│   ├── user_repository.py    # User CRUD
│   ├── fichaje_repository.py # Fichaje CRUD
│   └── solicitud_repository.py # Solicitud CRUD
├── services/                  # Business logic
│   ├── user_service.py       # User operations + RBAC
│   ├── fichaje_service.py    # Fichaje operations + rules
│   └── solicitud_service.py  # Solicitud operations + rules
└── api/routers/              # API endpoints
    ├── auth.py               # /api/auth
    ├── users.py              # /api/users
    ├── fichajes.py           # /api/fichajes
    └── vacaciones.py         # /api/vacaciones
```

---

## �️ Base de Datos

### Desarrollo
- **SQLite** con `aiosqlite` (archivo: `hr_dev.db`)
- Auto-creación de tablas
- Migraciones con Alembic

### Producción
- **PostgreSQL** con `asyncpg`
- Connection pooling
- Migraciones versionadas

### Tablas Principales

| Tabla        | Descripción                          |
| ------------ | ------------------------------------ |
| `user`       | Usuarios (employees + HR)            |
| `fichaje`    | Registros de entrada/salida          |
| `solicitud`  | Solicitudes de vacaciones/ausencias  |

---

## 🔒 Seguridad

- **Password Hashing:** bcrypt con salt automático
- **JWT Tokens:** HS256, expiración 15 min
- **RBAC:** Roles `EMPLOYEE` y `HR`
- **Autorización:** Dependency injection en endpoints
- **Validación:** Pydantic en todas las requests

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
make test

# Tests con cobertura
uv run pytest --cov=app --cov-report=html

```

---

## 📦 Stack Tecnológico

| Categoría     | Tecnología                          | Versión  |
| ------------- | ----------------------------------- | -------- |
| Language      | Python                              | 3.13     |
| Framework     | FastAPI                             | 0.119+   |
| ORM           | SQLModel                            | 0.0.27+  |
| DB Dev        | SQLite + aiosqlite                  | -        |
| DB Prod       | PostgreSQL + asyncpg                | -        |
| Migrations    | Alembic                             | 1.17+    |
| Auth          | python-jose + passlib               | 3.5+     |
| Validation    | Pydantic                            | 2.11+    |
| Testing       | pytest + httpx                      | 8.4+     |
| Linter        | Ruff                                | 0.14+    |
| Package Mgr   | uv (10-100x faster than pip)        | latest   |

---

## 🌍 Variables de Entorno

```env
# .env.example
DATABASE_URL=sqlite+aiosqlite:///./hr_dev.db
SECRET_KEY=change-me-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**⚠️ Generar SECRET_KEY segura:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Documentación

- 📄 [CHANGELOG.md](CHANGELOG.md) - Historial de versiones
- 📄 [test_api.http](test_api.http) - 115 requests HTTP de ejemplo
- 📄 [docs/](docs/) - Documentación de iteraciones

---

## 🎯 Reglas de Negocio Implementadas

### Usuarios (RN-U01 - RN-U07)
- Validación de email único
- Password mínimo 8 caracteres
- Solo HR puede crear/editar/eliminar usuarios
- Usuarios pueden actualizar su propio perfil

### Fichajes (RN-F01 - RN-F10)
- Usuario activo para fichar
- No duplicar check-in/check-out
- Timestamps con timezone UTC
- Solo empleado puede solicitar correcciones
- Solo HR puede aprobar/rechazar

### Solicitudes (RN-S01 - RN-S15)
- Fecha inicio >= fecha actual
- Fecha fin >= fecha inicio
- Motivo mínimo 10 caracteres
- Validación de solapamiento de fechas
- Control de balance de vacaciones
- Solo HR puede revisar solicitudes

---
