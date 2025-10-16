# Checklist - Iteración 3

**Fecha de inicio:** 16 de octubre de 2025
**Iteración:** 3 - Módulo de Vacaciones (Empleado)
**Duración estimada:** 1 día
**Estado:** ✅ COMPLETADA (excepto integración de rutas)

---

## 📋 Pre-requisitos ✅

- [x] Iteración 2 completada (112 tests SUCCESS)
- [x] Módulo de fichajes funcional
- [x] Arquitectura de mappers establecida
- [x] Manejo correcto de fechas con Date objects
- [x] Patrones de testing robustos (fakeAsync, tick())
- [x] ApiService con soporte para query params

---

## 🎯 Objetivos de la Iteración 3

Permitir a los empleados:
1. Solicitar vacaciones con fechas de inicio y fin
2. Ver el listado de sus solicitudes de vacaciones
3. Visualizar el balance de días disponibles/usados/pendientes
4. Ver el estado de cada solicitud (pendiente, aprobada, rechazada)

---

## 📝 Tareas a Realizar

### 1. Modelos y Tipos
- [x] Crear `src/app/core/models/vacaciones.model.ts`
  - [x] Interface `Vacacion` (frontend - camelCase)
  - [x] Interface `VacacionApi` (backend - snake_case)
  - [x] Interface `VacacionCreate` / `VacacionCreateApi`
  - [x] Type para estado: `'pending' | 'approved' | 'rejected'`
  - [x] Type para tipo: `'vacation' | 'sick_leave' | 'personal'`
  - [x] Interface `VacacionBalance` / `VacacionBalanceApi`
  - [x] Interface de respuesta paginada

### 2. Mappers
- [x] Crear `src/app/core/models/vacaciones.mapper.ts`
  - [x] `mapVacacionApiToVacacion()`
  - [x] `mapVacacionCreateToApi()`
  - [x] `mapVacacionBalanceApiToVacacionBalance()`
  - [x] `mapVacacionListResponseApiToVacacionListResponse()`

### 3. Servicio de Vacaciones
- [x] Crear `src/app/features/vacaciones/vacaciones.service.ts`
  - [x] Signal privado para lista de vacaciones
  - [x] Signal privado para balance de días
  - [x] Signal privado para estado de carga y error
  - [x] Signal privado para paginación
  - [x] Computed signals públicos
  - [x] Método `createVacacion(data: VacacionCreate)`
  - [x] Método `loadVacaciones(params?: VacacionQueryParams)`
  - [x] Método `loadBalance()`
  - [x] Método `goToPage(page: number)`

### 4. Componente de Vacaciones
- [x] Crear `src/app/features/vacaciones/vacaciones.component.ts`
  - [x] Formulario reactivo para solicitar vacaciones
  - [x] Validaciones (fechas, tipo, motivo min 10/max 1000)
  - [x] Validación programática (fechaFin > fechaInicio)
  - [x] Visualización del balance de días
  - [x] Lista de solicitudes de vacaciones
  - [x] Controles de paginación
  - [x] Manejo de estados de carga
  - [x] Manejo de errores
  - [x] Badge para estado de solicitud
  - [x] Progress bar dinámica para uso de vacaciones

- [x] Crear `src/app/features/vacaciones/vacaciones.component.html`
  - [x] Sección de balance de días (4 cards con gradientes)
  - [x] Progress bar visual con colores dinámicos
  - [x] Formulario de nueva solicitud con validaciones
  - [x] Tabla de historial de solicitudes
  - [x] Controles de paginación
  - [x] Mensajes de feedback
  - [x] Badges de estado y tipo

- [x] Crear `src/app/features/vacaciones/vacaciones.component.css`
  - [x] Estilos para formulario
  - [x] Estilos para badges de estado (4 estados)
  - [x] Estilos para tabla de solicitudes
  - [x] Estilos para balance de días (gradientes)
  - [x] Estados visuales (loading, success, error)
  - [x] Progress bar con clases dinámicas (success/warning/danger)
  - [x] Responsive design

### 5. Tests
- [x] Crear `src/app/features/vacaciones/vacaciones.service.spec.ts` - 13 tests ✅
  - [x] Test: Crear solicitud exitosamente (con auto-reload)
  - [x] Test: Cargar lista de vacaciones (con query params)
  - [x] Test: Cargar balance de días
  - [x] Test: Paginación funciona (cálculo de página desde skip/limit)
  - [x] Test: Manejo de errores
  - [x] Test: Computed signals (totalPages, hasVacaciones)
  - [x] Todos con patrón fakeAsync + tick()

- [x] Crear `src/app/features/vacaciones/vacaciones.component.spec.ts` - 32 tests ✅
  - [x] Test: Componente se crea correctamente
  - [x] Test: Formulario se valida correctamente (7 tests)
  - [x] Test: Envío de formulario llama al servicio (6 tests)
  - [x] Test: Balance se muestra correctamente (6 tests)
  - [x] Test: Lista de solicitudes se renderiza
  - [x] Test: Estados se muestran con badges correctos (4 tests)
  - [x] Test: Paginación funciona (6 tests)
  - [x] Test: Errores se muestran al usuario
  - [x] Todos con patrón fakeAsync + tick()

### 6. Mappers Tests
- [x] Tests integrados en vacaciones.service.spec.ts
  - [x] Test: Conversión API → Frontend (implícito en loadVacaciones)
  - [x] Test: Conversión Frontend → API (implícito en createVacacion)
  - [x] Test: Conversión de balance (implícito en loadBalance)
  - [x] Test: Conversión de respuesta paginada (implícito)

### 7. Integración
- [ ] Actualizar `src/app/app.routes.ts`
  - [ ] Añadir ruta lazy-loaded para `/vacaciones`
  - [ ] Proteger con `authGuard`
- [ ] Actualizar navegación en `main-layout.component.html`
  - [ ] Añadir link a vacaciones en el menú

### 8. Validaciones
- [x] Fecha de inicio no puede ser vacía (required)
- [x] Fecha de fin debe ser posterior a fecha de inicio (validación programática)
- [x] Tipo de vacación es requerido
- [x] Motivo es REQUERIDO (min 10, max 1000 caracteres)
- [ ] Solo usuarios autenticados pueden acceder (pendiente: authGuard en ruta)
- [x] Balance se calcula correctamente (computed en componente)

---

## 🏗️ Arquitectura Actualizada

### Reorganización de Servicios
- [x] Servicios movidos a carpetas `services/` dentro de cada feature
  - [x] `features/fichajes/services/fichajes.service.ts`
  - [x] `features/vacaciones/services/vacaciones.service.ts`
- [x] Imports actualizados en componentes y tests

### Testing Standards Establecidos
- [x] Documentado patrón fakeAsync + tick() en `.github/copilot-instructions.md`
- [x] Aplicado a todos los 45 tests nuevos
- [x] Patrón de mocks con signals (writable privado + readonly público)

---

## 🧪 Criterios de Aceptación

### Funcionalidad
- [x] El empleado puede crear una solicitud de vacaciones
- [x] Se validan las fechas correctamente (required + fechaFin > fechaInicio)
- [x] Se muestra el balance de días (10 campos: disponibles, usados, pendientes, etc.)
- [x] Se muestra el listado de solicitudes con su estado
- [x] La paginación funciona correctamente (con cálculo desde skip/limit)
- [x] Estados se visualizan claramente (4 badges: pending/approved/rejected/cancelled)
- [x] Progress bar dinámica muestra uso de vacaciones
- [x] Mensajes de error claros cuando algo falla

### Técnico
- [x] Todos los tests pasan (**157 tests SUCCESS**: 112 base + 13 servicio + 32 componente)
- [x] Código sigue convenciones de Angular 20
- [x] Uso correcto de signals y computed
- [x] Formularios reactivos con validaciones (min/max length, required)
- [x] Mappers implementados para API ↔️ Frontend (4 mappers)
- [x] Nombres en camelCase (frontend) y snake_case (API)
- [x] Date objects para todas las fechas (con conversión UTC)
- [x] 100% alineación con OpenAPI schema

### UX
- [x] Formulario claro e intuitivo (con contador de caracteres)
- [x] Balance de días visible y comprensible (4 cards con gradientes)
- [x] Estados de solicitud claramente diferenciados (badges de colores)
- [x] Estados de carga visibles (signal loading)
- [x] Errores se comunican al usuario (signal error + clearError)
- [x] Fechas en formato español (date pipe 'dd/MM/yyyy')

---

## 📚 Recursos Necesarios

### Documentación de Referencia
- `/docs/ANGULAR-20-GUIA.md` - Convenciones Angular
- `/docs/iteraciones/iteracion-3.md` - Plan de iteración
- `/docs/iteraciones/SESION-ITERACION-2.md` - Patrones de la iteración anterior
- Documentación de ReactiveFormsModule

### Endpoints API (Supuestos)
```typescript
POST /api/vacaciones              // Crear solicitud
GET  /api/vacaciones?page=1&page_size=10  // Obtener historial
GET  /api/vacaciones/balance      // Obtener balance de días
```

### Estructura de Datos (Ejemplo)
```typescript
// API Response (snake_case)
interface VacacionApi {
  id: number;
  user_id: number;
  start_date: string;  // ISO 8601 con Z
  end_date: string;    // ISO 8601 con Z
  days_count: number;
  tipo: 'vacation' | 'sick_leave' | 'personal';
  estado: 'pending' | 'approved' | 'rejected';
  descripcion: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend Model (camelCase)
interface Vacacion {
  id: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  daysCount: number;
  tipo: 'vacation' | 'sick_leave' | 'personal';
  estado: 'pending' | 'approved' | 'rejected';
  descripcion: string | null;
  approvedBy: number | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Balance
interface VacacionBalance {
  totalDays: number;      // Días totales asignados por año
  usedDays: number;       // Días ya usados (aprobados)
  pendingDays: number;    // Días en solicitudes pendientes
  availableDays: number;  // Días disponibles (total - used - pending)
}
```

---

## 🚀 Orden de Implementación Sugerido

1. **Modelos y Mappers** (base sólida)
2. **Servicio** (lógica de negocio)
3. **Componente básico** (formulario + listado)
4. **Tests del servicio** (validar lógica)
5. **Tests del componente** (validar UI)
6. **Tests de mappers** (validar conversiones)
7. **Estilos y UX** (pulir interfaz)
8. **Integración** (rutas y navegación)
9. **Validación final** (tests e2e manual)

---

## 📊 Métricas Objetivo

- **Tests base actual:** 112 tests
- **Tests nuevos esperados:** ~30-35 tests
- **Tests nuevos reales:** 45 tests (13 servicio + 32 componente) ✅
- **Tests totales objetivo:** ~140-145 tests
- **Tests totales reales:** **157 tests SUCCESS** ✅
- **Cobertura:** 100% en servicios y componentes ✅
- **Estado esperado:** 0 FAILED
- **Estado real:** **0 FAILED** ✅

---

## ✅ Checklist de Finalización

Al completar la iteración, verificar:
- [x] Todos los tests pasan (157 SUCCESS)
- [x] Modelos alineados 100% con OpenAPI schema
- [ ] Formulario funciona en navegador (pendiente: integración rutas)
- [x] Balance se calcula correctamente (computed signals + getters)
- [x] Documentación actualizada (SESION-ITERACION-3.md creado)
- [x] Código revisado y refactorizado (arquitectura mejorada)
- [x] Sin warnings de TypeScript ✅
- [x] Sin console.log() en producción (solo console.error en validaciones)
- [x] CHECKLIST-ITERACION-3.md actualizado
- [x] SESION-ITERACION-3.md creado
- [x] Testing standards documentados en copilot-instructions.md

---

**Preparado para comenzar Iteración 3** 🚀

Aplicaremos los patrones aprendidos en Iteración 2:
- ✅ Date objects con timezone UTC
- ✅ fakeAsync y tick() en tests
- ✅ Mocks custom para signals
- ✅ Formularios reactivos con validaciones
- ✅ Computed signals para estado derivado
