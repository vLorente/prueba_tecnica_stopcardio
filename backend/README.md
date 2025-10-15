# 🏢 Sistema de Gestión de Fichajes y RRHH

Backend system for HR and attendance management built with **FastAPI**, **SQLModel**, and **Clean Architecture**.

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.119-green.svg)](https://fastapi.tiangolo.com/)
[![SQLModel](https://img.shields.io/badge/SQLModel-0.0.27-orange.svg)](https://sqlmodel.tiangolo.com/)
[![Ruff](https://img.shields.io/badge/Linter-Ruff-red.svg)](https://docs.astral.sh/ruff/)

---

## 📋 Características

- ✅ **Clean Architecture** con separación de responsabilidades
- ✅ **Autenticación JWT** con Bearer tokens
- ✅ **Autorización basada en roles** (RBAC: EMPLOYEE, HR)
- ✅ **Async/Await** en todas las operaciones de base de datos
- ✅ **SQLModel ORM** para desarrollo ágil
- ✅ **Migraciones Alembic** para control de versiones de BD
- ✅ **Validación con Pydantic** en todos los endpoints
- ✅ **Documentación automática** con OpenAPI/Swagger
- ✅ **Linting con Ruff** (10-100x más rápido que Pylint)
- ✅ **DevContainer** para desarrollo consistente

---

## 🚀 Quick Start

### Requisitos

- **Python 3.13+**
- **uv** package manager (instalado automáticamente en DevContainer)

### Desarrollo con DevContainer (Recomendado)

1. Abrir en VS Code con DevContainers
2. El setup se ejecuta automáticamente
3. ¡Listo para desarrollar!

```bash
# Ver estado del proyecto
make status

# Ejecutar servidor de desarrollo
make dev

# Abrir documentación interactiva
# http://localhost:8000/docs
```

### Desarrollo Local (Manual)

```bash
# 1. Instalar uv (si no está instalado)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Clonar repositorio
git clone <repo-url>
cd backend

# 3. Instalar dependencias
make install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu SECRET_KEY

# 5. Aplicar migraciones
make migrate

# 6. Ejecutar servidor
make dev
```

---

## 📚 Documentación

### Iteraciones Completadas

- 📄 [Iteración 1: Setup del Entorno](docs/Iteracion1.md)
- 📄 [Iteración 2: Core de la Aplicación](docs/Iteracion2-COMPLETADA.md)
- 📄 [Iteración 3: Módulo de Usuarios](docs/Iteracion3.md)

### Documentación Adicional

- 📄 [Requisitos del Sistema](docs/requisitos.md)
- 📄 [FastAPI CLI Update](docs/fastapi-cli-update.md)

---

## 🏗️ Arquitectura

```
app/
├── main.py                 # FastAPI app entry point
├── core/                   # Configuración central
│   ├── config.py          # Pydantic Settings
│   ├── security.py        # JWT + password hashing
│   └── exceptions.py      # Custom exceptions
├── models/                 # SQLModel database models
│   ├── base.py            # Base model con timestamps
│   └── user.py            # User model + UserRole enum
├── schemas/                # Pydantic request/response schemas
│   └── user.py            # 11 schemas para usuarios
├── repositories/           # Data access layer
│   └── user_repository.py # CRUD operations
├── services/               # Business logic layer
│   └── user_service.py    # Reglas de negocio + autorización
├── api/
│   ├── dependencies/      # Dependency injection
│   │   └── auth.py        # JWT middleware
│   └── routers/           # API endpoints
│       ├── auth.py        # /api/auth
│       └── users.py       # /api/users
└── database.py            # AsyncSession setup
```

---

## 🔐 API Endpoints

### Authentication (`/api/auth`)

| Método | Endpoint  | Descripción               | Auth |
| ------ | --------- | ------------------------- | ---- |
| POST   | `/login`  | Login con email/password  | ❌    |
| POST   | `/logout` | Logout (client-side)      | ✅    |
| GET    | `/me`     | Perfil del usuario actual | ✅    |

### Users (`/api/users`)

| Método | Endpoint           | Descripción                | Rol     |
| ------ | ------------------ | -------------------------- | ------- |
| POST   | `/`                | Crear usuario              | -       |
| GET    | `/`                | Listar usuarios (paginado) | HR      |
| GET    | `/me`              | Ver propio perfil          | -       |
| GET    | `/{id}`            | Ver usuario por ID         | HR/Self |
| PUT    | `/{id}`            | Actualizar usuario         | HR      |
| PATCH  | `/me`              | Actualizar propio perfil   | -       |
| POST   | `/change-password` | Cambiar contraseña         | -       |
| DELETE | `/{id}`            | Eliminar usuario           | HR      |

**Documentación interactiva:** http://localhost:8000/docs

---

## 🛠️ Comandos Make

```bash
# Desarrollo
make dev          # Ejecutar servidor de desarrollo
make install      # Instalar/actualizar dependencias
make status       # Ver estado del proyecto

# Base de Datos
make migration    # Crear nueva migración de Alembic
make migrate      # Aplicar migraciones pendientes
make downgrade    # Revertir última migración

# Calidad de Código
make lint         # Ejecutar Ruff linter
make format       # Formatear código con Ruff
make test         # Ejecutar tests con pytest

# Limpieza
make clean        # Limpiar archivos temporales
make clean-db     # Eliminar base de datos de desarrollo
```

---

## 🔒 Seguridad

### Password Hashing
- **bcrypt** via passlib
- Salt automático
- Nunca exponer contraseñas hasheadas

### JWT Tokens
- **HS256** algorithm
- Secret key desde `SECRET_KEY` env var
- Expiración configurable (default: 15 min)
- Payload: `{"sub": "user_id", "exp": timestamp}`

### Autorización
- Role-Based Access Control (RBAC)
- Roles: `EMPLOYEE`, `HR`
- Dependency injection para verificación
- HTTPException 403/401 para errores

---

## 🗄️ Base de Datos

### Desarrollo
- **SQLite** con `aiosqlite`
- Archivo: `hr_dev.db`
- Auto-creación de tablas en modo development

### Producción
- **PostgreSQL** con `asyncpg`
- Migraciones con Alembic
- Connection pooling

### Tabla `user`

| Campo           | Tipo       | Restricciones     |
| --------------- | ---------- | ----------------- |
| id              | INTEGER    | PRIMARY KEY       |
| email           | VARCHAR    | UNIQUE, INDEX     |
| full_name       | VARCHAR    | NOT NULL          |
| hashed_password | VARCHAR    | NOT NULL          |
| role            | VARCHAR(8) | 'employee' o 'hr' |
| is_active       | BOOLEAN    | DEFAULT true      |
| created_at      | DATETIME   | AUTO              |
| updated_at      | DATETIME   | AUTO              |

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
make test

# Tests con cobertura
uv run pytest --cov=app --cov-report=html

# Tests específicos
uv run pytest tests/test_users.py -v

# Ver reporte de cobertura
open htmlcov/index.html
```

---

## 📊 Calidad de Código

### Linting con Ruff

```bash
# Verificar código
make lint

# Auto-corrección
uv run ruff check --fix .

# Formatear
make format
```

**Estado actual:**
- ✅ 47 de 57 errores corregidos automáticamente
- ✅ 10 sugerencias de estilo restantes (no críticas)
- ✅ Código pasa validación de Ruff

### Principios SOLID

- ✅ **Single Responsibility**: Una responsabilidad por clase
- ✅ **Open/Closed**: Extensible sin modificar código existente
- ✅ **Liskov Substitution**: Subtipos intercambiables
- ✅ **Interface Segregation**: Interfaces específicas
- ✅ **Dependency Inversion**: Depender de abstracciones

---

## 🌍 Variables de Entorno

```env
# Aplicación
APP_NAME=Sistema de Gestión de RRHH
APP_VERSION=0.1.0
ENV=development
DEBUG=true

# Base de Datos
DATABASE_URL=sqlite+aiosqlite:///./hr_dev.db

# Seguridad
SECRET_KEY=your-secret-key-change-me-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
ALGORITHM=HS256

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**⚠️ IMPORTANTE:** Cambiar `SECRET_KEY` en producción:

```bash
# Generar secret key segura
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📦 Tecnologías

### Core
- **FastAPI** 0.119+ - Modern web framework
- **SQLModel** 0.0.27+ - ORM combining SQLAlchemy + Pydantic
- **Alembic** 1.17+ - Database migrations
- **Pydantic Settings** 2.11+ - Configuration management

### Seguridad
- **python-jose[cryptography]** 3.5+ - JWT tokens
- **passlib[bcrypt]** 1.7+ - Password hashing

### Desarrollo
- **uv** - Ultra-fast package manager (10-100x faster than pip)
- **Ruff** 0.14+ - Linter + formatter (10-100x faster than Pylint)
- **pytest** 8.4+ - Testing framework

---

## 🚧 Roadmap

### Próximas Iteraciones

#### Iteración 4: Módulo de Fichajes
- [ ] Modelo de Fichaje (check-in/check-out)
- [ ] Registro con timestamps
- [ ] Corrección de fichajes
- [ ] Reporte de horas trabajadas

#### Iteración 5: Módulo de Vacaciones
- [ ] Modelo de Solicitud
- [ ] Flujo de aprobación
- [ ] Balance de días disponibles
- [ ] Calendario de ausencias

#### Mejoras Técnicas
- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] Logging estructurado
- [ ] Tests de integración
- [ ] CI/CD pipeline
- [ ] Docker para producción

---

## 👥 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Estilo de Código

- Seguir PEP8
- Usar type hints
- Documentar funciones con docstrings
- Pasar `make lint` antes de commit

---

## 📄 Licencia

Este proyecto es privado y está bajo licencia propietaria.

---

## 📞 Soporte

Para dudas o problemas, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ usando FastAPI y Clean Architecture**

---

## 📈 Estadísticas del Proyecto

- **Versión:** 0.1.0
- **Python:** 3.13
- **Archivos de código:** 30+
- **Líneas de código:** ~3000
- **Endpoints:** 11
- **Modelos:** 1 (User)
- **Schemas:** 11
- **Tests:** En desarrollo
- **Cobertura:** TBD
- **Estado:** ✅ Iteración 3 completada

---

## 🎯 Objetivos del Proyecto

1. ✅ Sistema modular y escalable
2. ✅ Código limpio y mantenible
3. ✅ Seguridad robusta
4. ✅ Documentación completa
5. 🔄 Tests comprehensivos (en progreso)
6. 🔄 Despliegue automatizado (planeado)
