# Checklist - Iteración 3

**Fecha de inicio:** 16 de octubre de 2025
**Iteración:** 3 - Módulo de Vacaciones (Empleado)
**Duración estimada:** 1 día
**Estado:** 🚧 EN PROGRESO

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
- [ ] Crear `src/app/features/vacaciones/vacaciones.component.ts`
  - [ ] Formulario reactivo para solicitar vacaciones
  - [ ] Validaciones (fechas, tipo, descripción)
  - [ ] Visualización del balance de días
  - [ ] Lista de solicitudes de vacaciones
  - [ ] Controles de paginación
  - [ ] Manejo de estados de carga
  - [ ] Manejo de errores
  - [ ] Badge para estado de solicitud

- [ ] Crear `src/app/features/vacaciones/vacaciones.component.html`
  - [ ] Sección de balance de días
  - [ ] Formulario de nueva solicitud
  - [ ] Tabla de historial de solicitudes
  - [ ] Controles de paginación
  - [ ] Mensajes de feedback

- [ ] Crear `src/app/features/vacaciones/vacaciones.component.css`
  - [ ] Estilos para formulario
  - [ ] Estilos para badges de estado
  - [ ] Estilos para tabla de solicitudes
  - [ ] Estilos para balance de días
  - [ ] Estados visuales (loading, success, error)

### 5. Tests
- [ ] Crear `src/app/features/vacaciones/vacaciones.service.spec.ts`
  - [ ] Test: Crear solicitud exitosamente
  - [ ] Test: Cargar lista de vacaciones
  - [ ] Test: Cargar balance de días
  - [ ] Test: Paginación funciona
  - [ ] Test: Manejo de errores
  - [ ] Test: Computed signals

- [ ] Crear `src/app/features/vacaciones/vacaciones.component.spec.ts`
  - [ ] Test: Componente se crea correctamente
  - [ ] Test: Formulario se valida correctamente
  - [ ] Test: Envío de formulario llama al servicio
  - [ ] Test: Balance se muestra correctamente
  - [ ] Test: Lista de solicitudes se renderiza
  - [ ] Test: Estados se muestran con badges correctos
  - [ ] Test: Paginación funciona
  - [ ] Test: Errores se muestran al usuario

### 6. Mappers Tests
- [ ] Crear `src/app/core/models/vacaciones.mapper.spec.ts`
  - [ ] Test: Conversión API → Frontend
  - [ ] Test: Conversión Frontend → API (create)
  - [ ] Test: Conversión de balance
  - [ ] Test: Conversión de respuesta paginada

### 7. Integración
- [ ] Actualizar `src/app/app.routes.ts`
  - [ ] Añadir ruta lazy-loaded para `/vacaciones`
  - [ ] Proteger con `authGuard`
- [ ] Actualizar navegación en `main-layout.component.html`
  - [ ] Añadir link a vacaciones en el menú

### 8. Validaciones
- [ ] Fecha de inicio no puede ser pasada
- [ ] Fecha de fin debe ser posterior a fecha de inicio
- [ ] Tipo de vacación es requerido
- [ ] Descripción opcional pero con límite de caracteres
- [ ] Solo usuarios autenticados pueden acceder
- [ ] Balance se calcula correctamente

---

## 🧪 Criterios de Aceptación

### Funcionalidad
- [ ] El empleado puede crear una solicitud de vacaciones
- [ ] Se validan las fechas correctamente
- [ ] Se muestra el balance de días (disponibles, usados, pendientes)
- [ ] Se muestra el listado de solicitudes con su estado
- [ ] La paginación funciona correctamente
- [ ] Estados se visualizan claramente (pending/approved/rejected)
- [ ] Mensajes de error claros cuando algo falla

### Técnico
- [ ] Todos los tests pasan (objetivo: ~140+ tests)
- [ ] Código sigue convenciones de Angular 20
- [ ] Uso correcto de signals y computed
- [ ] Formularios reactivos con validaciones
- [ ] Mappers implementados para API ↔️ Frontend
- [ ] Nombres en camelCase (frontend) y snake_case (API)
- [ ] Date objects para todas las fechas

### UX
- [ ] Formulario claro e intuitivo
- [ ] Balance de días visible y comprensible
- [ ] Estados de solicitud claramente diferenciados
- [ ] Estados de carga visibles
- [ ] Errores se comunican al usuario
- [ ] Fechas en formato español

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
- **Tests totales objetivo:** ~140-145 tests
- **Cobertura:** Mantener 100% en servicios críticos
- **Estado esperado:** 0 FAILED

---

## ✅ Checklist de Finalización

Al completar la iteración, verificar:
- [ ] Todos los tests pasan
- [ ] Formulario funciona en navegador
- [ ] Balance se calcula correctamente
- [ ] Documentación actualizada
- [ ] Código revisado y refactorizado
- [ ] Sin warnings de TypeScript
- [ ] Sin console.log() en producción
- [ ] CHECKLIST-ITERACION-3.md actualizado
- [ ] SESION-ITERACION-3.md creado

---

**Preparado para comenzar Iteración 3** 🚀

Aplicaremos los patrones aprendidos en Iteración 2:
- ✅ Date objects con timezone UTC
- ✅ fakeAsync y tick() en tests
- ✅ Mocks custom para signals
- ✅ Formularios reactivos con validaciones
- ✅ Computed signals para estado derivado
