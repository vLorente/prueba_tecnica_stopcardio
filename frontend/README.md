# StopCardio HR Management System - Frontend

Sistema de gestión de fichajes y recursos humanos desarrollado con Angular 20.

## 📋 Descripción

Frontend de la aplicación StopCardio que permite a empleados y al departamento de RRHH gestionar:
- ⏰ Fichajes de entrada/salida
- 🏖️ Solicitudes de vacaciones y ausencias
- 👥 Gestión de usuarios (RRHH)
- 📊 Reportes y estadísticas

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 22.x
- npm 10.x
- Google Chrome (para tests)

### Instalación y Ejecución

```bash
# Configurar entorno (instala dependencias y Chrome)
make setup

# O instalar solo dependencias
make install

# Iniciar servidor de desarrollo
make start
```

La aplicación estará disponible en `http://localhost:4200/`

## 🛠️ Comandos Disponibles

### Desarrollo
```bash
make start          # Inicia el servidor de desarrollo
make dev            # Compila en modo desarrollo con watch
```

### Testing
```bash
make test           # Ejecuta los tests en modo watch
make test-once      # Ejecuta los tests una sola vez
make test-watch     # Ejecuta los tests en modo watch
```

### Calidad de Código
```bash
make format         # Formatea el código con Prettier
make check-format   # Verifica el formato del código
make lint           # Ejecuta el linter (cuando esté configurado)
```

### Build
```bash
make build          # Compila para producción
```

### Limpieza
```bash
make clean          # Limpia archivos generados
make clean-all      # Limpia todo incluyendo node_modules
```

### Otros
```bash
make help           # Muestra todos los comandos disponibles
make ng cmd="..."   # Ejecuta comandos de Angular CLI
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/                    # Servicios globales, guards, interceptors
│   │   ├── models/              # Interfaces y tipos TypeScript
│   │   ├── services/            # Servicios compartidos (auth, api)
│   │   ├── guards/              # Guards de autenticación y roles
│   │   ├── interceptors/        # HTTP interceptors
│   │   └── constants/           # Constantes y configuración
│   ├── shared/                  # Componentes, directives y pipes reutilizables
│   │   ├── components/          # Componentes compartidos
│   │   ├── directives/          # Directivas personalizadas
│   │   └── pipes/               # Pipes personalizados
│   ├── features/                # Módulos de funcionalidad
│   │   ├── auth/                # Autenticación y login
│   │   ├── fichajes/            # Gestión de fichajes
│   │   ├── vacaciones/          # Gestión de vacaciones/ausencias
│   │   ├── usuarios/            # Gestión de usuarios (RRHH)
│   │   └── dashboard/           # Dashboard principal
│   ├── layouts/                 # Layouts de la aplicación
│   └── app.routes.ts            # Configuración de rutas
├── styles.css                   # Estilos globales
└── index.html                   # HTML principal
```

## 🎯 Funcionalidades

### Para Empleados
- ✅ Fichar entrada y salida
- ✅ Ver historial de fichajes
- ✅ Solicitar correcciones de fichajes
- ✅ Solicitar vacaciones y ausencias
- ✅ Ver estado de solicitudes
- ✅ Consultar balance de días disponibles

### Para RRHH
- ✅ Todo lo anterior +
- ✅ Ver fichajes de todos los empleados
- ✅ Aprobar/rechazar correcciones de fichajes
- ✅ Gestionar solicitudes de vacaciones
- ✅ Crear, editar y eliminar usuarios
- ✅ Asignar roles
- ✅ Acceder a reportes y estadísticas

## 🔌 Integración con Backend

El frontend se conecta al backend FastAPI que debe estar corriendo en:
```
http://localhost:8000/api
```

### Documentación de API
Ver documentación completa de endpoints en: `docs/API.md`

Documentación interactiva (Swagger): `http://localhost:8000/docs`

## 👥 Credenciales de Prueba

### Usuario Empleado
```
Username: employee
Password: password123
```

### Usuario RRHH
```
Username: hr
Password: password123
```

## 📚 Documentación

- [Requisitos del Sistema](docs/REQUISITOS.md)
- [Historias de Usuario](docs/HISTORIAS-USUARIO.md)
- [Documentación de API](docs/API.md)
- [Plan de Desarrollo](docs/PLAN-DESARROLLO.md)

## 🧪 Testing

```bash
# Tests en modo watch
make test

# Tests una sola vez (para CI/CD)
make test-once

# Cobertura de tests
npm test -- --code-coverage
```

**Objetivo de cobertura**: > 70%

## 🏗️ Stack Tecnológico

- **Framework**: Angular 20.3
- **Lenguaje**: TypeScript 5.9
- **Testing**: Jasmine + Karma
- **Linting/Formatting**: ESLint + Prettier
- **Build**: Angular CLI
- **HTTP Client**: Angular HttpClient

## 🐳 Docker

### Build y Ejecución Local

```bash
# Build de la imagen
docker build -t stopcardio-frontend .

# Ejecutar contenedor
docker run -p 4200:80 stopcardio-frontend
```

### Docker Compose (con backend)

```bash
# Desde la raíz del proyecto
docker-compose up
```

Frontend disponible en: `http://localhost`  
Backend disponible en: `http://localhost:8000`

## 🔧 Configuración

### Variables de Entorno

Las variables de entorno se configuran en tiempo de build:

- `API_URL`: URL base del backend (default: `http://localhost:8000/api`)

### Configuración de Desarrollo

Ver `.devcontainer/devcontainer.json` para configuración del entorno de desarrollo.

## 📖 Guía de Desarrollo

### Convenciones de Código

- **Componentes**: PascalCase (`FichajeCardComponent`)
- **Servicios**: PascalCase + Service (`FichajeService`)
- **Variables**: camelCase (`misFichajes`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Archivos**: kebab-case (`fichaje-card.component.ts`)

### Estilo de Código

- Usar Prettier para formateo automático
- Seguir guías de estilo de Angular
- Comentar código complejo con JSDoc
- Mantener componentes pequeños y enfocados

---

**Versión**: 1.0  
**Fecha**: Octubre 16, 2025  
**Proyecto**: StopCardio HR Management System
