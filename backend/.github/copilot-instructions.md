# Copilot Instructions — Sistema de Gestión de Fichajes y RRHH

## project_summary
Backend system for HR and attendance management.  
Focus on clean architecture, SOLID principles, modular code, and production-ready structure.  
Developed with **FastAPI**, **SQLModel**, and **uv** as package manager.  
SQLite is used for development, PostgreSQL for production.  
All endpoints must be asynchronous and follow RESTful conventions.

## technical_stack
- Language: Python 3.13  
- Framework: FastAPI  
- ORM: SQLModel (async with AsyncSession)  
- DB dev: SQLite  
- DB prod: PostgreSQL  
- Migrations: Alembic  
- Package manager: uv  
- Testing: pytest + httpx  
- Containers: 
  - Docker + docker-compose  # Solo en producción
  - DevContainer para desarrollo local
- Lint/format: Ruff, Pylint, Black  

## architecture_principles
- Follow **SOLID principles**:
  - Single Responsibility: Each module/class handles only one concern.
  - Open/Closed: Extend via inheritance or composition, avoid direct modifications.
  - Liskov Substitution: Derived classes maintain expected interface behavior.
  - Interface Segregation: Keep dependencies small and precise.
  - Dependency Inversion: Use dependency injection for DB sessions and services.
- Use **Clean Architecture**: separate domain, services, repositories, and API layers.
- Avoid logic duplication.  
- Use dependency injection (`Depends`) for database, authentication, and authorization.  
- Follow PEP8 naming conventions and ensure code passes Pylint.

## project_structure
``` bash
app/
├── main.py
├── api/
│ ├── routers/
│ │ ├── auth.py
│ │ ├── users.py
│ │ ├── fichajes.py
│ │ └── vacaciones.py
│ └── dependencies/
├── core/
│ ├── config.py
│ ├── security.py
│ └── exceptions.py
├── models/
│ ├── user.py
│ ├── fichaje.py
│ ├── solicitud.py
│ └── base.py
├── schemas/
│ ├── user.py
│ ├── fichaje.py
│ ├── solicitud.py
│ └── auth.py
├── services/
│ ├── user_service.py
│ ├── fichaje_service.py
│ └── solicitud_service.py
├── repositories/
│ ├── user_repository.py
│ ├── fichaje_repository.py
│ └── solicitud_repository.py
├── database.py
├── dependencies.py
└── scripts/
└── seed_data.py
```

## modules
### auth
- JWT-based authentication (access + refresh tokens).
- Password hashing with bcrypt/passlib.
- Role-based authorization: `EMPLOYEE`, `HR`.
- Token validation middleware.

### users
- CRUD for employee and HR users.
- Role assignment and management.
- Password validation and hashing.
- Only HR can create, edit or delete users.

### fichajes
- Register check-in and check-out with timestamps.
- Employees can view their own records.
- HR can view all employees’ records.
- Employees can request corrections (approval/rejection handled by HR).

### vacaciones
- Employees can request vacation or absence with start_date, end_date, reason.
- HR can approve/reject with comments.
- Employee can see request status.
- Track available vacation balance per employee.

## api_practices
- Use FastAPI routers with clear prefixes and tags.
- Separate input/output schemas from DB models.
- Use dependency injection for sessions and security.
- Handle errors with HTTPException or custom handlers.
- Include OpenAPI tags, descriptions, and responses.
- Return consistent responses using Pydantic schemas.

## database_rules
- Use SQLModel for models.
- Async engine configuration via `create_async_engine`.
- Use SQLite (`sqlite+aiosqlite`) for dev and PostgreSQL (`postgresql+asyncpg`) for prod.
- AsyncSession for all operations.
- Run migrations with Alembic in production.
- In dev, auto-create tables with `SQLModel.metadata.create_all()`.

## security_rules
- JWT authentication with short-lived access tokens and refresh tokens.
- Password hashing (bcrypt).
- Role-based access control using dependency injection.
- Never expose hashed passwords.
- Validate all user input through Pydantic models.

## testing_practices
- Use pytest + httpx for async testing.
- Use temporary SQLite database for test isolation.
- Include fixtures for test users and sessions.
- Write tests for authentication, user CRUD, fichajes, and vacation requests.

## docker_requirements
- Include `Dockerfile` and `docker-compose.yml`.
- Services:
  - `backend` (FastAPI)
  - `db` (PostgreSQL)
- Include `.dockerignore`.
- Environment variables loaded from `.env` or `.env.example`.

## environment_variables

```
# .env.example
DATABASE_URL=sqlite+aiosqlite:///./hr_dev.db
SECRET_KEY=change_me
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ENV=development

# For production
# DATABASE_URL=postgresql+asyncpg://user:password@db/hr_prod
```


## development_commands
| Task | Command |
|------|----------|
| Install dependencies | `uv sync` |
| Run dev server | `uv run uvicorn app.main:app --reload` |
| Run tests | `uv run pytest -v` |
| Lint code | `uv run ruff check . --fix` |
| Create migration | `alembic revision --autogenerate -m "init"` |
| Apply migrations | `alembic upgrade head` |

## ai_behavior_guidelines
- Always generate async functions.
- Prefer explicit typing everywhere.
- Use descriptive, consistent naming.
- Do not hardcode credentials or secrets.
- Keep imports minimal and sorted.
- Return JSONResponse or Pydantic models for API responses.
- Write modular code: routers → services → repositories → models.
- Favor composition over inheritance.
- Avoid writing business logic inside routes.
- Use logging for debug and error messages.
- Follow DRY and YAGNI principles.
- All database interactions should use dependency-injected sessions.
- Default to defensive programming (validate input, handle exceptions gracefully).

## project_goals
- Deliver a functional, dockerized HR management backend.
- Ensure modularity, testability, and maintainability.
- Achieve full code lint compliance.
- Provide clean, secure, and extendable architecture.
- Prepare for future scalability and PostgreSQL migration.

