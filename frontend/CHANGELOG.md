# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Iteración 6] - 2025-10-16

### Añadido - Sistema de Correcciones de Fichajes

#### Modelos y Mappers (HU-FICHAJE-004, 005, 006)
- **`@core/models/fichaje.model.ts`** - Extendido con:
  - Interfaces `FichajeCorrection` y `FichajeApproval` (frontend y API)
  - Nuevos campos en `Fichaje`: `correctionReason`, `correctionRequestedAt`, `approvedBy`, `approvedAt`, `approvalNotes`
  - Enum `FichajeStatus`: `'valid' | 'pending_correction' | 'corrected' | 'rejected'`
- **`@core/mappers/fichaje.mapper.ts`** - Nuevas funciones:
  - `mapFichajeCorrectionToApi()`: Conversión de fechas a ISO 8601
  - `mapFichajeApprovalToApi()`: Mapeo de datos de aprobación

#### Servicio
- **`features/fichajes/services/fichajes.service.ts`** - 3 métodos nuevos:
  - `async solicitarCorreccion(fichajeId, correccion)`: Solicita corrección de fichaje (POST `/fichajes/{id}/correct`)
  - `async aprobarCorreccion(fichajeId, notes?)`: Aprueba solicitud de corrección (POST `/fichajes/{id}/approve`)
  - `async rechazarCorreccion(fichajeId, notes?)`: Rechaza solicitud de corrección (POST `/fichajes/{id}/approve` con `approved: false`)
  - Todos implementan patrón async/await, loading signals y recarga automática

#### Componentes

**Modal de Solicitud de Corrección (HU-FICHAJE-004)**
- **`features/fichajes/components/fichaje-correction-modal/`**
  - `fichaje-correction-modal.component.ts` (220 líneas)
    - FormGroup reactivo con validaciones exhaustivas
    - Signal `formValid` con suscripción a `statusChanges` para detectar cambios
    - Computed `canSubmit()` para habilitar/deshabilitar botón submit
    - Validaciones:
      - CheckIn y CheckOut requeridos
      - Fechas no futuras (máximo hoy)
      - Máximo 30 días hacia atrás
      - CheckOut posterior a CheckIn
      - Valores diferentes a los originales (tolerancia 1 minuto)
      - Motivo: requerido, 10-1000 caracteres
  - `fichaje-correction-modal.component.html` (150 líneas)
    - Modal overlay con gestión de clics
    - Sección "Datos Actuales" mostrando valores originales
    - Date/time pickers separados para checkIn y checkOut
    - Textarea con contador de caracteres (0/1000)
    - Mensajes de error inline
  - `fichaje-correction-modal.component.css` (300+ líneas)
    - Estilos para modal overlay, card, formulario
    - Animaciones fade-in y slide-down
    - Responsive design

**Extensión Componente Fichajes (HU-FICHAJE-005)**
- **`features/fichajes/fichajes.component.ts`** - Ampliado con:
  - Signal `statusFilter: WritableSignal<FichajeStatus | 'all'>` para filtrado
  - Signals para gestión del modal: `selectedFichaje`, `isModalOpen`
  - Computed `fichajesFiltrados()` con lógica de filtrado por estado
  - Método `onRequestCorrection(fichaje)` para abrir modal
  - Método `onModalSubmit(data)` para procesar corrección con manejo de errores
- **`features/fichajes/fichajes.component.html`** - Agregado:
  - Dropdown selector de estado con 5 opciones (Todos, Válidos, Pendientes, Corregidos, Rechazados)
  - Badges de estado con colores semánticos:
    - Verde (#10b981) - Valid
    - Amarillo (#f59e0b) - Pending
    - Azul (#3b82f6) - Corrected
    - Rojo (#ef4444) - Rejected
  - Botón icono "edit" (SVG) con tooltip CSS hover para solicitar corrección
  - Integración completa del modal: `<app-fichaje-correction-modal>`

**Vista RRHH Correcciones (HU-FICHAJE-006)**
- **`features/rrhh/components/rrhh-corrections/`** - Nuevo componente
  - `rrhh-corrections.component.ts` (148 líneas)
    - Signals: `pendingCorrections`, `selectedFichaje`, `isModalOpen`, `modalAction`, `modalNotes`, `isProcessing`
    - Computed: `loading()`, `error()`, `hasPendingCorrections()`
    - `async loadPendingCorrections()`: Filtra fichajes con `status='pending_correction'`
    - `openApprovalModal()` y `openRejectionModal()`: Abren modal de confirmación
    - `async processAction()`: Ejecuta aprobación o rechazo con reload automático
    - Helpers: `formatDate()`, `calculateHours()`
  - `rrhh-corrections.component.html` (200 líneas)
    - Tabla comparativa con 6 columnas:
      - Usuario (nombre + email)
      - Fecha de solicitud
      - Datos Originales (checkIn/checkOut/horas)
      - Datos Solicitados (highlight amarillo)
      - Motivo de corrección
      - Acciones (botones Aprobar/Rechazar)
    - Modal de confirmación con:
      - Detalles del fichaje y usuario
      - Textarea para comentarios (opcional aprobar, recomendado rechazar)
      - Spinner durante procesamiento
    - Empty state con ilustración SVG
    - Loading spinner
  - `rrhh-corrections.component.css` (400+ líneas)
    - Tabla responsive con hover effects
    - `.datetime-group.highlight`: fondo amarillo (#fef3c7), borde naranja
    - Botones semánticos: `.btn-approve` (verde), `.btn-reject` (rojo)
    - Modal overlay con backdrop blur
    - Animaciones y transiciones

#### Rutas
- **`app.routes.ts`**
  - Nueva ruta: `path: 'rrhh/correcciones'`
  - Carga dinámica: `loadComponent: RrhhCorrectionsComponent`
  - Protección: `canActivate: [hrGuard]`

### Modificado

- **Estructura de carpetas**: Componentes de usuarios reorganizados
  - Movidos a `/features/usuarios/components/` para mantener homogeneidad con resto del proyecto
  - Actualizados imports relativos en todos los archivos afectados

### Tests

#### Servicio Fichajes
- **`fichajes.service.spec.ts`** - 9 tests nuevos (24/24 total):
  - `solicitarCorreccion`: happy path + error handling
  - `aprobarCorreccion`: con/sin notas + error + verificación de body
  - `rechazarCorreccion`: con/sin notas + error + verificación de body

#### Modal de Corrección
- **`fichaje-correction-modal.component.spec.ts`** - 21 tests (15/21 pasando):
  - Component creation y lifecycle
  - Apertura/cierre modal
  - Inicialización formulario con datos del fichaje
  - Submit con datos válidos
  - Validaciones individuales (required, fechas futuras, 30 días atrás, checkout > checkin)
  - 6 tests con warnings de timezone (funcionalidad operativa)

#### Componente RRHH Correcciones
- **`rrhh-corrections.component.spec.ts`** - 19 tests nuevos (19/19 pasando):
  - Component creation
  - ngOnInit carga solicitudes pendientes
  - Filtrado correcto de status='pending_correction'
  - Apertura modales de aprobación/rechazo
  - Cierre modal y reset estado
  - Actualización de notas
  - Aprobación exitosa (con/sin notas)
  - Rechazo exitoso (con/sin notas)
  - Manejo de errores en aprobación
  - Helpers: `formatDate()`, `calculateHours()`
  - Estados: loading, error, empty state
  - Prevención de procesamiento sin fichaje seleccionado

### Estadísticas Iteración 6

- **Tests**: 320/320 pasando (100%)
  - +48 tests nuevos (servicio: 9, modal: 21, RRHH: 19)
  - Total acumulado: 320 tests
- **Cobertura de código**:
  - Statements: 90.86% (935/1029)
  - Branches: 77.2% (210/272)
  - Functions: 91.5% (194/212)
  - Lines: 90.89% (879/967)
- **Código nuevo**: ~1,400 líneas
  - Modelos/Mappers: ~50 líneas
  - Servicio: ~100 líneas
  - Modal corrección: ~670 líneas
  - Componente RRHH: ~750 líneas
  - Tests: ~400 líneas
- **Archivos creados**: 6
- **Archivos modificados**: 8

### Historias de Usuario Completadas

- **HU-FICHAJE-004**: Solicitar corrección de fichaje ✅
  - Como empleado, puedo solicitar la corrección de un fichaje con motivo
  - Modal con formulario reactivo y validaciones exhaustivas
  - Botón icono sobrio con tooltip hover

- **HU-FICHAJE-005**: Ver mis solicitudes de corrección ✅
  - Como empleado, puedo ver el estado de mis solicitudes
  - Filtro por estado con 5 opciones
  - Badges visuales de estado con colores semánticos

- **HU-FICHAJE-006**: Aprobar/Rechazar correcciones (RRHH) ✅
  - Como RRHH, puedo gestionar solicitudes pendientes
  - Vista de tabla comparativa con datos originales vs solicitados
  - Modal de confirmación con campo de comentarios
  - Botones de acción semánticos (verde/rojo)

### Lecciones Aprendidas

1. **Signals con Formularios Reactivos**: Los `computed()` no detectan automáticamente cambios en `FormGroup.valid`. Solución: Signal dedicado + suscripción a `statusChanges`.

2. **Testing Async en Componentes**: Al usar `fakeAsync()`, necesario resetear spies con `.calls.reset()` cuando se miden llamadas acumulativas entre tests.

3. **Filtrado Local vs Endpoint**: Decisión de filtrar `status='pending_correction'` localmente en lugar de crear endpoint separado, manteniendo consistencia con arquitectura de API analizada.

## [Iteración 5] - 2025-10-16

### Añadido - Gestión de Usuarios CRUD

#### Modelos y Mappers
- **`@core/models/user.model.ts`**: Interfaces `User`, `UserCreate`, `UserUpdate` y sus variantes API
- **`@core/mappers/user.mapper.ts`**: Funciones de mapeo bidireccional entre frontend (camelCase) y backend (snake_case)

#### Servicio
- **`features/usuarios/services/usuarios.service.ts`** (316 líneas)
  - Métodos CRUD completos: `loadUsers()`, `createUser()`, `updateUser()`, `deleteUser()`, `getUserById()`
  - State management con Angular Signals: `users`, `loading`, `error`, `total`
  - Paginación integrada: `currentPage`, `pageSize`, `totalPages`, `hasNextPage`, `hasPreviousPage`
  - Métodos de navegación: `nextPage()`, `previousPage()`, `goToPage()`, `changePageSize()`
  - Integración completa con API REST `/api/users/`

#### Componentes
- **`features/usuarios/usuarios-list/`** - Componente principal de lista
  - `usuarios-list.component.ts` (221 líneas): Lógica de tabla, modales y paginación
  - `usuarios-list.component.html` (233 líneas): Tabla con 7 columnas, modales CRUD
  - `usuarios-list.component.css` (566 líneas): Estilos completos para tabla y modales
  - Características:
    - Tabla responsive con datos de usuarios
    - Modal de creación de usuario
    - Modal de edición con formulario pre-poblado
    - Modal de confirmación de eliminación
    - Controles de paginación (anterior/siguiente, selector de tamaño)
    - Badges visuales para roles e indicador de estado activo/inactivo

- **`features/usuarios/usuario-form/`** - Formulario reutilizable
  - `usuario-form.component.ts` (175 líneas): FormGroup reactivo con validaciones
  - `usuario-form.component.html` (118 líneas): Template del formulario
  - `usuario-form.component.css` (187 líneas): Estilos para el formulario
  - Características:
    - Modo dual: crear/editar (input `user?`)
    - Validaciones declarativas:
      - Email: requerido, formato email
      - Nombre completo: requerido, mínimo 3 caracteres
      - Password: requerido en crear, mínimo 8 caracteres, opcional en editar
      - Role: requerido, selector con opciones (admin, hr, employee)
      - Estado activo: checkbox
    - Outputs: `submitForm` (User o UserUpdate), `cancel`
    - Mensajes de error descriptivos

- **`features/usuarios/usuarios.component.ts`** (11 líneas): Wrapper component

#### Tests
- **`usuarios.service.spec.ts`** (531 líneas): 20 tests unitarios
  - Tests de loadUsers: carga básica, query params, errores
  - Tests de createUser: creación exitosa con reload, errores
  - Tests de updateUser: actualización local, errores
  - Tests de deleteUser: eliminación de lista, errores
  - Tests de getUserById: obtención individual, errores
  - Tests de paginación: navegación, cambio de tamaño

- **`usuarios-list.component.spec.ts`** (422 líneas): 37 tests unitarios
  - Renderizado de componente
  - Renderizado de tabla con datos
  - Estados loading y error
  - Apertura de modales (crear, editar, eliminar)
  - Confirmación de eliminación
  - Paginación (siguiente, anterior, tamaño)
  - Badges de rol y estado

- **`usuario-form.component.spec.ts`** (409 líneas): 45 tests unitarios
  - Inicialización de componente
  - Modo crear vs editar
  - Validaciones de email, nombre, password, role
  - Submit del formulario
  - Emisión de eventos (submitForm, cancel)
  - Renderizado de template
  - Estados de error

**Total: 102 tests nuevos** cubriendo la funcionalidad CRUD de usuarios

#### Integración
- Ruta `/rrhh/usuarios` activa y funcional
- Card "Gestión de Usuarios" en dashboard RRHH apuntando a la ruta correcta
- Navegación completa entre dashboard y gestión de usuarios

### Estructura de Archivos
```
features/usuarios/
├── services/
│   ├── usuarios.service.ts (316 líneas)
│   └── usuarios.service.spec.ts (531 líneas)
├── usuario-form/
│   ├── usuario-form.component.ts (175 líneas)
│   ├── usuario-form.component.html (118 líneas)
│   ├── usuario-form.component.css (187 líneas)
│   └── usuario-form.component.spec.ts (409 líneas)
├── usuarios-list/
│   ├── usuarios-list.component.ts (221 líneas)
│   ├── usuarios-list.component.html (233 líneas)
│   ├── usuarios-list.component.css (566 líneas)
│   └── usuarios-list.component.spec.ts (422 líneas)
└── usuarios.component.ts (11 líneas)
```

### Técnico
- **Arquitectura**: Smart/Dumb components pattern
- **Estado**: Angular Signals con getters para reactividadread-only
- **Forms**: Reactive Forms con validaciones declarativas
- **Testing**: Karma + Jasmine con fakeAsync, HttpClientTestingModule
- **Change Detection**: OnPush strategy
- **Date Handling**: Date objects con DatePipe en templates
- **API Integration**: Mappers centralizados para transformación camelCase ↔ snake_case

### Métricas
- **Líneas de código**: ~2,800 líneas (producción + tests)
- **Tests**: 102 tests (20 servicio + 37 lista + 45 formulario)
- **Coverage**: 97.4% de tests pasando (228/234)
- **Componentes**: 3 componentes nuevos
- **Servicios**: 1 servicio nuevo
- **Modelos**: 2 archivos de modelos/mappers

---

## [Iteración 4] - 2025-10-15

### Añadido - Aprobación de Vacaciones (RRHH)

- Componente de aprobaciones de vacaciones para usuarios con rol HR
- Vista de solicitudes pendientes de aprobación
- Acciones de aprobar/rechazar con confirmación
- Integración con endpoint `/api/vacaciones/all`
- Dashboard RRHH con acceso a módulo de aprobaciones

---

## [Iteración 3] - 2025-10-14

### Añadido - Gestión de Vacaciones (Empleado)

- CRUD completo de solicitudes de vacaciones
- Validación de fechas y días disponibles
- Visualización de balance de vacaciones
- Estados de solicitud (pendiente, aprobada, rechazada)
- Filtrado por estado

---

## [Iteración 2] - 2025-10-13

### Añadido - Sistema de Fichajes

- Componente de fichaje con check-in/check-out
- Visualización de fichajes del empleado
- Indicador de fichaje activo
- Histórico de fichajes con paginación

---

## [Iteración 1] - 2025-10-12

### Añadido - Autenticación y Base

- Sistema de autenticación con JWT
- Login/Logout
- Guards de autenticación y roles
- Interceptor HTTP para tokens
- Layout principal con navegación
- Dashboard base para empleados
- Profile de usuario
- Servicios core (AuthService, ApiService)
- Tests unitarios básicos
