# 🏢 Sistema de Gestión de RRHH - StopCardio

Sistema completo de gestión de fichajes, vacaciones y recursos humanos con arquitectura moderna basada en microservicios.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Despliegue](#instalación-y-despliegue)
- [Credenciales de Prueba](#credenciales-de-prueba)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Uso de la Aplicación](#uso-de-la-aplicación)
- [Comandos Útiles](#comandos-útiles)
- [Decisiones de Diseño](#decisiones-de-diseño)

## ✨ Características

### 👥 Sistema de Usuarios (2 niveles de permisos)

#### Empleado
- ✅ Fichar entrada/salida
- ✅ Ver historial de fichajes propio
- ✅ Solicitar correcciones de fichajes erróneos
- ✅ Solicitar vacaciones y ausencias
- ✅ Consultar estado de solicitudes

#### RRHH (Recursos Humanos)
- ✅ Todos los permisos de empleado
- ✅ Visualizar fichajes de todos los empleados
- ✅ Gestionar solicitudes de corrección de fichajes
- ✅ Aprobar/rechazar solicitudes de vacaciones
- ✅ Acceder a reportes de asistencia
- ✅ Crear/editar/eliminar usuarios
- ✅ Asignar roles y permisos
- ✅ Configuración general del sistema

### 📊 Módulos Principales

#### 1. Módulo de Fichajes
- Registro de entrada/salida con timestamp automático
- Visualización de historial completo
- Workflow de solicitudes de corrección con aprobación

#### 2. Módulo de Vacaciones y Ausencias
- Formulario de solicitud con fechas y motivo
- Sistema de aprobación/rechazo con comentarios
- Estados: Pendiente, Aprobada, Rechazada
- Balance de días disponibles por empleado

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) 0.119+
- **Lenguaje**: Python 3.13
- **ORM**: [SQLModel](https://sqlmodel.tiangolo.com/) 0.0.27
- **Base de Datos**: PostgreSQL 16 (producción) / SQLite (desarrollo)
- **Migraciones**: Alembic 1.17+
- **Autenticación**: JWT con PyJWT 2.10+
- **Validación**: Pydantic 2.x
- **Testing**: Pytest + HTTPx
- **Linting**: Ruff

### Frontend
- **Framework**: [Angular](https://angular.io/) 18+
- **Lenguaje**: TypeScript 5.x
- **UI Components**: Angular Material
- **State Management**: RxJS + Signals
- **HTTP Client**: Angular HttpClient
- **Servidor Web**: Nginx 1.25 (Alpine)

### DevOps
- **Containerización**: Docker + Docker Compose
- **Base de Datos**: PostgreSQL 16 Alpine
- **Web Server**: Nginx Alpine
- **Gestión de Dependencias**: 
  - Backend: `uv` (Python)
  - Frontend: `npm`

### Justificación de Stack

#### ¿Por qué FastAPI?
- **Alto rendimiento**: Basado en Starlette y Pydantic, comparable a Node.js
- **Type Safety**: Validación automática con Python type hints
- **Documentación automática**: OpenAPI/Swagger out-of-the-box
- **Async nativo**: Manejo eficiente de I/O con async/await
- **Developer Experience**: Autocompletado y validación en tiempo de desarrollo

#### ¿Por qué Angular?
- **Framework completo**: Incluye routing, forms, HTTP, testing
- **TypeScript first**: Type safety en todo el frontend
- **Angular Material**: Componentes UI profesionales y accesibles
- **Escalabilidad**: Arquitectura modular ideal para aplicaciones enterprise
- **Mantenibilidad**: Convenciones claras y estructura opinionada

#### ¿Por qué PostgreSQL?
- **ACID compliance**: Garantías de transacciones y consistencia
- **Robusto**: Probado en producción en millones de aplicaciones
- **Relaciones**: Ideal para datos estructurados (empleados, fichajes, vacaciones)
- **JSON support**: Flexibilidad cuando se necesita
- **Open Source**: Sin costos de licencia

## 📦 Requisitos Previos

- **Docker**: 24.0+ ([Instalar Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: 2.20+ (incluido con Docker Desktop)
- **Git**: Para clonar el repositorio

### Verificar instalación:

```bash
docker --version
docker-compose --version
```

## 🚀 Instalación y Despliegue

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd prueba_tecnica_stopcardio
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores (opcional para desarrollo local)
# Para producción, cambiar SECRET_KEY y contraseñas
```

**Nota**: El archivo `.env.example` ya contiene valores por defecto funcionales para desarrollo.

### 3. Iniciar la Aplicación

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# O en modo detached (segundo plano)
docker-compose up -d --build
```

### 4. Acceder a la Aplicación

Una vez iniciado, la aplicación estará disponible en:

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs (Swagger UI)
- **pgAdmin**: http://localhost:5050 (Administrador de BD)
- **PostgreSQL**: localhost:5432

#### Configurar pgAdmin

1. Acceder a http://localhost:5050
2. Iniciar sesión con:
   - **Email**: admin@stopcardio.com
   - **Contraseña**: admin123
3. Agregar servidor PostgreSQL:
   - Click derecho en "Servers" → "Register" → "Server"
   - **General Tab**:
     - Name: `HR Database`
   - **Connection Tab**:
     - Host: `db` (nombre del servicio en Docker)
     - Port: `5432`
     - Database: `hr_production`
     - Username: `hr_admin`
     - Password: `ChangeMeInProduction` (o la que configuraste en `.env`)
   - Click "Save"

### 5. Datos de Prueba

El backend incluye un sistema de seed data que crea automáticamente:
- 1 usuario RRHH (administrador)
- 3-4 empleados de ejemplo
- Fichajes históricos
- Solicitudes de vacaciones de ejemplo

## 🔑 Credenciales de Prueba

### Usuario RRHH (Administrador)
```
Email: admin@stopcardio.com
Contraseña: admin123
```
**Permisos**: Acceso completo a todas las funcionalidades

### Usuarios Empleados

#### Empleado 1
```
Email: juan.perez@stopcardio.com
Contraseña: password123
```

#### Empleado 2
```
Email: maria.garcia@stopcardio.com
Contraseña: password123
```

#### Empleado 3
```
Email: carlos.lopez@stopcardio.com
Contraseña: password123
```

**Permisos**: Gestión de fichajes propios y solicitudes de vacaciones

⚠️ **IMPORTANTE**: Estas credenciales son solo para pruebas. Cambiar en producción.

## 📁 Estructura del Proyecto

```
prueba_tecnica_stopcardio/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── api/               # Endpoints REST
│   │   ├── core/              # Configuración, seguridad, DB
│   │   ├── models/            # Modelos SQLModel
│   │   ├── schemas/           # Schemas Pydantic
│   │   └── services/          # Lógica de negocio
│   ├── alembic/               # Migraciones de BD
│   ├── tests/                 # Tests unitarios
│   ├── Dockerfile             # Imagen Docker backend
│   ├── pyproject.toml         # Dependencias Python
│   └── Makefile               # Comandos de desarrollo
├── frontend/                   # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Guards, interceptors, services
│   │   │   ├── features/      # Módulos de funcionalidades
│   │   │   ├── shared/        # Componentes compartidos
│   │   │   └── layouts/       # Layouts de la aplicación
│   │   └── environments/      # Configuración de entornos
│   ├── nginx.conf             # Configuración Nginx
│   ├── Dockerfile             # Imagen Docker frontend
│   └── package.json           # Dependencias Node.js
├── docker-compose.yml         # Orquestación de servicios
├── .env.example               # Variables de entorno ejemplo
└── README.md                  # Este archivo
```

## 📱 Uso de la Aplicación

### Para Empleados

1. **Iniciar Sesión**: Usar credenciales de empleado
2. **Dashboard**: Ver resumen de estado actual
3. **Fichar**:
   - Botón "Fichar Entrada" al iniciar jornada
   - Botón "Fichar Salida" al finalizar jornada
4. **Ver Historial**: Consultar todos los fichajes realizados
5. **Solicitar Corrección**: Si hay error en un fichaje
6. **Solicitar Vacaciones**: 
   - Seleccionar fechas
   - Indicar motivo
   - Ver días disponibles
7. **Mis Solicitudes**: Consultar estado de todas las solicitudes

### Para RRHH

1. **Todas las funciones de empleado** +
2. **Gestión de Empleados**:
   - Ver lista completa
   - Crear nuevos usuarios
   - Editar información
   - Asignar roles
3. **Revisión de Fichajes**:
   - Ver fichajes de todos
   - Filtrar por empleado/fecha
   - Generar reportes
4. **Gestión de Solicitudes**:
   - Ver todas las solicitudes pendientes
   - Aprobar/rechazar con comentarios
   - Historial de decisiones
5. **Reportes**:
   - Asistencia por empleado
   - Estadísticas de uso

## 🔧 Comandos Útiles

### Docker Compose

```bash
# Iniciar servicios
docker-compose up

# Iniciar en segundo plano
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina datos)
docker-compose down -v

# Reconstruir sin caché
docker-compose build --no-cache

# Verificar estado de servicios
docker-compose ps

# Ejecutar comando en contenedor
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Backend (dentro del contenedor)

```bash
# Acceder al contenedor
docker-compose exec backend bash

# Ejecutar migraciones
make migrate

# Crear nueva migración
make migration msg="descripcion"

# Ejecutar tests
make test

# Linting
make lint
```

### Frontend (dentro del contenedor)

```bash
# Acceder al contenedor (durante build)
docker-compose exec frontend sh

# Nota: En producción, frontend sirve archivos estáticos
# No hay comandos de desarrollo dentro del contenedor
```

### Base de Datos

```bash
# Acceder a PostgreSQL
docker-compose exec db psql -U hr_admin -d hr_production

# Backup de base de datos
docker-compose exec db pg_dump -U hr_admin hr_production > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U hr_admin hr_production < backup.sql
```

## 🎯 Decisiones de Diseño

### Arquitectura

#### Separación Frontend/Backend
- **Ventaja**: Escalabilidad independiente
- **Ventaja**: Frontend puede cambiar sin afectar API
- **Ventaja**: Facilita testing y desarrollo paralelo

#### API REST vs GraphQL
- **Elección**: REST con FastAPI
- **Razón**: 
  - Simplicidad para CRUD
  - Documentación automática con OpenAPI
  - Caché HTTP estándar
  - Suficiente para requisitos del proyecto

#### Autenticación JWT
- **Stateless**: No requiere sesiones en servidor
- **Escalable**: Múltiples instancias sin estado compartido
- **Seguro**: Tokens con expiración corta + refresh tokens

### Base de Datos

#### Diseño Relacional
- **Tablas principales**:
  - `users`: Usuarios y roles
  - `clock_entries`: Fichajes (entrada/salida)
  - `time_off_requests`: Solicitudes de vacaciones
  - `correction_requests`: Solicitudes de corrección

#### Normalization
- Base de datos normalizada para evitar redundancia
- Relaciones claras con foreign keys
- Índices en campos de búsqueda frecuente

### Seguridad

#### Hashing de Contraseñas
- **bcrypt**: Algoritmo robusto con salt automático
- **Factor de trabajo**: Configurable para balance seguridad/performance

#### CORS
- Configuración restrictiva en producción
- Lista blanca de orígenes permitidos

#### Validación
- **Backend**: Pydantic para validación de esquemas
- **Frontend**: Validadores de formularios Angular
- **Base de Datos**: Constraints y checks

### Docker Multi-Stage Builds

#### Backend
```dockerfile
Stage 1 (builder): Instala dependencias
Stage 2 (runtime): Solo runtime + código
Resultado: Imagen ~50% más pequeña
```

#### Frontend
```dockerfile
Stage 1 (deps): Dependencias de producción
Stage 2 (builder): Build de Angular
Stage 3 (production): Nginx + archivos estáticos
Resultado: Imagen ~90% más pequeña
```

### Performance

#### Backend
- **Async/Await**: I/O no bloqueante
- **Connection Pooling**: Conexiones DB reutilizables
- **Query Optimization**: Índices y eager loading

#### Frontend
- **Lazy Loading**: Módulos cargados bajo demanda
- **OnPush Change Detection**: Menos ciclos de detección
- **Production Build**: Minificación y tree shaking

#### Nginx
- **Gzip**: Compresión de assets
- **Cache Headers**: Caché de archivos estáticos
- **HTTP/2**: Paralelización de requests

## 🧪 Testing

### Backend
```bash
# Ejecutar todos los tests
docker-compose exec backend make test

# Con cobertura
docker-compose exec backend make test-cov

# Tests específicos
docker-compose exec backend pytest tests/test_auth.py
```

### Frontend
```bash
# Tests unitarios (requiere ejecutar en desarrollo)
cd frontend
npm test

# Tests E2E
npm run e2e
```

## 📝 Notas Adicionales

### Desarrollo Local sin Docker

Si prefieres desarrollar sin Docker:

#### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install uv
uv pip install -e .
make dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

### Producción

Para despliegue en producción:

1. **Generar SECRET_KEY seguro**:
```bash
openssl rand -hex 32
```

2. **Actualizar `.env`** con valores de producción

3. **Cambiar credenciales** de base de datos y usuarios

4. **Configurar CORS** solo con dominios autorizados

5. **Habilitar HTTPS** (usar reverse proxy como Traefik o nginx)

6. **Configurar backups** automáticos de PostgreSQL

7. **Monitoring**: Considerar Prometheus + Grafana

### Mejoras Futuras

- [ ] Autenticación con OAuth2 (Google, Microsoft)
- [ ] Notificaciones por email
- [ ] Exportación de reportes PDF/Excel
- [ ] Dashboard con gráficos avanzados
- [ ] Geolocalización en fichajes
- [ ] App móvil con React Native/Flutter
- [ ] Integración con sistemas de nómina

## 📄 Licencia

Este proyecto es una prueba técnica para StopCardio.

## 👥 Autor

Desarrollado como parte de la prueba técnica de StopCardio.

---

**¿Problemas o preguntas?** Abre un issue en el repositorio o contacta al equipo de desarrollo.
