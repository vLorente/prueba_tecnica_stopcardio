# Documentación de API - Backend StopCardio

## 🔗 Información General

- **Base URL**: `http://localhost:8000/api`
- **Formato**: JSON
- **Autenticación**: Bearer Token (JWT)
- **Documentación interactiva**: `http://localhost:8000/docs` (Swagger UI)

## 🔐 Autenticación

Todas las rutas (excepto login) requieren autenticación mediante token JWT en el header:

```
Authorization: Bearer <access_token>
```

---

## 📚 Endpoints

### 🔑 Autenticación (`/auth`)

#### POST `/auth/login`
Login de usuario y obtención de token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Errores:**
- `401`: Credenciales inválidas
- `422`: Validación fallida

---

#### GET `/auth/me`
Obtiene información del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "employee",
  "is_active": true,
  "dias_vacaciones_anuales": 23,
  "dias_vacaciones_disponibles": 18.5,
  "created_at": "2025-01-15T10:00:00",
  "updated_at": "2025-10-16T12:00:00"
}
```

**Errores:**
- `401`: No autenticado o token inválido

---

#### POST `/auth/logout`
Cierra sesión del usuario (invalidar token en frontend).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Logout successful"
}
```

---

### ⏰ Fichajes (`/fichajes`)

#### POST `/fichajes/`
Registra un nuevo fichaje (entrada o salida).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "tipo": "entrada"  // o "salida"
}
```

**Response 201:**
```json
{
  "id": 123,
  "user_id": 1,
  "tipo": "entrada",
  "timestamp": "2025-10-16T09:00:00",
  "created_at": "2025-10-16T09:00:00",
  "updated_at": "2025-10-16T09:00:00"
}
```

**Validaciones:**
- No se puede registrar dos entradas consecutivas
- No se puede registrar dos salidas consecutivas

**Errores:**
- `400`: Tipo de fichaje inválido (dos entradas/salidas seguidas)
- `401`: No autenticado
- `422`: Validación fallida

---

#### GET `/fichajes/me`
Obtiene el historial de fichajes del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
- `page` (int, default=1): Número de página
- `page_size` (int, default=20, max=100): Elementos por página
- `fecha_desde` (date, optional): Filtro fecha inicio (YYYY-MM-DD)
- `fecha_hasta` (date, optional): Filtro fecha fin (YYYY-MM-DD)
- `tipo` (string, optional): Filtro por tipo ("entrada" o "salida")

**Response 200:**
```json
{
  "items": [
    {
      "id": 123,
      "user_id": 1,
      "tipo": "salida",
      "timestamp": "2025-10-16T18:00:00",
      "created_at": "2025-10-16T18:00:00",
      "updated_at": "2025-10-16T18:00:00"
    },
    {
      "id": 122,
      "user_id": 1,
      "tipo": "entrada",
      "timestamp": "2025-10-16T09:00:00",
      "created_at": "2025-10-16T09:00:00",
      "updated_at": "2025-10-16T09:00:00"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "pages": 8
}
```

---

#### GET `/fichajes/`
Obtiene todos los fichajes (solo RRHH).

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Query Params:**
- `page` (int, default=1)
- `page_size` (int, default=20, max=100)
- `user_id` (int, optional): Filtro por usuario
- `fecha_desde` (date, optional)
- `fecha_hasta` (date, optional)
- `tipo` (string, optional)

**Response 200:**
```json
{
  "items": [
    {
      "id": 123,
      "user_id": 1,
      "user": {
        "id": 1,
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "tipo": "entrada",
      "timestamp": "2025-10-16T09:00:00",
      "created_at": "2025-10-16T09:00:00",
      "updated_at": "2025-10-16T09:00:00"
    }
  ],
  "total": 500,
  "page": 1,
  "page_size": 20,
  "pages": 25
}
```

**Errores:**
- `403`: No tiene permisos (no es RRHH)

---

#### GET `/fichajes/{id}`
Obtiene el detalle de un fichaje específico.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 123,
  "user_id": 1,
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "tipo": "entrada",
  "timestamp": "2025-10-16T09:00:00",
  "created_at": "2025-10-16T09:00:00",
  "updated_at": "2025-10-16T09:00:00"
}
```

**Errores:**
- `404`: Fichaje no encontrado
- `403`: No tiene permisos para ver este fichaje

---

#### POST `/fichajes/{id}/solicitar-correccion`
Solicita corrección de un fichaje erróneo.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "nuevo_timestamp": "2025-10-16T09:15:00",
  "motivo": "Olvidé fichar a tiempo, llegué a las 9:15"
}
```

**Validaciones:**
- `nuevo_timestamp`: no puede ser futuro, máximo 30 días atrás
- `motivo`: mínimo 10 caracteres, máximo 500

**Response 201:**
```json
{
  "id": 45,
  "fichaje_id": 123,
  "user_id": 1,
  "timestamp_original": "2025-10-16T10:00:00",
  "timestamp_propuesto": "2025-10-16T09:15:00",
  "motivo": "Olvidé fichar a tiempo, llegué a las 9:15",
  "status": "pending",
  "created_at": "2025-10-16T18:00:00"
}
```

**Errores:**
- `404`: Fichaje no encontrado
- `403`: No puede solicitar corrección de fichajes de otros
- `400`: Fichaje ya tiene solicitud pendiente

---

#### GET `/fichajes/correcciones/me`
Obtiene las solicitudes de corrección del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
- `status` (string, optional): Filtro por estado ("pending", "approved", "rejected")

**Response 200:**
```json
{
  "items": [
    {
      "id": 45,
      "fichaje_id": 123,
      "fichaje": {
        "id": 123,
        "tipo": "entrada",
        "timestamp": "2025-10-16T10:00:00"
      },
      "user_id": 1,
      "timestamp_original": "2025-10-16T10:00:00",
      "timestamp_propuesto": "2025-10-16T09:15:00",
      "motivo": "Olvidé fichar a tiempo",
      "status": "pending",
      "reviewed_by": null,
      "reviewed_at": null,
      "comentarios_revision": null,
      "created_at": "2025-10-16T18:00:00"
    }
  ]
}
```

---

#### GET `/fichajes/correcciones/`
Obtiene todas las solicitudes de corrección (solo RRHH).

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Query Params:**
- `status` (string, optional)
- `user_id` (int, optional)
- `page` (int, default=1)
- `page_size` (int, default=20)

**Response 200:**
```json
{
  "items": [
    {
      "id": 45,
      "fichaje_id": 123,
      "fichaje": {
        "id": 123,
        "tipo": "entrada",
        "timestamp": "2025-10-16T10:00:00"
      },
      "user_id": 1,
      "user": {
        "id": 1,
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "timestamp_original": "2025-10-16T10:00:00",
      "timestamp_propuesto": "2025-10-16T09:15:00",
      "motivo": "Olvidé fichar a tiempo",
      "status": "pending",
      "created_at": "2025-10-16T18:00:00"
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20
}
```

---

#### PATCH `/fichajes/correcciones/{id}/aprobar`
Aprueba una solicitud de corrección (solo RRHH).

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Request:**
```json
{
  "comentarios": "Aprobado, justificación válida"  // Opcional
}
```

**Response 200:**
```json
{
  "id": 45,
  "status": "approved",
  "reviewed_by": 2,
  "reviewed_at": "2025-10-16T19:00:00",
  "comentarios_revision": "Aprobado, justificación válida"
}
```

**Errores:**
- `404`: Solicitud no encontrada
- `403`: No tiene permisos
- `400`: Solicitud ya fue revisada

---

#### PATCH `/fichajes/correcciones/{id}/rechazar`
Rechaza una solicitud de corrección (solo RRHH).

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Request:**
```json
{
  "comentarios": "No se puede modificar fichajes de hace más de 7 días"
}
```

**Validaciones:**
- `comentarios`: requerido al rechazar

**Response 200:**
```json
{
  "id": 45,
  "status": "rejected",
  "reviewed_by": 2,
  "reviewed_at": "2025-10-16T19:00:00",
  "comentarios_revision": "No se puede modificar fichajes de hace más de 7 días"
}
```

---

### 🏖️ Vacaciones y Ausencias (`/vacaciones`)

#### POST `/vacaciones/`
Crea una solicitud de vacaciones o ausencia.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "tipo": "vacation",  // "vacation", "sick_leave", "personal", "other"
  "fecha_inicio": "2025-10-20",
  "fecha_fin": "2025-10-25",
  "motivo": "Vacaciones familiares planificadas"
}
```

**Validaciones:**
- `tipo`: requerido, debe ser uno de los valores válidos
- `fecha_inicio`: requerida, no puede ser pasado
- `fecha_fin`: requerida, debe ser >= fecha_inicio
- `motivo`: mínimo 10 caracteres, máximo 1000
- Días disponibles suficientes (solo para tipo "vacation")

**Response 201:**
```json
{
  "id": 78,
  "user_id": 1,
  "tipo": "vacation",
  "fecha_inicio": "2025-10-20",
  "fecha_fin": "2025-10-25",
  "dias_solicitados": 4,  // Calculado automáticamente (sin fines de semana)
  "motivo": "Vacaciones familiares planificadas",
  "status": "pending",
  "reviewed_by": null,
  "reviewed_at": null,
  "comentarios_revision": null,
  "created_at": "2025-10-16T19:00:00",
  "updated_at": "2025-10-16T19:00:00"
}
```

**Errores:**
- `400`: Validaciones fallidas (fechas, días insuficientes, etc.)
- `422`: Formato de datos inválido

---

#### GET `/vacaciones/me`
Obtiene las solicitudes del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
- `status` (string, optional): Filtro por estado
- `tipo` (string, optional): Filtro por tipo
- `fecha_desde` (date, optional)
- `fecha_hasta` (date, optional)

**Response 200:**
```json
{
  "items": [
    {
      "id": 78,
      "user_id": 1,
      "tipo": "vacation",
      "fecha_inicio": "2025-10-20",
      "fecha_fin": "2025-10-25",
      "dias_solicitados": 4,
      "motivo": "Vacaciones familiares",
      "status": "pending",
      "reviewed_by": null,
      "reviewed_at": null,
      "comentarios_revision": null,
      "created_at": "2025-10-16T19:00:00",
      "updated_at": "2025-10-16T19:00:00"
    }
  ]
}
```

---

#### GET `/vacaciones/`
Obtiene todas las solicitudes (solo RRHH).

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Query Params:**
- `user_id` (int, optional)
- `status` (string, optional)
- `tipo` (string, optional)
- `fecha_desde` (date, optional)
- `fecha_hasta` (date, optional)
- `page` (int, default=1)
- `page_size` (int, default=20)

**Response 200:**
```json
{
  "items": [
    {
      "id": 78,
      "user_id": 1,
      "user": {
        "id": 1,
        "full_name": "John Doe",
        "email": "john@example.com",
        "dias_vacaciones_disponibles": 18.5
      },
      "tipo": "vacation",
      "fecha_inicio": "2025-10-20",
      "fecha_fin": "2025-10-25",
      "dias_solicitados": 4,
      "motivo": "Vacaciones familiares",
      "status": "pending",
      "created_at": "2025-10-16T19:00:00"
    }
  ],
  "total": 25,
  "page": 1,
  "page_size": 20
}
```

---

#### GET `/vacaciones/{id}`
Obtiene el detalle de una solicitud.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 78,
  "user_id": 1,
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "tipo": "vacation",
  "fecha_inicio": "2025-10-20",
  "fecha_fin": "2025-10-25",
  "dias_solicitados": 4,
  "motivo": "Vacaciones familiares",
  "status": "pending",
  "reviewed_by": null,
  "reviewed_at": null,
  "comentarios_revision": null,
  "created_at": "2025-10-16T19:00:00"
}
```

**Errores:**
- `404`: Solicitud no encontrada
- `403`: No tiene permisos para ver esta solicitud

---

#### PATCH `/vacaciones/{id}/aprobar`
Aprueba una solicitud (solo RRHH).

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Request:**
```json
{
  "comentarios": "Aprobado, disfruta tus vacaciones"  // Opcional
}
```

**Response 200:**
```json
{
  "id": 78,
  "status": "approved",
  "reviewed_by": 2,
  "reviewed_at": "2025-10-16T20:00:00",
  "comentarios_revision": "Aprobado, disfruta tus vacaciones"
}
```

**Efectos secundarios:**
- Descuenta días del balance del usuario (si tipo = "vacation")

**Errores:**
- `404`: Solicitud no encontrada
- `403`: No tiene permisos
- `400`: Solicitud ya fue revisada o no está pendiente

---

#### PATCH `/vacaciones/{id}/rechazar`
Rechaza una solicitud (solo RRHH).

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Request:**
```json
{
  "comentarios": "No disponible en esas fechas, muchas ausencias en el equipo"
}
```

**Validaciones:**
- `comentarios`: requerido al rechazar, mínimo 10 caracteres

**Response 200:**
```json
{
  "id": 78,
  "status": "rejected",
  "reviewed_by": 2,
  "reviewed_at": "2025-10-16T20:00:00",
  "comentarios_revision": "No disponible en esas fechas"
}
```

---

#### DELETE `/vacaciones/{id}`
Cancela una solicitud pendiente (solo el propio usuario).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 204:**
No content

**Errores:**
- `404`: Solicitud no encontrada
- `403`: No puede cancelar solicitudes de otros
- `400`: Solo se pueden cancelar solicitudes pendientes

---

### 👥 Usuarios (`/users`) - Solo RRHH

Todos los endpoints de este módulo requieren rol `hr`.

#### GET `/users/`
Lista todos los usuarios.

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Query Params:**
- `search` (string, optional): Búsqueda por nombre, email o username
- `role` (string, optional): Filtro por rol ("employee", "hr")
- `is_active` (bool, optional): Filtro por estado
- `page` (int, default=1)
- `page_size` (int, default=20)

**Response 200:**
```json
{
  "items": [
    {
      "id": 1,
      "username": "john.doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "employee",
      "is_active": true,
      "dias_vacaciones_anuales": 23,
      "dias_vacaciones_disponibles": 18.5,
      "created_at": "2025-01-15T10:00:00",
      "updated_at": "2025-10-16T12:00:00"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

---

#### POST `/users/`
Crea un nuevo usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Request:**
```json
{
  "username": "jane.smith",
  "email": "jane@example.com",
  "full_name": "Jane Smith",
  "password": "SecurePass123",
  "role": "employee",
  "dias_vacaciones_anuales": 23
}
```

**Validaciones:**
- `username`: requerido, mínimo 3 caracteres, único
- `email`: requerido, formato válido, único
- `full_name`: requerido, mínimo 3 caracteres
- `password`: mínimo 8 caracteres
- `role`: "employee" o "hr"
- `dias_vacaciones_anuales`: número positivo, máximo 60

**Response 201:**
```json
{
  "id": 51,
  "username": "jane.smith",
  "email": "jane@example.com",
  "full_name": "Jane Smith",
  "role": "employee",
  "is_active": true,
  "dias_vacaciones_anuales": 23,
  "dias_vacaciones_disponibles": 23.0,
  "created_at": "2025-10-16T20:30:00",
  "updated_at": "2025-10-16T20:30:00"
}
```

**Errores:**
- `400`: Username o email ya existe
- `422`: Validación fallida

---

#### GET `/users/{id}`
Obtiene el detalle de un usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Response 200:**
```json
{
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "employee",
  "is_active": true,
  "dias_vacaciones_anuales": 23,
  "dias_vacaciones_disponibles": 18.5,
  "created_at": "2025-01-15T10:00:00",
  "updated_at": "2025-10-16T12:00:00"
}
```

---

#### PATCH `/users/{id}`
Actualiza un usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Request (campos opcionales):**
```json
{
  "email": "newemail@example.com",
  "full_name": "John A. Doe",
  "role": "hr",
  "is_active": true,
  "dias_vacaciones_anuales": 25
}
```

**Response 200:**
Usuario actualizado

**Errores:**
- `404`: Usuario no encontrado
- `400`: Email ya existe (si se cambia)

---

#### DELETE `/users/{id}`
Elimina o desactiva un usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Permisos:** Solo rol `hr`

**Response 204:**
No content

**Efectos:**
- Soft delete: marca como inactivo (`is_active = false`)
- Mantiene registros históricos (fichajes, solicitudes)

**Errores:**
- `404`: Usuario no encontrado
- `400`: No se puede eliminar a sí mismo

---

## 📊 Modelos de Datos

### User
```typescript
{
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "employee" | "hr";
  is_active: boolean;
  dias_vacaciones_anuales: number;
  dias_vacaciones_disponibles: number;
  created_at: string; // ISO 8601
  updated_at: string;
}
```

### Fichaje
```typescript
{
  id: number;
  user_id: number;
  user?: User; // Incluido en algunas respuestas
  tipo: "entrada" | "salida";
  timestamp: string; // ISO 8601
  created_at: string;
  updated_at: string;
}
```

### CorreccionFichaje
```typescript
{
  id: number;
  fichaje_id: number;
  fichaje?: Fichaje;
  user_id: number;
  user?: User;
  timestamp_original: string;
  timestamp_propuesto: string;
  motivo: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: number;
  reviewed_by_user?: User;
  reviewed_at?: string;
  comentarios_revision?: string;
  created_at: string;
  updated_at: string;
}
```

### Solicitud (Vacaciones)
```typescript
{
  id: number;
  user_id: number;
  user?: User;
  tipo: "vacation" | "sick_leave" | "personal" | "other";
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string;
  dias_solicitados: number;
  motivo: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by?: number;
  reviewed_by_user?: User;
  reviewed_at?: string;
  comentarios_revision?: string;
  created_at: string;
  updated_at: string;
}
```

### Respuesta Paginada
```typescript
{
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
```

---

## 🚨 Códigos de Error

- **200**: OK - Solicitud exitosa
- **201**: Created - Recurso creado exitosamente
- **204**: No Content - Eliminación exitosa
- **400**: Bad Request - Error de validación o lógica de negocio
- **401**: Unauthorized - No autenticado o token inválido
- **403**: Forbidden - No tiene permisos para esta operación
- **404**: Not Found - Recurso no encontrado
- **422**: Unprocessable Entity - Error de validación de datos
- **500**: Internal Server Error - Error del servidor

### Formato de Errores
```json
{
  "detail": "Descripción del error"
}
```

O para errores de validación:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## 🔒 Roles y Permisos

### Employee (empleado)
- ✅ Registrar fichajes propios
- ✅ Ver fichajes propios
- ✅ Solicitar correcciones propias
- ✅ Ver correcciones propias
- ✅ Solicitar vacaciones
- ✅ Ver solicitudes propias
- ✅ Cancelar solicitudes propias (pendientes)
- ❌ No puede ver/gestionar datos de otros usuarios

### HR (recursos humanos)
- ✅ Todos los permisos de Employee +
- ✅ Ver todos los fichajes
- ✅ Ver todas las correcciones
- ✅ Aprobar/rechazar correcciones
- ✅ Ver todas las solicitudes de vacaciones
- ✅ Aprobar/rechazar solicitudes
- ✅ Gestionar usuarios (CRUD completo)

---

## 📝 Notas de Implementación

### Paginación
- Por defecto: 20 elementos por página
- Máximo: 100 elementos por página
- Incluye metadata de paginación en respuesta

### Fechas y Horas
- Formato ISO 8601: `2025-10-16T19:00:00`
- Timezone UTC por defecto
- Fechas: `YYYY-MM-DD`

### Validaciones Comunes
- Strings: se validan longitudes mínimas/máximas
- Emails: formato RFC 5322
- Fechas: no se permiten fechas en el pasado (excepto fichajes históricos)
- Unicidad: username y email deben ser únicos

### Cálculo de Días
- Se excluyen fines de semana automáticamente
- Días festivos no se contemplan (futura mejora)

---

**Versión**: 1.0  
**Fecha**: Octubre 16, 2025  
**Proyecto**: StopCardio HR Management System
