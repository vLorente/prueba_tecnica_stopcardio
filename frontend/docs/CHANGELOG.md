# Changelog - Frontend StopCardio

Registro de cambios por iteración del desarrollo del frontend.

---

## [Iteración 4] - 2025-10-16

### ✅ Completada - Gestión RRHH: Aprobaciones

**Objetivo**: Implementar sistema de revisión y aprobación de solicitudes de vacaciones para usuarios HR.

**Duración**: 4 horas reales (estimado: 2-3 horas)

#### Añadido
- **Feature: Aprobaciones RRHH**:
  - `AprobacionesRrhhComponent`: Componente completo (1,015 líneas) con:
    - Tabla de solicitudes con 8 columnas
    - Filtros por estado (pendiente, aprobada, rechazada) y tipo
    - Modales de aprobación/rechazo con formularios reactivos
    - Paginación integrada
    - Badges coloreados para estados y tipos
  
- **Dashboard RRHH Unificado**:
  - `RrhhDashboardComponent`: Dashboard centralizado para funcionalidades HR
  - Ruta `/rrhh` como punto de entrada único para administración
  - Navegación jerárquica: `/rrhh/aprobaciones`, `/rrhh/usuarios`
  
- **Componente Compartido**:
  - `DashboardCardComponent`: Componente reutilizable para tarjetas de dashboard (333 líneas)
  - 9 inputs configurables (title, description, icon, route, color, etc.)
  - Renderizado condicional (link/div para habilitado/deshabilitado)
  
- **Modelos y Mappers**:
  - `VacacionReview`, `VacacionReviewApi`: Modelos para revisión (100% alineado con OpenAPI)
  - `VacacionAllQueryParams`: Parámetros de consulta para endpoint HR
  - `mapVacacionReviewToApi`: Mapper para requests de revisión
  
- **VacacionesService Extendido** (+180 líneas):
  - 5 nuevos métodos HR:
    - `loadAllSolicitudes()`: Cargar todas las solicitudes (filtros opcionales)
    - `loadPendingSolicitudes()`: Solicitudes pendientes de revisión
    - `reviewSolicitud()`: Aprobar/rechazar con comentarios
    - `loadUserBalance()`: Consultar balance de cualquier usuario
    - `goToHrPage()`: Navegación paginada
  - 6 signals privados HR, 9 computed públicos HR
  - Auto-reload después de revisión

#### Cambiado
- **Routing**:
  - Añadidas 3 rutas HR protegidas con `hrGuard`
  - Redirect: `/usuarios` → `/rrhh/usuarios`
  - Estructura jerárquica: `/rrhh/*`

- **MainLayoutComponent**:
  - Menú simplificado: 1 enlace "Administración RRHH" (en lugar de múltiples)
  - routerLinkActive con `exact: false` para sub-rutas

- **DashboardComponent**:
  - Refactorizado para usar `DashboardCardComponent` compartido
  - Tarjeta HR apunta a `/rrhh` (dashboard unificado)
  - CSS reducido (-40 líneas, estilos movidos a componente compartido)

- **RrhhDashboardComponent** (simplificación):
  - Reducido de 4 features a 2 activas (eliminadas "próximamente")
  - Eliminada sección "Accesos Rápidos"
  - CSS reducido de 238 a 56 líneas (-182 líneas)

#### Testing
- **VacacionesService**: +8 tests HR (165 tests totales)
  - Tests para todos los métodos HR
  - Patrón consistente: `async + expectAsync().toBeRejected()`
  
- **Nuevos componentes**: +25 tests
  - `RrhhDashboardComponent`: 11 tests
  - `DashboardCardComponent`: 14 tests
  
- **Tests actualizados**:
  - MainLayoutComponent: Texto "Administración RRHH"
  - DashboardComponent: Búsqueda de `app-dashboard-card`
  - FichajesService: Añadida expectativa en test de paginación

- **Resultado**: 183/183 tests SUCCESS (100%)

#### Arquitectura y Decisiones Técnicas

- **Separación de Signals Employee/HR**: 
  - `solicitudesSignal` (employee) vs `allSolicitudesSignal` (HR)
  - Permite cargar datos independientes sin conflictos

- **Componente Compartido para DRY**:
  - Extraído `DashboardCardComponent` de código duplicado
  - Reutilizable en múltiples dashboards
  - Diseño homogéneo sin animaciones de entrada

- **Lazy Loading HR Modules**:
  - Módulo RRHH completamente lazy loaded
  - Bundle size: +24.7 kB (solo carga cuando usuario HR accede)
  - Impacto gzipped: +6.11 kB

- **Testing Pattern Unificado**:
  - Eliminados `done` callbacks
  - Patrón estándar: `fakeAsync + async + expectAsync().toBeRejected()`

#### Desafíos Resueltos

1. **Testing de RouterLink**: Verificación flexible (ng-reflect o href)
2. **Dashboard Features "Próximamente"**: Reducido a solo features activas
3. **Código Duplicado**: Extraído componente compartido
4. **Patrón Testing Inconsistente**: Unificado en toda la codebase
5. **Texto de Navegación**: Actualizado "Usuarios" → "Administración RRHH"

#### Métricas
- **Código nuevo**: ~1,817 líneas netas
- **Tests**: +33 nuevos (183 totales, 100% success)
- **Bundle size**: +24.7 kB lazy loaded (+6.11 kB gzipped)
- **Componentes**: 3 nuevos (Aprobaciones, Dashboard RRHH, Dashboard Card)
- **Servicios**: 1 extendido (VacacionesService +180 líneas)

#### Documentación
- `docs/iteraciones/iteracion-4.md`: Especificación de la iteración
- `docs/iteraciones/checklists/CHECKLIST-ITERACION-4.md`: Checklist completado
- `docs/iteraciones/notas-tecnicas/ITERACION-4.md`: Deep dive técnico (decisiones arquitectónicas, desafíos, soluciones)

#### Notas
- ⚠️ Pendiente: Tests del componente `AprobacionesRrhhComponent` (~25 tests estimados)
- Ver `docs/iteraciones/notas-tecnicas/ITERACION-4.md` para análisis técnico detallado

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
