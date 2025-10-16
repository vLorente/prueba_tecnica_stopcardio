# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
