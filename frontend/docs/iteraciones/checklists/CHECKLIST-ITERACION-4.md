# Checklist - Iteración 4

**Fecha de inicio:** 16 de octubre de 2025
**Fecha de finalización:** 16 de octubre de 2025
**Iteración:** 4 - Gestión RRHH: Aprobaciones de Vacaciones
**Duración real:** 4 horas
**Estado:** ✅ COMPLETADA

---

## 📋 Pre-requisitos ✅

- [x] Iteración 3 completada (157 tests SUCCESS)
- [x] Módulo de vacaciones empleado funcional
- [x] VacacionesService con métodos de listado y balance
- [x] Modelos de vacaciones alineados con OpenAPI
- [x] Arquitectura de servicios establecida (services/ folders)
- [x] Testing standards documentados (fakeAsync + tick)

---

## 🎯 Objetivos de la Iteración 4

Permitir a RRHH:
1. Ver listado completo de solicitudes de vacaciones (todos los empleados)
2. Filtrar solicitudes por estado (pendientes prioritariamente)
3. Aprobar solicitudes de vacaciones
4. Rechazar solicitudes de vacaciones con comentarios
5. Ver balance de vacaciones de cualquier empleado

---

## 📝 Tareas a Realizar

### 1. Modelos de Datos (Revisión)
- [x] Verificar modelo `VacacionReview` existe (para aprobar/rechazar)
- [x] Añadir a `vacaciones.model.ts`:
  - [x] Interface `VacacionReview` / `VacacionReviewApi`
  - [x] Interface `VacacionAllQueryParams` para filtros HR

### 2. Mappers
- [x] Crear mapper para `VacacionReview`
  - [x] `mapVacacionReviewToApi()`

### 3. Servicio de Vacaciones (Extensión)
- [x] Extender `features/vacaciones/services/vacaciones.service.ts` (HR methods)
  - [x] Método `loadAllSolicitudes()` - Listar todas las solicitudes (HR)
  - [x] Método `loadPendingSolicitudes()` - Solo pendientes (HR)
  - [x] Método `reviewSolicitud(id, review)` - Aprobar/rechazar (HR)
  - [x] Método `loadUserBalance(userId)` - Balance de cualquier usuario (HR)
  - [x] Método `goToHrPage(page)` - Paginación HR
  - [x] Signals para solicitudes HR (allSolicitudes, pendingSolicitudes, userBalance)
  - [x] Computed para cantidades y paginación HR

### 4. Componente de Aprobaciones RRHH
- [x] Crear `features/vacaciones/aprobaciones/aprobaciones-rrhh.component.ts`
  - [x] Inyectar `VacacionesService`
  - [x] Inyectar `AuthService` para verificar rol HR
  - [x] Signal local para filtros activos (filterStatus, filterTipo)
  - [x] Signal local para solicitud seleccionada
  - [x] Signal local para modales (showApprovalModal, showRejectionModal)
  - [x] Formulario reactivo para aprobar (comentarios opcionales)
  - [x] Formulario reactivo para rechazar (comentarios requeridos max 500)
  - [x] Método `onApprove()`
  - [x] Método `onReject()`
  - [x] Filtros por estado, tipo
  - [x] Paginación (onPreviousPage, onNextPage)
  - [x] Métodos auxiliares (getEstadoClass, getTipoClass, canReview)

- [x] Crear `features/vacaciones/aprobaciones/aprobaciones-rrhh.component.html`
  - [x] Barra de filtros (estado, tipo)
  - [x] Tabla de solicitudes con información completa
  - [x] Columnas: Usuario, Tipo, Fechas, Días, Estado, Motivo, Acciones
  - [x] Botones de aprobar/rechazar (solo para pendientes)
  - [x] Modal de confirmación para aprobar con comentarios opcionales
  - [x] Modal de rechazo con textarea para comentarios requeridos
  - [x] Badge de estado prominente
  - [x] Información de quien revisó y cuándo
  - [x] Paginación
  - [x] Indicador de carga
  - [x] Mensaje de error con botón cerrar

- [x] Crear `features/vacaciones/aprobaciones/aprobaciones-rrhh.component.css`
  - [x] Estilos para filtros (select con focus states)
  - [x] Estilos para tabla de solicitudes (hover effects)
  - [x] Estilos para botones de acción (aprobar verde, rechazar rojo)
  - [x] Estilos para modales (overlay, content, header, footer)
  - [x] Estados hover y disabled
  - [x] Badges de estado con 4 colores (pending/approved/rejected/cancelled)
  - [x] Badges de tipo con 4 colores
  - [x] Responsive design (tablet y móvil)
  - [x] Spinner de carga
  - [x] Información de empleado (nombre + email)

### 5. Integración en la Aplicación
- [x] Creado Dashboard de Administración RRHH
  - [x] Componente `features/rrhh/rrhh-dashboard.component.ts`
  - [x] Template con cards de funcionalidades (Aprobaciones, Usuarios, Informes, Fichajes)
  - [x] Estilos responsive con animaciones
  - [x] Sección de accesos rápidos

- [x] Añadidas rutas en `app.routes.ts`
  - [x] Path principal: `/rrhh` → Dashboard RRHH (con hrGuard)
  - [x] Path: `/rrhh/aprobaciones` → Aprobaciones (con hrGuard)
  - [x] Path: `/rrhh/usuarios` → Gestión Usuarios (con hrGuard)
  - [x] Redirect legacy: `/usuarios` → `/rrhh/usuarios`

- [x] Actualizado enlace de navegación en `main-layout.component.html`
  - [x] Enlace único "Administración RRHH" en lugar de múltiples enlaces
  - [x] Visible solo para usuarios HR (`@if (authService.isHR())`)
  - [x] RouterLink a `/rrhh` con active state no exacto
  - [x] Organización mejorada del menú

### 6. Tests
- [x] Extender `features/vacaciones/services/vacaciones.service.spec.ts` - 8 nuevos tests ✅
  - [x] Test: loadAllSolicitudes funciona (HR)
  - [x] Test: loadAllSolicitudes maneja errores
  - [x] Test: loadPendingSolicitudes filtra correctamente
  - [x] Test: reviewSolicitud aprueba correctamente
  - [x] Test: reviewSolicitud rechaza correctamente
  - [x] Test: loadUserBalance funciona para cualquier usuario
  - [x] Test: goToHrPage navega correctamente
  - [x] Test: goToHrPage no navega a página inválida
  - [x] Todos usando patrón async + expectAsync().toBeRejected() para errores

- [x] Crear `features/rrhh/rrhh-dashboard.component.spec.ts` - 11 tests ✅
  - [x] Test: Componente se crea correctamente
  - [x] Test: Título correcto
  - [x] Test: Features configuradas correctamente
  - [x] Test: Renderizado de dashboard-cards

- [x] Crear `shared/components/dashboard-card/dashboard-card.component.spec.ts` - 14 tests ✅
  - [x] Test: Componente se crea correctamente
  - [x] Test: Renderizado de título, descripción, icono
  - [x] Test: Renderizado condicional (link/div)
  - [x] Test: Aplicación de color y clase custom
  - [x] Test: Control de flecha y texto de acción

- [x] Actualizar tests de navegación y dashboards
  - [x] MainLayoutComponent: "Administración RRHH" en lugar de "Usuarios"
  - [x] DashboardComponent: Búsqueda de app-dashboard-card
  - [x] FichajesService: Añadir expectativa en test de paginación

- [ ] Crear `features/vacaciones/aprobaciones/aprobaciones-rrhh.component.spec.ts` (~25 tests)
  - [ ] Tests de componente (pendiente para próxima iteración)

### 7. Componente Compartido Dashboard Card
- [x] Crear `shared/components/dashboard-card/dashboard-card.component.ts`
  - [x] 9 inputs configurables (title, description, icon, route, etc.)
  - [x] Renderizado condicional (link/div)
  - [x] Standalone component
  
- [x] Crear `shared/components/dashboard-card/dashboard-card.component.html`
  - [x] Template con @if para enabled/disabled
  - [x] Footer con texto de acción y flecha
  
- [x] Crear `shared/components/dashboard-card/dashboard-card.component.css`
  - [x] Estilos unificados
  - [x] Efectos hover
  - [x] Responsive
  - [x] Sin animación de entrada (removida)

### 8. Integración y Refactoring
- [x] Actualizar Dashboard Principal
  - [x] Usar app-dashboard-card en lugar de enlaces directos
  - [x] Importar DashboardCardComponent
  - [x] Limpiar CSS (eliminar estilos duplicados)
  
- [x] Simplificar Dashboard RRHH
  - [x] Eliminar sección "Accesos Rápidos"
  - [x] Reducir a 2 features activas
  - [x] Usar app-dashboard-card
  - [x] Reducir CSS de 238 a 56 líneas

### 7. Validaciones y Seguridad
- [ ] Solo usuarios con rol HR pueden acceder a aprobaciones
- [ ] Solo solicitudes pendientes muestran botones de acción
- [ ] Comentarios obligatorios al rechazar (opcional al aprobar)
- [ ] Confirmación antes de aprobar
- [ ] Feedback visual tras aprobar/rechazar
- [ ] Auto-reload de lista tras cambio de estado

---

## 🧪 Criterios de Aceptación

### Funcionalidad
- [ ] HR puede ver todas las solicitudes de vacaciones
- [ ] HR puede filtrar por estado (especialmente "pendientes")
- [ ] HR puede aprobar una solicitud pendiente
- [ ] HR puede rechazar una solicitud pendiente con comentarios
- [ ] Se muestra feedback claro tras aprobar/rechazar
- [ ] La lista se actualiza automáticamente tras cambio
- [ ] Solo solicitudes pendientes tienen botones de acción
- [ ] Empleados NO pueden acceder a esta vista

### Técnico
- [ ] Todos los tests pasan (objetivo: ~180+ tests)
- [ ] Nuevos métodos en VacacionesService bien testeados
- [ ] Componente de aprobaciones 100% testeado
- [ ] Uso correcto de signals y computed
- [ ] Formulario reactivo para comentarios de rechazo
- [ ] Alineación 100% con OpenAPI (SolicitudReview schema)
- [ ] Nombres en camelCase (frontend) y snake_case (API)

### UX
- [ ] Interfaz clara para HR
- [ ] Filtros accesibles y visibles
- [ ] Botones de acción claramente diferenciados (verde/rojo)
- [ ] Modales de confirmación claros
- [ ] Mensajes de éxito/error visibles
- [ ] Estados de carga visibles
- [ ] Información completa en tabla (usuario, fechas, motivo)

---

## 📚 Recursos Necesarios

### Documentación de Referencia
- `/docs/openapi.json` - Schemas: SolicitudReview, endpoints HR
- `/docs/ANGULAR-20-GUIA.md` - Convenciones Angular
- `/docs/iteraciones/SESION-ITERACION-3.md` - Patrones de vacaciones
- `.github/copilot-instructions.md` - Testing standards

### Endpoints API Clave (según OpenAPI)

```typescript
// HR - Listar todas las solicitudes
GET /api/vacaciones?user_id&tipo&status&fecha_desde&fecha_hasta&activas_only&skip&limit

// HR - Listar solo pendientes
GET /api/vacaciones/pending?skip&limit

// HR - Aprobar o rechazar solicitud
POST /api/vacaciones/{solicitud_id}/review
Body: { approved: boolean, comentarios_revision?: string }

// HR - Balance de cualquier usuario
GET /api/vacaciones/balance/{user_id}
```

### Estructura de Datos

```typescript
// SolicitudReview (según OpenAPI)
interface VacacionReviewApi {
  approved: boolean;  // true = aprobar, false = rechazar
  comentarios_revision: string | null;  // max 500 chars
}

interface VacacionReview {
  approved: boolean;
  comentariosRevision: string | null;
}
```

---

## 🚀 Orden de Implementación Sugerido

1. **Revisar y extender modelos** (VacacionReview)
2. **Extender VacacionesService** (métodos HR)
3. **Tests del servicio** (nuevos métodos HR)
4. **Componente de aprobaciones** (estructura básica)
5. **Template y estilos** (tabla + modales)
6. **Tests del componente** (completos)
7. **Integración** (rutas + navegación con rol check)
8. **Validación manual** (probar en navegador como HR)

---

## 📊 Métricas Objetivo

- **Tests base actual:** 157 tests
- **Tests nuevos esperados:** ~25-30 tests
  - Servicio: ~6 tests
  - Componente: ~20 tests
- **Tests totales objetivo:** ~180-185 tests
- **Cobertura:** 100% en nuevos métodos y componente
- **Estado esperado:** 0 FAILED

---

## ✅ Checklist de Finalización

Al completar la iteración, verificar:
- [ ] Todos los tests pasan
- [ ] Funcionalidad de aprobación/rechazo funciona en navegador
- [ ] Solo HR puede acceder
- [ ] Filtros funcionan correctamente
- [ ] Documentación actualizada (SESION-ITERACION-4.md)
- [ ] Código revisado y refactorizado
- [ ] Sin warnings de TypeScript
- [ ] CHECKLIST-ITERACION-4.md actualizado

---

**Preparado para comenzar Iteración 4** 🚀

Aplicaremos los patrones establecidos en Iteración 3:
- ✅ Alineación con OpenAPI schemas
- ✅ fakeAsync + tick() en todos los tests async
- ✅ Signals para estado reactivo
- ✅ Formularios reactivos con validaciones
- ✅ Arquitectura de servicios en services/ folders
