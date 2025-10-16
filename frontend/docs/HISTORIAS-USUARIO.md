# Historias de Usuario - Frontend StopCardio

## 📖 Índice

1. [Módulo de Autenticación](#módulo-de-autenticación)
2. [Módulo de Fichajes](#módulo-de-fichajes)
3. [Módulo de Vacaciones y Ausencias](#módulo-de-vacaciones-y-ausencias)
4. [Módulo de Gestión de Usuarios](#módulo-de-gestión-de-usuarios)
5. [Dashboard y Navegación](#dashboard-y-navegación)

---

## Módulo de Autenticación

### 🔐 HU-AUTH-001: Login de Usuario

**Como** usuario del sistema  
**Quiero** iniciar sesión con mi username y contraseña  
**Para** acceder a las funcionalidades del sistema según mi rol

#### Criterios de Aceptación
- ✅ Formulario con campos de username y password
- ✅ Validación de campos requeridos
- ✅ Botón de "Iniciar Sesión" deshabilitado si campos vacíos
- ✅ Mensaje de error si credenciales incorrectas
- ✅ Almacenamiento seguro del token JWT
- ✅ Redirección al dashboard tras login exitoso
- ✅ Loading state durante la petición

#### Validaciones
- Username: requerido, mínimo 3 caracteres
- Password: requerido, mínimo 6 caracteres

#### Endpoint
```
POST /auth/login
Body: { "username": "string", "password": "string" }
Response: { "access_token": "string", "token_type": "bearer" }
```

---

### 🚪 HU-AUTH-002: Logout de Usuario

**Como** usuario autenticado  
**Quiero** cerrar sesión  
**Para** proteger mi cuenta cuando termine de usar la aplicación

#### Criterios de Aceptación
- ✅ Botón de "Cerrar Sesión" visible en navegación
- ✅ Modal de confirmación antes de cerrar sesión
- ✅ Limpieza del token almacenado
- ✅ Redirección a página de login
- ✅ Mensaje de confirmación de logout exitoso

#### Endpoint
```
POST /auth/logout
```

---

### 👤 HU-AUTH-003: Ver Perfil de Usuario

**Como** usuario autenticado  
**Quiero** ver mi información de perfil  
**Para** confirmar mi identidad y datos en el sistema

#### Criterios de Aceptación
- ✅ Mostrar nombre completo
- ✅ Mostrar email
- ✅ Mostrar rol (Empleado/RRHH)
- ✅ Mostrar balance de vacaciones
- ✅ Accesible desde navegación principal

#### Endpoint
```
GET /auth/me
Response: { "id", "username", "full_name", "email", "role", "dias_vacaciones_disponibles" }
```

---

## Módulo de Fichajes

### ⏰ HU-FICHAJE-001: Registrar Fichaje

**Como** empleado  
**Quiero** registrar mi entrada o salida con un botón  
**Para** que quede constancia de mi horario de trabajo

#### Criterios de Aceptación
- ✅ Botón prominente de "Fichar Entrada" o "Fichar Salida"
- ✅ Detección automática del tipo de fichaje según el último registrado
- ✅ Registro con timestamp actual
- ✅ Confirmación visual inmediata
- ✅ Actualización automática del estado en dashboard
- ✅ Mensaje de éxito con hora registrada
- ✅ Prevención de doble clic

#### Validaciones
- No permitir dos entradas consecutivas sin salida
- No permitir dos salidas consecutivas sin entrada

#### Endpoint
```
POST /fichajes/
Body: { "tipo": "entrada" | "salida" }
Response: Fichaje creado con timestamp
```

---

### 📋 HU-FICHAJE-002: Ver Historial de Fichajes Propios

**Como** empleado  
**Quiero** ver mi historial de fichajes  
**Para** consultar mis registros de entrada y salida

#### Criterios de Aceptación
- ✅ Tabla con listado de fichajes ordenados por fecha (más reciente primero)
- ✅ Columnas: fecha, hora, tipo (entrada/salida)
- ✅ Paginación (20 registros por página)
- ✅ Filtro por rango de fechas
- ✅ Indicador visual diferenciado para entrada/salida
- ✅ Empty state si no hay fichajes
- ✅ Loading state durante carga

#### Endpoint
```
GET /fichajes/me?page=1&page_size=20&fecha_desde=2025-01-01&fecha_hasta=2025-12-31
Response: { "items": [...], "total": 100, "page": 1, "page_size": 20 }
```

---

### 🔍 HU-FICHAJE-003: Ver Todos los Fichajes (RRHH)

**Como** personal de RRHH  
**Quiero** ver los fichajes de todos los empleados  
**Para** supervisar la asistencia y puntualidad

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Tabla con: fecha, hora, tipo, empleado
- ✅ Filtro por empleado (dropdown o búsqueda)
- ✅ Filtro por tipo (entrada/salida)
- ✅ Filtro por rango de fechas
- ✅ Paginación
- ✅ Ordenación por columnas
- ✅ Exportar a CSV (opcional)

#### Endpoint
```
GET /fichajes/?user_id=1&tipo=entrada&fecha_desde=...&page=1
Response: Lista paginada de fichajes
```

---

### ✏️ HU-FICHAJE-004: Solicitar Corrección de Fichaje

**Como** empleado  
**Quiero** solicitar la corrección de un fichaje erróneo  
**Para** que mi registro de asistencia sea preciso

#### Criterios de Aceptación
- ✅ Botón "Solicitar Corrección" en cada fichaje propio
- ✅ Modal/formulario con:
  - Fichaje original (solo lectura)
  - Nuevo timestamp (date + time picker)
  - Motivo de la corrección (textarea, mínimo 10 caracteres)
- ✅ Validación de timestamp (no futuro, no más de 30 días atrás)
- ✅ Confirmación antes de enviar
- ✅ Mensaje de éxito al crear solicitud

#### Validaciones
- Timestamp nuevo debe ser diferente al original
- Motivo: mínimo 10 caracteres, máximo 500

#### Endpoint
```
POST /fichajes/{id}/solicitar-correccion
Body: { "nuevo_timestamp": "2025-10-16T09:00:00", "motivo": "string" }
```

---

### 📝 HU-FICHAJE-005: Ver Solicitudes de Corrección

**Como** empleado  
**Quiero** ver el estado de mis solicitudes de corrección  
**Para** saber si fueron aprobadas o rechazadas

#### Criterios de Aceptación
- ✅ Lista de solicitudes propias
- ✅ Información mostrada:
  - Fichaje original (fecha, hora, tipo)
  - Nuevo timestamp solicitado
  - Motivo
  - Estado (pendiente/aprobada/rechazada)
  - Comentarios de RRHH (si los hay)
  - Fecha de solicitud
- ✅ Filtro por estado
- ✅ Indicadores visuales por estado (colores, iconos)

#### Endpoint
```
GET /fichajes/correcciones/me
Response: Lista de solicitudes de corrección
```

---

### ✅ HU-FICHAJE-006: Aprobar/Rechazar Corrección (RRHH)

**Como** personal de RRHH  
**Quiero** aprobar o rechazar solicitudes de corrección  
**Para** mantener la integridad de los registros

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Lista de todas las solicitudes pendientes
- ✅ Información detallada de cada solicitud:
  - Datos del empleado
  - Fichaje original vs propuesto
  - Motivo del empleado
- ✅ Botones de "Aprobar" y "Rechazar"
- ✅ Campo opcional de comentarios al aprobar/rechazar
- ✅ Modal de confirmación
- ✅ Actualización automática de la lista
- ✅ Notificación al empleado (opcional)

#### Endpoints
```
PATCH /fichajes/correcciones/{id}/aprobar
Body: { "comentarios": "string" }

PATCH /fichajes/correcciones/{id}/rechazar
Body: { "comentarios": "string" }
```

---

## Módulo de Vacaciones y Ausencias

### 🏖️ HU-VACACIONES-001: Solicitar Vacaciones/Ausencia

**Como** empleado  
**Quiero** solicitar días de vacaciones o ausencia  
**Para** planificar mis días libres

#### Criterios de Aceptación
- ✅ Formulario con campos:
  - Tipo de solicitud (dropdown):
    - Vacaciones
    - Baja por enfermedad
    - Asunto personal
    - Otro
  - Fecha de inicio (date picker)
  - Fecha de fin (date picker)
  - Motivo (textarea)
- ✅ Cálculo automático de días solicitados (excluyendo fines de semana)
- ✅ Mostrar días disponibles actuales
- ✅ Validación: no solicitar más días de los disponibles (si es vacación)
- ✅ Validación: fecha inicio <= fecha fin
- ✅ Validación: no fechas en el pasado
- ✅ Confirmación antes de enviar
- ✅ Mensaje de éxito con resumen

#### Validaciones
- Tipo: requerido
- Fecha inicio: requerida, no pasado
- Fecha fin: requerida, >= fecha inicio
- Motivo: mínimo 10 caracteres, máximo 1000
- Días disponibles suficientes (solo vacaciones)

#### Endpoint
```
POST /vacaciones/
Body: {
  "tipo": "vacation" | "sick_leave" | "personal" | "other",
  "fecha_inicio": "2025-10-20",
  "fecha_fin": "2025-10-25",
  "motivo": "string"
}
Response: Solicitud creada con días_solicitados calculados
```

---

### 📋 HU-VACACIONES-002: Ver Mis Solicitudes

**Como** empleado  
**Quiero** ver todas mis solicitudes de vacaciones/ausencias  
**Para** consultar su estado y detalles

#### Criterios de Aceptación
- ✅ Lista de solicitudes propias ordenadas por fecha (más reciente primero)
- ✅ Información mostrada:
  - Tipo de solicitud (con icono)
  - Fechas (inicio - fin)
  - Días solicitados
  - Estado (pendiente/aprobada/rechazada/cancelada)
  - Motivo
  - Comentarios de RRHH (si los hay)
  - Fecha de solicitud
- ✅ Filtros:
  - Por estado
  - Por tipo
  - Por rango de fechas
- ✅ Indicadores visuales por estado
- ✅ Botón "Cancelar" en solicitudes pendientes
- ✅ Empty state si no hay solicitudes

#### Endpoint
```
GET /vacaciones/me?status=pending&tipo=vacation
Response: Lista de solicitudes
```

---

### 🗑️ HU-VACACIONES-003: Cancelar Solicitud

**Como** empleado  
**Quiero** cancelar una solicitud pendiente  
**Para** corregir un error o cambio de planes

#### Criterios de Aceptación
- ✅ Botón "Cancelar" solo visible en solicitudes pendientes
- ✅ Modal de confirmación
- ✅ Restauración de días disponibles (si es vacación aprobada)
- ✅ Actualización inmediata de la lista
- ✅ Mensaje de confirmación

#### Endpoint
```
DELETE /vacaciones/{id}
```

---

### 🔍 HU-VACACIONES-004: Ver Todas las Solicitudes (RRHH)

**Como** personal de RRHH  
**Quiero** ver todas las solicitudes de vacaciones/ausencias  
**Para** gestionarlas y tener visibilidad del equipo

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Tabla con todas las solicitudes
- ✅ Columnas:
  - Empleado
  - Tipo
  - Fechas
  - Días solicitados
  - Estado
  - Fecha de solicitud
- ✅ Filtros:
  - Por empleado
  - Por estado
  - Por tipo
  - Por rango de fechas
- ✅ Paginación
- ✅ Ordenación por columnas
- ✅ Acceso a detalles
- ✅ Acciones rápidas (aprobar/rechazar)

#### Endpoint
```
GET /vacaciones/?user_id=1&status=pending&page=1
Response: Lista paginada de solicitudes
```

---

### ✅ HU-VACACIONES-005: Aprobar Solicitud (RRHH)

**Como** personal de RRHH  
**Quiero** aprobar una solicitud de vacaciones/ausencia  
**Para** autorizar los días libres del empleado

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Botón "Aprobar" en solicitudes pendientes
- ✅ Modal de confirmación con:
  - Resumen de la solicitud
  - Campo opcional de comentarios
  - Información de impacto (días restantes del empleado)
- ✅ Actualización del balance de días (si es vacación)
- ✅ Registro de quien aprobó y cuándo
- ✅ Mensaje de éxito
- ✅ Notificación al empleado (opcional)

#### Endpoint
```
PATCH /vacaciones/{id}/aprobar
Body: { "comentarios": "string" }
Response: Solicitud actualizada
```

---

### ❌ HU-VACACIONES-006: Rechazar Solicitud (RRHH)

**Como** personal de RRHH  
**Quiero** rechazar una solicitud de vacaciones/ausencia  
**Para** denegar días libres cuando no sea posible autorizarlos

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Botón "Rechazar" en solicitudes pendientes
- ✅ Modal de confirmación con:
  - Resumen de la solicitud
  - Campo obligatorio de comentarios (motivo del rechazo)
- ✅ Validación: comentarios mínimo 10 caracteres
- ✅ Registro de quien rechazó y cuándo
- ✅ Mensaje de éxito
- ✅ Notificación al empleado con motivo (opcional)

#### Validaciones
- Comentarios: requeridos al rechazar, mínimo 10 caracteres

#### Endpoint
```
PATCH /vacaciones/{id}/rechazar
Body: { "comentarios": "string" }
Response: Solicitud actualizada
```

---

### 📊 HU-VACACIONES-007: Ver Balance de Vacaciones

**Como** empleado  
**Quiero** ver mi balance actual de días de vacaciones  
**Para** planificar futuras solicitudes

#### Criterios de Aceptación
- ✅ Widget visible en dashboard
- ✅ Mostrar:
  - Días disponibles
  - Días anuales totales
  - Días utilizados
  - Días pendientes de aprobación
- ✅ Indicador visual (barra de progreso)
- ✅ Actualización en tiempo real

#### Endpoint
```
GET /auth/me
Response incluye: dias_vacaciones_anuales, dias_vacaciones_disponibles
```

---

## Módulo de Gestión de Usuarios

### 👥 HU-USUARIOS-001: Ver Lista de Usuarios (RRHH)

**Como** personal de RRHH  
**Quiero** ver la lista de todos los usuarios  
**Para** gestionar el personal de la empresa

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Tabla con columnas:
  - ID
  - Nombre completo
  - Email
  - Username
  - Rol
  - Días de vacaciones anuales
  - Estado (activo/inactivo)
  - Fecha de creación
- ✅ Búsqueda por nombre, email o username
- ✅ Filtro por rol
- ✅ Filtro por estado
- ✅ Paginación
- ✅ Ordenación por columnas
- ✅ Botones de acciones: ver, editar, eliminar

#### Endpoint
```
GET /users/?search=john&role=hr&page=1
Response: Lista paginada de usuarios
```

---

### ➕ HU-USUARIOS-002: Crear Usuario (RRHH)

**Como** personal de RRHH  
**Quiero** crear un nuevo usuario  
**Para** dar acceso al sistema a un nuevo empleado

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Formulario con campos:
  - Nombre completo (requerido)
  - Email (requerido, formato válido)
  - Username (requerido, único)
  - Password (requerido, mínimo 8 caracteres)
  - Confirmar password
  - Rol (dropdown: Empleado/RRHH)
  - Días de vacaciones anuales (número, default 23)
- ✅ Validaciones en tiempo real
- ✅ Mensaje de error si username/email ya existe
- ✅ Confirmación de creación exitosa
- ✅ Redirección a lista de usuarios o detalle

#### Validaciones
- Nombre completo: requerido, mínimo 3 caracteres
- Email: requerido, formato válido, único
- Username: requerido, mínimo 3 caracteres, único
- Password: mínimo 8 caracteres, al menos 1 número
- Confirmar password: debe coincidir
- Días vacaciones: número positivo, máximo 60

#### Endpoint
```
POST /users/
Body: {
  "full_name": "string",
  "email": "user@example.com",
  "username": "string",
  "password": "string",
  "role": "employee" | "hr",
  "dias_vacaciones_anuales": 23
}
```

---

### ✏️ HU-USUARIOS-003: Editar Usuario (RRHH)

**Como** personal de RRHH  
**Quiero** editar la información de un usuario  
**Para** actualizar sus datos o permisos

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Formulario pre-rellenado con datos actuales
- ✅ Campos editables:
  - Nombre completo
  - Email
  - Rol
  - Días de vacaciones anuales
  - Estado (activo/inactivo)
- ✅ No editable: username, password (cambiar por separado)
- ✅ Validaciones iguales a creación
- ✅ Confirmación antes de guardar
- ✅ Mensaje de éxito

#### Endpoint
```
PATCH /users/{id}
Body: Campos a actualizar
```

---

### 🗑️ HU-USUARIOS-004: Eliminar Usuario (RRHH)

**Como** personal de RRHH  
**Quiero** eliminar o desactivar un usuario  
**Para** revocar su acceso al sistema

#### Criterios de Aceptación
- ✅ Solo accesible con rol RRHH
- ✅ Botón "Eliminar" en lista y detalle
- ✅ Modal de confirmación con advertencia
- ✅ Opción entre:
  - Desactivar (soft delete, recomendado)
  - Eliminar permanentemente
- ✅ Mostrar impacto (fichajes, solicitudes asociadas)
- ✅ Confirmación final con texto de seguridad
- ✅ Actualización de la lista

#### Endpoint
```
DELETE /users/{id}
```

---

## Dashboard y Navegación

### 🏠 HU-DASHBOARD-001: Dashboard Empleado

**Como** empleado  
**Quiero** ver un dashboard con información relevante  
**Para** acceder rápidamente a las funciones principales

#### Criterios de Aceptación
- ✅ Widgets visibles:
  - Estado del último fichaje (entrada/salida)
  - Botón de fichaje rápido
  - Balance de vacaciones
  - Próximas ausencias aprobadas
  - Solicitudes pendientes (contador)
- ✅ Accesos rápidos a:
  - Ver fichajes
  - Solicitar vacaciones
  - Ver mis solicitudes
- ✅ Información actualizada en tiempo real
- ✅ Responsive en todos los dispositivos

---

### 🏠 HU-DASHBOARD-002: Dashboard RRHH

**Como** personal de RRHH  
**Quiero** ver un dashboard con métricas y gestión  
**Para** supervisar al equipo de manera eficiente

#### Criterios de Aceptación
- ✅ Todo lo del dashboard empleado +
- ✅ Widgets adicionales:
  - Solicitudes pendientes de aprobación (contador clicable)
  - Empleados de vacaciones hoy (lista)
  - Resumen de fichajes del día
  - Ausencias próximas
- ✅ Accesos rápidos a:
  - Gestionar solicitudes
  - Ver todos los fichajes
  - Gestionar usuarios
- ✅ Gráficos opcionales (barras, líneas)

---

### 🧭 HU-NAV-001: Navegación Principal

**Como** usuario autenticado  
**Quiero** una navegación clara  
**Para** acceder fácilmente a todas las secciones

#### Criterios de Aceptación
- ✅ Menú de navegación siempre visible
- ✅ Secciones del menú según rol:
  - **Empleado**:
    - Dashboard
    - Mis Fichajes
    - Mis Solicitudes
    - Perfil
  - **RRHH** (adicional):
    - Todos los Fichajes
    - Gestionar Solicitudes
    - Usuarios
- ✅ Indicador de sección activa
- ✅ Logo y nombre de la app
- ✅ Botón de perfil con dropdown:
  - Ver perfil
  - Cerrar sesión
- ✅ Responsive: menú hamburguesa en mobile

---

### 🔔 HU-NOTIF-001: Sistema de Notificaciones (Opcional)

**Como** usuario  
**Quiero** recibir notificaciones  
**Para** estar informado de cambios importantes

#### Criterios de Aceptación
- ✅ Toast/snackbar para:
  - Éxito en operaciones
  - Errores
  - Advertencias
- ✅ Notificaciones en tiempo real (opcional):
  - Solicitud aprobada/rechazada
  - Nueva solicitud (RRHH)
  - Fichaje registrado
- ✅ Icono de notificaciones con contador
- ✅ Panel desplegable con historial
- ✅ Marcar como leída

---

## 📊 Resumen de Historias

### Por Prioridad

#### 🔴 Alta (MVP)
- HU-AUTH-001: Login
- HU-AUTH-002: Logout
- HU-AUTH-003: Ver Perfil
- HU-FICHAJE-001: Registrar Fichaje
- HU-FICHAJE-002: Ver Historial Propio
- HU-VACACIONES-001: Solicitar Vacaciones
- HU-VACACIONES-002: Ver Mis Solicitudes
- HU-DASHBOARD-001: Dashboard Empleado
- HU-NAV-001: Navegación

#### 🟡 Media
- HU-FICHAJE-003: Ver Todos Fichajes (RRHH)
- HU-FICHAJE-004: Solicitar Corrección
- HU-FICHAJE-005: Ver Solicitudes Corrección
- HU-FICHAJE-006: Aprobar/Rechazar Corrección
- HU-VACACIONES-003: Cancelar Solicitud
- HU-VACACIONES-004: Ver Todas Solicitudes (RRHH)
- HU-VACACIONES-005: Aprobar Solicitud
- HU-VACACIONES-006: Rechazar Solicitud
- HU-VACACIONES-007: Ver Balance
- HU-USUARIOS-001: Ver Lista Usuarios
- HU-USUARIOS-002: Crear Usuario
- HU-DASHBOARD-002: Dashboard RRHH

#### 🟢 Baja
- HU-USUARIOS-003: Editar Usuario
- HU-USUARIOS-004: Eliminar Usuario
- HU-NOTIF-001: Notificaciones

### Por Módulo

- **Autenticación**: 3 HU
- **Fichajes**: 6 HU
- **Vacaciones**: 7 HU
- **Usuarios**: 4 HU
- **Dashboard/Nav**: 3 HU

**Total**: 23 Historias de Usuario

---

**Versión**: 1.0  
**Fecha**: Octubre 16, 2025  
**Proyecto**: StopCardio HR Management System
