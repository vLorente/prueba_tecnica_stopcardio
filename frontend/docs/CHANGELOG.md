# Changelog - Frontend StopCardio

Registro de cambios por iteración del desarrollo del frontend.

---

## [Iteración 1] - 2025-10-16

### ✅ Completada - Autenticación Básica

**Objetivo**: Implementar login/logout funcional con protección de rutas.

#### Añadido
- **Core Services**:
  - `ApiService`: Cliente HTTP base con manejo de errores
  - `AuthService`: Gestión de autenticación con signals (user, token, isAuthenticated, isHR, fullName)
  
- **Core Models**:
  - `user.model.ts`: User, LoginRequest, LoginResponse, AuthState
  - `api-response.model.ts`: ApiError, ValidationError, PaginatedResponse

- **Guards**:
  - `authGuard`: Protege rutas autenticadas
  - `hrGuard`: Restricción para usuarios con rol HR
  - `guestGuard`: Redirige usuarios autenticados

- **Interceptors**:
  - `authInterceptor`: Agrega JWT Bearer token a requests HTTP

- **Components**:
  - `LoginComponent`: Formulario reactivo con validación y manejo de errores
  - `ProfileComponent`: Vista de perfil de usuario (solo lectura)
  - `DashboardComponent`: Dashboard principal con acciones rápidas
  - `MainLayoutComponent`: Layout con header, navegación y footer

- **Configuración**:
  - Path aliases en `tsconfig.app.json` y `tsconfig.spec.json` (@core, @features, @layouts, etc.)
  - Environments (development y production)
  - Routing con lazy loading
  - HttpClient configurado con interceptor de autenticación

- **Tests**:
  - 33 tests unitarios implementados (services, guards, interceptor, components)
  - Cobertura de casos críticos de autenticación

#### Tecnologías Aplicadas
- Angular 20 con standalone components
- Signals y computed values para estado reactivo
- Control flow nativo (@if, @for, @switch)
- Functional guards e interceptors
- Reactive Forms
- ChangeDetectionStrategy.OnPush

#### Documentación
- `docs/ANGULAR-20-GUIA.md`: Guía de convenciones Angular 20
- `docs/iteraciones/iteracion-1.md`: Detalle de la iteración
- Path aliases documentados

---

## [Iteración 0] - 2025-10-16

### ✅ Completada - Configuración del Entorno

**Objetivo**: Preparar entorno de desarrollo.

#### Añadido
- DevContainer configurado
- Dependencias instaladas (Node.js, npm, Chrome)
- Makefile con comandos útiles (setup, start, build, test, lint, format)
- Script `scripts/setup-dev-env.sh` para instalación automatizada
- Configuración de CHROME_BIN para tests con Karma
- Documentación inicial:
  - `docs/REQUISITOS.md`
  - `docs/HISTORIAS-USUARIO.md`
  - `docs/API.md`
  - `docs/PLAN-DESARROLLO.md`
  - `docs/INDEX.md`

---

## Formato del Changelog

Cada iteración documenta:
- **Añadido**: Nuevas features, componentes, servicios
- **Cambiado**: Modificaciones a código existente
- **Corregido**: Bugs solucionados
- **Eliminado**: Código o features removidos
- **Tecnologías Aplicadas**: Convenciones y patterns usados
- **Documentación**: Archivos de docs creados o actualizados

---

**Proyecto**: StopCardio HR Management System  
**Stack**: Angular 20 + TypeScript 5.9 + RxJS 7.8  
**Metodología**: MVP iterativo con tests integrados
