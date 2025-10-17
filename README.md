# StopCardio — Sistema básico de gestión de fichajes y RRHH

Pequeña aplicación para gestionar fichajes, solicitudes de vacaciones y usuarios. Diseñada para pruebas y despliegue en contenedores.

## Resumen

Esta repo contiene un backend en FastAPI y un frontend en Angular que permiten:
- Registrar fichajes (entrada/salida)
- Gestionar solicitudes de vacaciones y ausencias
- Administrar usuarios y roles básicos (RRHH / Empleado)

El proyecto está preparado para ejecutarse con Docker Compose en entornos de desarrollo.

## Arrancar con Docker Compose

Construir y arrancar todos los servicios (backend, frontend, db, pgadmin):

```powershell
# Desde la raíz del proyecto
docker-compose up

# En segundo plano
docker-compose up -d

# Reconstruir imágenes y arrancar (útil si has modificado código)
docker-compose up --build
# en segundo plano
docker-compose up --build -d
```

Servicios importantes expuestos en local:

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- Documentación API (Swagger): http://localhost:8000/docs
- pgAdmin: http://localhost:5050

## Credenciales de prueba
### Usuario Empleado
```
Username: employee1@stopcardio.com
Password: password123
```

### Usuario RRHH
```
Username: hr@stopcardio.com
Password: password123
```

## Stack tecnológico

- Backend: Python 3.13, FastAPI, SQLModel, Alembic
- Base de datos: PostgreSQL 16
- Frontend: Angular, TypeScript
- Web server estático: Nginx (Alpine)
- Orquestación: Docker + Docker Compose

### ¿Por qué estas tecnologías?

El principal motivo es que son tecnologías modernas y con las que me siento cóomodo trabajando, por lo que puedo ser más productivo y entregar un mejor resultado en el tiempo disponible. Además, me permite apoyarme en github copilot para acelerar las tareas, puesto que al estar familiarizado con estas tecnologías, el uso de copilot es más efectivo.

- **Python + FastAPI**: Rápido desarrollo de APIs, tipado estático, documentación automática con Swagger.
- **SQLModel**: ORM moderno basado en SQLAlchemy y Pydantic, facilita la definición de modelos y validaciones.
- **PostgreSQL**: Base de datos relacional robusta y ampliamente utilizada.
- **Angular**: Framework sólido para aplicaciones web con buen soporte para componentes y gestión de estado.

## Notas rápidas

- Antes de arrancar copia `.env.example` a `.env` si quieres personalizar variables.
- Puesto que esto es una prueba técnica el seed se ejecuta automáticamente al arrancar el contenedor backend.
- El seed de datos puede ejecutarse desde el contenedor backend (Makefile dispone de targets para ello).

## Otros documentos

- [Documentación del Frontend](frontend/README.md)
- [Documentación del Backend](backend/README.md)

---
 