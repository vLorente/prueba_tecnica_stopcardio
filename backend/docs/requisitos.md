# iteration-1.md

## contexto_iteracion
Primera iteración de desarrollo del backend del Sistema de Gestión de Fichajes y RRHH.  
El objetivo principal es establecer la base del proyecto: configuración, base de datos, modelo de usuario y sistema de autenticación.  
Se prioriza la funcionalidad básica y la estructura modular del backend.  
El frontend, Docker y otras funcionalidades se abordarán en iteraciones posteriores.

## alcance
- Configuración del entorno (FastAPI + SQLModel + SQLite + uv)
- Estructura base del proyecto
- Configuración general y conexión a la base de datos
- Modelo de usuario (Empleado y RRHH)
- Autenticación mediante JWT (access + refresh tokens)
- CRUD básico de usuarios (con control de roles)
- Script de datos semilla (`seed_data.py`)
- Carga de variables de entorno y configuración con `pydantic_settings`
- Documentación automática de API con OpenAPI

## fuera_de_alcance
- Implementación del frontend
- Configuración de Docker o docker-compose (se realizará en la iteración 2)
- Módulos de fichajes y vacaciones
- Sistema de reportes o métricas
- Notificaciones o comunicación por email

## requisitos_funcionales

### autenticacion
- Sistema de autenticación basado en JWT.
- Generar `access token` (expira en 15 minutos) y `refresh token` (expira en 7 días).
- Cifrado de contraseñas con `bcrypt` o `passlib`.
- Endpoint para login (`/auth/login`).
- Endpoint para refrescar tokens (`/auth/refresh`).
- Middleware o dependencia para verificar tokens y roles.
- Manejo de errores 401 (no autorizado) y 403 (prohibido).

### usuarios
- Modelo: `id`, `nombre_completo`, `email`, `hashed_password`, `rol`, `created_at`.
- Roles posibles: `EMPLOYEE` y `HR`.
- Endpoints requeridos:
  - `POST /auth/register` → Registrar nuevo usuario (solo RRHH).
  - `POST /auth/login` → Autenticar usuario.
  - `POST /auth/refresh` → Renovar token.
  - `GET /users/me` → Ver información del usuario actual.
  - `GET /users/` → Listar todos los usuarios (solo RRHH).
  - `GET /users/{id}` → Obtener usuario por ID (solo RRHH).
  - `DELETE /users/{id}` → Eliminar usuario (solo RRHH).
- El campo `email` debe ser único.
- Contraseña mínima de 8 caracteres.

### base_de_datos
- ORM: SQLModel.
- Base de datos: SQLite (entorno de desarrollo).
- Cadena de conexión: `sqlite+aiosqlite:///./hr_dev.db`.
- Todas las operaciones deben ser asíncronas (`AsyncSession`).
- Creación automática de tablas al iniciar la aplicación (solo en desarrollo).
- Separación entre modelos ORM y esquemas Pydantic.

### configuracion
- Cargar variables desde `.env` usando `pydantic_settings.BaseSettings`.
- Variables esperadas:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `ACCESS_TOKEN_EXPIRE_MINUTES`
  - `REFRESH_TOKEN_EXPIRE_DAYS`
  - `ENV`
- Permitir fácilmente el cambio a PostgreSQL en iteraciones futuras.

### datos_semilla
- Script: `app/scripts/seed_data.py`.
- Debe crear datos iniciales para facilitar pruebas.
- Datos mínimos:
  - 1 usuario RRHH: `admin@empresa.com`, contraseña `admin123`
  - 3 empleados: `empleado1@empresa.com`, `empleado2@empresa.com`, `empleado3@empresa.com`
- Ejecutar manualmente después de inicializar la base de datos.

## requisitos_de_codigo
- Seguir la estructura definida en `copilot-instructions.md`.
- Cada capa del proyecto debe tener una responsabilidad única.
- La lógica de negocio debe residir en servicios, no en los routers.
- Los repositorios deben manejar la comunicación con la base de datos.
- Inyección de dependencias mediante `Depends` (para sesión, autenticación, etc.).
- Uso obligatorio de tipado estático (`type hints`).
- Código asíncrono en toda la aplicación.

## resumen_endpoints
| Endpoint | Método | Autenticación | Descripción |
|-----------|---------|---------------|--------------|
| `/auth/register` | POST | RRHH | Crear nuevo usuario |
| `/auth/login` | POST | Público | Autenticar usuario |
| `/auth/refresh` | POST | Autenticado | Renovar token |
| `/users/me` | GET | Autenticado | Obtener información del usuario actual |
| `/users/` | GET | RRHH | Listar todos los usuarios |
| `/users/{id}` | GET | RRHH | Obtener usuario por ID |
| `/users/{id}` | DELETE | RRHH | Eliminar usuario |

## criterios_de_aceptacion
- La aplicación se ejecuta con `uv run uvicorn app.main:app --reload`.
- Las tablas se crean automáticamente en SQLite al iniciar la app.
- Es posible registrar y autenticar usuarios correctamente.
- Se generan y validan tokens JWT.
- El usuario con rol RRHH puede listar y administrar usuarios.
- Los empleados solo pueden acceder a `/users/me`.
- Las contraseñas se almacenan cifradas.
- El código pasa los chequeos de Pylint/Ruff sin errores.
- El script `seed_data.py` inicializa los datos correctamente.
- `/docs` muestra todos los endpoints operativos.

## notas_tecnicas
- Todas las funciones deben ser `async`.
- Uso obligatorio de anotaciones de tipo.
- Manejar errores mediante `HTTPException` con códigos HTTP adecuados.
- Implementar dependencias: `get_current_user`, `get_current_hr_user`.
- Usar constantes o enumeraciones para los roles.
- Incluir docstrings breves en las funciones públicas.
- Cumplir PEP8 y principios SOLID.
- Mantener código modular y reutilizable.

## vista_previa_iteracion_2
(Objetivos principales de la próxima iteración)
- Implementar módulo de fichajes (entradas/salidas).
- Implementar módulo de vacaciones y ausencias.
- Añadir Alembic para migraciones de base de datos.
- Configurar Docker y docker-compose.
- Añadir test automatizados con pytest.
- Implementar decoradores de permisos por rol.
- Preparar configuración para despliegue.
