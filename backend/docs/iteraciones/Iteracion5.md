# Iteración 5: Módulo de Fichajes (Entradas/Salidas)

## 📋 Resumen

Implementar el módulo completo de gestión de fichajes siguiendo Clean Architecture, con registro de entradas/salidas, validaciones de negocio, corrección de fichajes con aprobación de RRHH, y consultas con filtros avanzados.

**Fecha inicio**: 15 de octubre de 2025  
**Estado**: ✅ COMPLETADA  
**Prioridad**: ALTA

> ℹ️ **Documentación completa en**: `docs/Iteracion5-COMPLETADA.md`

---

## 🎯 Objetivos

### Objetivo Principal
Desarrollar un sistema robusto de control de asistencia que permita:
- Registro de entradas (check-in) y salidas (check-out)
- Validaciones automáticas de fichajes
- Corrección de fichajes con flujo de aprobación
- Consultas filtradas por empleado, fecha y estado
- Cálculo de horas trabajadas

### Objetivos Secundarios
- Mantener arquitectura limpia y coherente con módulo de usuarios
- Implementar validaciones de negocio complejas
- Garantizar integridad de datos de fichajes
- Facilitar auditoría y reportes futuros

---

## 🏗️ Arquitectura

### Estructura de Capas

```
┌─────────────────────────────────────────────────────┐
│                   API Layer                          │
│         ┌────────────────────────┐                  │
│         │ fichajes.py (Router)   │                  │
│         └──────────┬─────────────┘                  │
└────────────────────┼────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────┐
│            Dependencies Layer                        │
│         ┌──────────┴───────────┐                    │
│         │  auth.py             │                    │
│         │  - CurrentUser       │                    │
│         │  - CurrentHR         │                    │
│         └──────────┬───────────┘                    │
└────────────────────┼────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────┐
│              Business Logic Layer                    │
│         ┌──────────┴───────────┐                    │
│         │ fichaje_service.py   │                    │
│         │ - Validaciones       │                    │
│         │ - Cálculo de horas   │                    │
│         │ - Lógica aprobación  │                    │
│         └──────────┬───────────┘                    │
└────────────────────┼────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────┐
│              Data Access Layer                       │
│         ┌──────────┴───────────┐                    │
│         │ fichaje_repository   │                    │
│         │ - CRUD operations    │                    │
│         │ - Queries complejas  │                    │
│         └──────────┬───────────┘                    │
└────────────────────┼────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────┐
│               Database Layer                         │
│         ┌──────────┴───────────┐                    │
│         │  fichaje.py (Model)  │                    │
│         │  - Tabla fichajes    │                    │
│         │  - FichajeStatus     │                    │
│         └──────────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Componentes a Implementar

### 1. Modelo de Datos (`app/models/fichaje.py`)

#### FichajeStatus Enum
```python
class FichajeStatus(str, Enum):
    """Estados posibles de un fichaje."""
    VALID = "valid"              # Fichaje válido
    PENDING_CORRECTION = "pending_correction"  # Corrección pendiente
    CORRECTED = "corrected"      # Corregido y aprobado
    REJECTED = "rejected"        # Corrección rechazada
```

#### Modelo Fichaje
```python
class Fichaje(BaseModel, table=True):
    """Modelo de fichaje (entrada/salida)."""
    __tablename__ = "fichaje"
    
    # Relaciones
    user_id: int = Field(foreign_key="user.id", index=True)
    user: Optional["User"] = Relationship(back_populates="fichajes")
    
    # Datos del fichaje
    check_in: datetime = Field(index=True)
    check_out: Optional[datetime] = Field(default=None, index=True)
    
    # Metadatos
    status: FichajeStatus = Field(default=FichajeStatus.VALID)
    notes: Optional[str] = Field(default=None)
    
    # Corrección
    correction_reason: Optional[str] = Field(default=None)
    correction_requested_at: Optional[datetime] = Field(default=None)
    
    # Aprobación
    approved_by: Optional[int] = Field(default=None, foreign_key="user.id")
    approved_at: Optional[datetime] = Field(default=None)
    approval_notes: Optional[str] = Field(default=None)
    
    # Propiedades calculadas
    @property
    def hours_worked(self) -> Optional[float]:
        """Calcula horas trabajadas."""
        if not self.check_out:
            return None
        delta = self.check_out - self.check_in
        return round(delta.total_seconds() / 3600, 2)
    
    @property
    def is_complete(self) -> bool:
        """Verifica si el fichaje está completo."""
        return self.check_out is not None
    
    @property
    def is_pending_approval(self) -> bool:
        """Verifica si está pendiente de aprobación."""
        return self.status == FichajeStatus.PENDING_CORRECTION
```

**Características:**
- ✅ Relación con User (foreign key)
- ✅ Timestamps de entrada y salida
- ✅ Estado del fichaje (enum)
- ✅ Sistema de correcciones con razón
- ✅ Sistema de aprobación por HR
- ✅ Cálculo automático de horas trabajadas
- ✅ Índices en user_id, check_in, check_out

---

### 2. Schemas Pydantic (`app/schemas/fichaje.py`)

#### Schemas de Entrada (Request)

```python
class FichajeCheckIn(BaseModel):
    """Request para registrar entrada."""
    notes: Optional[str] = Field(default=None, max_length=500)

class FichajeCheckOut(BaseModel):
    """Request para registrar salida."""
    notes: Optional[str] = Field(default=None, max_length=500)

class FichajeCorrection(BaseModel):
    """Request para solicitar corrección."""
    check_in: datetime
    check_out: Optional[datetime] = None
    correction_reason: str = Field(min_length=10, max_length=1000)

class FichajeApproval(BaseModel):
    """Request para aprobar/rechazar corrección."""
    approved: bool
    approval_notes: Optional[str] = Field(default=None, max_length=500)

class FichajeFilters(BaseModel):
    """Filtros para consulta de fichajes."""
    user_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    status: Optional[FichajeStatus] = None
    incomplete_only: bool = False
```

#### Schemas de Salida (Response)

```python
class FichajeResponse(BaseModel):
    """Respuesta con datos de fichaje."""
    id: int
    user_id: int
    user_email: str
    user_full_name: str
    check_in: datetime
    check_out: Optional[datetime]
    hours_worked: Optional[float]
    status: FichajeStatus
    notes: Optional[str]
    correction_reason: Optional[str]
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    approval_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True) 

class FichajeListResponse(BaseModel):
    """Respuesta paginada de fichajes."""
    fichajes: list[FichajeResponse]
    total: int
    page: int
    page_size: int
    total_hours: float  # Suma de horas del periodo

class FichajeStats(BaseModel):
    """Estadísticas de fichajes."""
    total_fichajes: int
    fichajes_completos: int
    fichajes_incompletos: int
    pending_corrections: int
    total_hours: float
    average_hours_per_day: float
```

**Validaciones:**
- ✅ Razón de corrección mínimo 10 caracteres
- ✅ Notas máximo 500 caracteres
- ✅ Fechas válidas (check_out > check_in)
- ✅ Estados válidos del enum

---

### 3. Repository (`app/repositories/fichaje_repository.py`)

#### Operaciones CRUD

```python
class FichajeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # Crear
    async def create(fichaje: Fichaje) -> Fichaje
    
    # Consultar
    async def get_by_id(fichaje_id: int) -> Fichaje | None
    async def get_active_checkin(user_id: int) -> Fichaje | None
    async def get_all(
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[FichajeStatus] = None,
        incomplete_only: bool = False
    ) -> list[Fichaje]
    
    # Contar
    async def count(
        user_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[FichajeStatus] = None,
        incomplete_only: bool = False
    ) -> int
    
    # Actualizar
    async def update(fichaje: Fichaje) -> Fichaje
    
    # Estadísticas
    async def calculate_total_hours(
        user_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> float
    
    # Validaciones
    async def has_active_checkin(user_id: int) -> bool
    async def exists_overlap(
        user_id: int,
        check_in: datetime,
        check_out: Optional[datetime],
        exclude_id: Optional[int] = None
    ) -> bool
```

**Características:**
- ✅ Filtrado avanzado por múltiples criterios
- ✅ Detección de fichajes activos (sin check_out)
- ✅ Validación de solapamientos
- ✅ Cálculo de horas totales
- ✅ Joins optimizados con User

---

### 4. Service (`app/services/fichaje_service.py`)

#### Lógica de Negocio

```python
class FichajeService:
    def __init__(self, fichaje_repo: FichajeRepository, user_repo: UserRepository):
        self.fichaje_repo = fichaje_repo
        self.user_repo = user_repo
    
    # Registrar entrada
    async def check_in(user_id: int, notes: Optional[str]) -> Fichaje
        """
        Registra entrada de usuario.
        Validaciones:
        - No puede tener otro check-in activo
        - Usuario debe existir y estar activo
        """
    
    # Registrar salida
    async def check_out(user_id: int, notes: Optional[str]) -> Fichaje
        """
        Registra salida de usuario.
        Validaciones:
        - Debe tener check-in activo
        - check_out debe ser posterior a check_in
        """
    
    # Solicitar corrección
    async def request_correction(
        fichaje_id: int,
        correction_data: FichajeCorrection,
        user: User
    ) -> Fichaje
        """
        Solicita corrección de fichaje.
        Validaciones:
        - Usuario solo puede corregir sus propios fichajes
        - No puede haber solapamientos con otros fichajes
        - check_out debe ser posterior a check_in
        - Razón mínimo 10 caracteres
        """
    
    # Aprobar/rechazar corrección
    async def approve_correction(
        fichaje_id: int,
        approval: FichajeApproval,
        hr_user: User
    ) -> Fichaje
        """
        Aprueba o rechaza corrección.
        Validaciones:
        - Solo HR puede aprobar
        - Fichaje debe estar en estado PENDING_CORRECTION
        - Si se aprueba, aplicar corrección y cambiar estado
        - Si se rechaza, volver a estado anterior
        """
    
    # Consultas
    async def get_by_id(fichaje_id: int, current_user: User) -> Fichaje
        """
        Obtiene fichaje por ID.
        Autorización:
        - HR puede ver cualquier fichaje
        - Empleados solo sus propios fichajes
        """
    
    async def get_all(
        filters: FichajeFilters,
        skip: int,
        limit: int,
        current_user: User
    ) -> tuple[list[Fichaje], int, float]
        """
        Lista fichajes con filtros.
        Autorización:
        - HR puede ver todos los fichajes
        - Empleados solo sus propios fichajes
        Retorna: (fichajes, total, total_hours)
        """
    
    async def get_my_fichajes(
        user_id: int,
        date_from: Optional[date],
        date_to: Optional[date],
        skip: int,
        limit: int
    ) -> tuple[list[Fichaje], int, float]
        """Obtiene fichajes del usuario actual."""
    
    async def get_stats(
        user_id: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        current_user: User
    ) -> FichajeStats
        """
        Obtiene estadísticas de fichajes.
        Autorización:
        - HR puede ver stats de cualquier usuario
        - Empleados solo sus propias stats
        """
```

#### Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| **RN-F01** | Un usuario solo puede tener un check-in activo (sin check-out) |
| **RN-F02** | check_out debe ser posterior a check_in |
| **RN-F03** | No puede haber solapamiento de fichajes para el mismo usuario |
| **RN-F04** | Solo el propietario puede solicitar corrección de sus fichajes |
| **RN-F05** | Solo HR puede aprobar/rechazar correcciones |
| **RN-F06** | Razón de corrección mínimo 10 caracteres |
| **RN-F07** | Empleados solo pueden ver sus propios fichajes |
| **RN-F08** | HR puede ver y gestionar todos los fichajes |
| **RN-F09** | Fichaje con corrección aprobada cambia a estado CORRECTED |
| **RN-F10** | Fichaje con corrección rechazada cambia a estado REJECTED |

---

### 5. API Endpoints (`app/api/routers/fichajes.py`)

#### Listado de Endpoints

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| POST | `/api/fichajes/check-in` | Registrar entrada | ✅ | - |
| POST | `/api/fichajes/check-out` | Registrar salida | ✅ | - |
| GET | `/api/fichajes/` | Listar fichajes (con filtros) | ✅ | HR o propio |
| GET | `/api/fichajes/me` | Mis fichajes | ✅ | - |
| GET | `/api/fichajes/me/active` | Mi fichaje activo | ✅ | - |
| GET | `/api/fichajes/me/stats` | Mis estadísticas | ✅ | - |
| GET | `/api/fichajes/{id}` | Obtener fichaje por ID | ✅ | HR o propio |
| POST | `/api/fichajes/{id}/correct` | Solicitar corrección | ✅ | Propietario |
| POST | `/api/fichajes/{id}/approve` | Aprobar/rechazar corrección | ✅ | HR |
| GET | `/api/fichajes/stats` | Estadísticas generales | ✅ | HR |

#### Ejemplos de Respuesta

**POST /api/fichajes/check-in**
```json
{
  "id": 1,
  "user_id": 5,
  "user_email": "employee@test.com",
  "user_full_name": "Employee User",
  "check_in": "2025-10-15T08:30:00",
  "check_out": null,
  "hours_worked": null,
  "status": "valid",
  "notes": null,
  "created_at": "2025-10-15T08:30:00",
  "updated_at": "2025-10-15T08:30:00"
}
```

**GET /api/fichajes/me?date_from=2025-10-01&date_to=2025-10-15**
```json
{
  "fichajes": [
    {
      "id": 1,
      "check_in": "2025-10-15T08:30:00",
      "check_out": "2025-10-15T17:45:00",
      "hours_worked": 9.25,
      "status": "valid"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 10,
  "total_hours": 138.75
}
```

**GET /api/fichajes/me/stats?date_from=2025-10-01&date_to=2025-10-15**
```json
{
  "total_fichajes": 15,
  "fichajes_completos": 14,
  "fichajes_incompletos": 1,
  "pending_corrections": 0,
  "total_hours": 138.75,
  "average_hours_per_day": 9.25
}
```

---

## 🗄️ Base de Datos

### Migración Alembic

```bash
# Generar migración
make migration  # alembic revision --autogenerate -m "add_fichaje_table"

# Aplicar migración
make migrate    # alembic upgrade head
```

### Tabla `fichaje`

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | INTEGER | PRIMARY KEY |
| user_id | INTEGER | FOREIGN KEY → user.id, NOT NULL, INDEX |
| check_in | DATETIME | NOT NULL, INDEX |
| check_out | DATETIME | NULL, INDEX |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'valid' |
| notes | VARCHAR(500) | NULL |
| correction_reason | VARCHAR(1000) | NULL |
| correction_requested_at | DATETIME | NULL |
| approved_by | INTEGER | FOREIGN KEY → user.id, NULL |
| approved_at | DATETIME | NULL |
| approval_notes | VARCHAR(500) | NULL |
| created_at | DATETIME | NOT NULL, DEFAULT now() |
| updated_at | DATETIME | NOT NULL, DEFAULT now() |

**Índices:**
- ✅ PRIMARY KEY en `id`
- ✅ INDEX en `user_id` (búsquedas por usuario)
- ✅ INDEX en `check_in` (filtrado por fecha)
- ✅ INDEX en `check_out` (filtrado por fecha)
- ✅ FOREIGN KEY en `user_id`
- ✅ FOREIGN KEY en `approved_by`

**Relaciones:**
- ✅ `user_id` → `user.id` (usuario propietario)
- ✅ `approved_by` → `user.id` (usuario HR que aprobó)

---

## ✅ Tareas de Implementación

### Fase 1: Modelos y Schemas (Estimado: 1-2h)
- [ ] **1.1** Crear enum `FichajeStatus` en `app/models/fichaje.py`
- [ ] **1.2** Crear modelo `Fichaje` con todos los campos
- [ ] **1.3** Agregar relación `fichajes` en modelo `User`
- [ ] **1.4** Crear schemas de request en `app/schemas/fichaje.py`:
  - [ ] `FichajeCheckIn`
  - [ ] `FichajeCheckOut`
  - [ ] `FichajeCorrection`
  - [ ] `FichajeApproval`
  - [ ] `FichajeFilters`
- [ ] **1.5** Crear schemas de response:
  - [ ] `FichajeResponse`
  - [ ] `FichajeListResponse`
  - [ ] `FichajeStats`
- [ ] **1.6** Agregar validaciones Pydantic

### Fase 2: Repository (Estimado: 2-3h)
- [ ] **2.1** Crear `app/repositories/fichaje_repository.py`
- [ ] **2.2** Implementar método `create()`
- [ ] **2.3** Implementar método `get_by_id()`
- [ ] **2.4** Implementar método `get_active_checkin()`
- [ ] **2.5** Implementar método `get_all()` con filtros
- [ ] **2.6** Implementar método `count()` con filtros
- [ ] **2.7** Implementar método `update()`
- [ ] **2.8** Implementar método `calculate_total_hours()`
- [ ] **2.9** Implementar método `has_active_checkin()`
- [ ] **2.10** Implementar método `exists_overlap()`

### Fase 3: Service (Estimado: 3-4h)
- [ ] **3.1** Crear `app/services/fichaje_service.py`
- [ ] **3.2** Implementar `check_in()` con validaciones
- [ ] **3.3** Implementar `check_out()` con validaciones
- [ ] **3.4** Implementar `request_correction()` con validaciones
- [ ] **3.5** Implementar `approve_correction()` con validaciones
- [ ] **3.6** Implementar `get_by_id()` con autorización
- [ ] **3.7** Implementar `get_all()` con filtros y autorización
- [ ] **3.8** Implementar `get_my_fichajes()`
- [ ] **3.9** Implementar `get_stats()` con autorización
- [ ] **3.10** Agregar manejo de excepciones personalizadas

### Fase 4: API Router (Estimado: 2-3h)
- [ ] **4.1** Crear `app/api/routers/fichajes.py`
- [ ] **4.2** Implementar `POST /check-in`
- [ ] **4.3** Implementar `POST /check-out`
- [ ] **4.4** Implementar `GET /` (listar con filtros)
- [ ] **4.5** Implementar `GET /me` (mis fichajes)
- [ ] **4.6** Implementar `GET /me/active` (fichaje activo)
- [ ] **4.7** Implementar `GET /me/stats` (mis estadísticas)
- [ ] **4.8** Implementar `GET /{id}` (obtener por ID)
- [ ] **4.9** Implementar `POST /{id}/correct` (solicitar corrección)
- [ ] **4.10** Implementar `POST /{id}/approve` (aprobar corrección)
- [ ] **4.11** Implementar `GET /stats` (estadísticas generales)
- [ ] **4.12** Registrar router en `app/main.py`

### Fase 5: Base de Datos (Estimado: 0.5h)
- [ ] **5.1** Generar migración de Alembic
- [ ] **5.2** Revisar migración generada
- [ ] **5.3** Aplicar migración
- [ ] **5.4** Verificar tabla creada correctamente

### Fase 6: Testing (Estimado: 4-5h)
- [ ] **6.1** Crear `tests/test_fichajes.py`
- [ ] **6.2** Agregar fixtures de fichajes en `conftest.py`
- [ ] **6.3** Tests de check-in:
  - [ ] Check-in exitoso
  - [ ] Error: check-in con otro activo
  - [ ] Error: sin autenticación
- [ ] **6.4** Tests de check-out:
  - [ ] Check-out exitoso
  - [ ] Error: sin check-in activo
  - [ ] Error: sin autenticación
- [ ] **6.5** Tests de corrección:
  - [ ] Solicitar corrección exitosa
  - [ ] Error: corregir fichaje ajeno
  - [ ] Error: solapamiento
  - [ ] Error: razón muy corta
- [ ] **6.6** Tests de aprobación:
  - [ ] Aprobar corrección como HR
  - [ ] Rechazar corrección como HR
  - [ ] Error: aprobar sin ser HR
  - [ ] Error: aprobar fichaje no pendiente
- [ ] **6.7** Tests de consultas:
  - [ ] Listar mis fichajes
  - [ ] Listar todos (HR)
  - [ ] Filtros por fecha
  - [ ] Filtros por estado
  - [ ] Error: empleado listar todos
- [ ] **6.8** Tests de estadísticas:
  - [ ] Obtener mis stats
  - [ ] Obtener stats de otro (HR)
  - [ ] Error: empleado ver stats ajenas
- [ ] **6.9** Verificar 100% de tests pasando

### Fase 7: Seed Data y Documentación (Estimado: 1-2h)
- [ ] **7.1** Actualizar `scripts/seed_data.py` con fichajes de ejemplo
- [ ] **7.2** Actualizar `test_api.http` con requests de fichajes
- [ ] **7.3** Actualizar `CHEATSHEET.md`
- [ ] **7.4** Crear `docs/Iteracion5-COMPLETADA.md`
- [ ] **7.5** Actualizar `CHANGELOG.md`
- [ ] **7.6** Actualizar `README.md` si es necesario

### Fase 8: Calidad y Refinamiento (Estimado: 1h)
- [ ] **8.1** Ejecutar `make lint` y corregir errores
- [ ] **8.2** Ejecutar `make format`
- [ ] **8.3** Ejecutar `make check` (lint + format + tests)
- [ ] **8.4** Revisar documentación de API en `/docs`
- [ ] **8.5** Verificar mensajes de error claros
- [ ] **8.6** Verificar logging adecuado

---

## 🧪 Casos de Prueba

### Escenarios de Éxito

| ID | Escenario | Resultado Esperado |
|----|-----------|-------------------|
| TC-F01 | Usuario hace check-in sin fichaje activo | 201 Created, fichaje creado |
| TC-F02 | Usuario hace check-out con fichaje activo | 200 OK, fichaje actualizado con horas |
| TC-F03 | Usuario solicita corrección de su fichaje | 200 OK, estado → PENDING_CORRECTION |
| TC-F04 | HR aprueba corrección | 200 OK, estado → CORRECTED, cambios aplicados |
| TC-F05 | HR rechaza corrección | 200 OK, estado → REJECTED |
| TC-F06 | Usuario lista sus fichajes con filtros | 200 OK, lista paginada |
| TC-F07 | HR lista todos los fichajes | 200 OK, lista paginada con todos |
| TC-F08 | Usuario obtiene sus estadísticas | 200 OK, stats calculadas |
| TC-F09 | HR obtiene estadísticas de empleado | 200 OK, stats del empleado |

### Escenarios de Error

| ID | Escenario | Código | Mensaje |
|----|-----------|--------|---------|
| TC-F10 | Check-in con otro activo | 400 | Ya tienes un fichaje activo |
| TC-F11 | Check-out sin fichaje activo | 400 | No tienes fichaje activo |
| TC-F12 | Corregir fichaje ajeno | 403 | No tienes permiso |
| TC-F13 | Aprobar sin ser HR | 403 | Se requiere rol HR |
| TC-F14 | Aprobar fichaje no pendiente | 400 | Fichaje no está pendiente |
| TC-F15 | Corrección con solapamiento | 409 | Solapamiento detectado |
| TC-F16 | check_out anterior a check_in | 400 | Salida debe ser posterior |
| TC-F17 | Razón de corrección muy corta | 422 | Mínimo 10 caracteres |
| TC-F18 | Empleado listar todos | 403 | No tienes permiso |
| TC-F19 | Fichaje inexistente | 404 | Fichaje no encontrado |

---

## 🔐 Seguridad y Autorización

### Matriz de Permisos

| Operación | EMPLOYEE | HR |
|-----------|----------|-----|
| Check-in propio | ✅ | ✅ |
| Check-out propio | ✅ | ✅ |
| Ver propios fichajes | ✅ | ✅ |
| Ver fichajes de otros | ❌ | ✅ |
| Listar todos los fichajes | ❌ | ✅ |
| Solicitar corrección propia | ✅ | ✅ |
| Solicitar corrección ajena | ❌ | ❌ |
| Aprobar/rechazar corrección | ❌ | ✅ |
| Ver propias estadísticas | ✅ | ✅ |
| Ver estadísticas de otros | ❌ | ✅ |

### Validaciones de Seguridad

- ✅ JWT válido en todas las operaciones
- ✅ Usuario activo (`is_active = true`)
- ✅ Validación de propiedad de recursos
- ✅ Validación de rol HR para operaciones administrativas
- ✅ Sanitización de inputs (SQL injection)
- ✅ Límites en paginación (max 100 por página)
- ✅ Rate limiting (futuro)

---

## 📊 Métricas de Éxito

### Cobertura de Tests
- ✅ Mínimo 90% de cobertura en fichaje_service
- ✅ 100% de endpoints con tests
- ✅ Todos los casos de error testeados

### Calidad de Código
- ✅ 0 errores de Ruff/Pylint
- ✅ Type hints en todas las funciones
- ✅ Docstrings en funciones públicas
- ✅ Código pasa `make check`

### Funcionalidad
- ✅ 11 endpoints funcionando
- ✅ Todas las validaciones implementadas
- ✅ Sistema de correcciones completo
- ✅ Cálculo de horas correcto
- ✅ Filtros avanzados funcionando

### Documentación
- ✅ Swagger UI actualizado
- ✅ test_api.http con ejemplos
- ✅ Documentación de iteración completa
- ✅ CHANGELOG actualizado

---

## 🚀 Próximos Pasos (Iteración 6)

Después de completar el módulo de fichajes:

### Módulo de Vacaciones y Ausencias
- [ ] Modelo de Solicitud (vacaciones, permisos, bajas)
- [ ] Estados: pending, approved, rejected
- [ ] Flujo de aprobación por HR
- [ ] Balance de días disponibles
- [ ] Calendario de ausencias
- [ ] Endpoints CRUD completos
- [ ] Tests completos

### Mejoras de Infraestructura
- [ ] Logging estructurado (loguru o structlog)
- [ ] Rate limiting (slowapi)
- [ ] Caching (Redis) para estadísticas
- [ ] WebSockets para notificaciones en tiempo real
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Integración con sistemas externos

---

## 📚 Referencias

### Documentación Técnica
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [SQLModel Relationships](https://sqlmodel.tiangolo.com/tutorial/relationship-attributes/)
- [Alembic Auto Generate](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)
- [Pydantic Validators](https://docs.pydantic.dev/latest/concepts/validators/)

### Estándares
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [ISO 8601 (Dates)](https://en.wikipedia.org/wiki/ISO_8601)

### Código de Referencia
- `app/models/user.py` - Modelo de referencia
- `app/services/user_service.py` - Service de referencia
- `tests/test_users.py` - Tests de referencia

---

## ⚠️ Consideraciones Importantes

### Zona Horaria
- **Decisión**: Almacenar timestamps en UTC
- **Conversión**: Frontend maneja conversión a timezone local
- **Validación**: Python datetime con timezone-aware

### Fichajes Incompletos
- **Política**: Permitir check-in sin check-out
- **Consulta**: Endpoint específico para fichajes activos
- **Alerta**: HR puede ver fichajes sin cerrar

### Solapamiento
- **Validación**: Verificar antes de aprobar correcciones
- **Query**: Búsqueda eficiente de rangos temporales
- **Excepción**: No permitir solapamiento del mismo usuario

### Performance
- **Índices**: En user_id, check_in, check_out
- **Paginación**: Obligatoria en listados
- **Joins**: Optimizar con selectinload de SQLAlchemy
- **Caché**: Considerar para estadísticas (futuro)

### Auditoría
- **Timestamps**: created_at y updated_at en todas las tablas
- **Aprobación**: Registrar quién y cuándo aprobó
- **Cambios**: Log de correcciones aplicadas
- **Integridad**: Foreign keys para relaciones

---

## ✅ Criterios de Aceptación

### Funcionales
- ✅ Usuario puede registrar entrada (check-in)
- ✅ Usuario puede registrar salida (check-out)
- ✅ Usuario puede solicitar corrección de sus fichajes
- ✅ HR puede aprobar/rechazar correcciones
- ✅ Usuario puede ver sus fichajes con filtros
- ✅ HR puede ver todos los fichajes
- ✅ Sistema calcula horas trabajadas correctamente
- ✅ Sistema valida solapamientos
- ✅ Sistema impide múltiples check-ins activos

### Técnicos
- ✅ Código sigue Clean Architecture
- ✅ Todos los tests pasan (100%)
- ✅ Cobertura de tests > 90%
- ✅ Código pasa lint sin errores
- ✅ Type hints completos
- ✅ Migración de BD exitosa
- ✅ Documentación actualizada
- ✅ Endpoints en Swagger UI

### No Funcionales
- ✅ Respuestas < 200ms (95 percentil)
- ✅ Manejo de errores consistente
- ✅ Mensajes de error claros
- ✅ Logging adecuado
- ✅ Código mantenible y legible

---

**Estimación Total**: 14-20 horas de desarrollo  
**Complejidad**: MEDIA-ALTA  
**Dependencias**: Módulo de Usuarios (Iteración 3) ✅  
**Riesgos**: Validaciones de solapamiento, cálculo de horas con timezones

---

**Última actualización**: 15 de octubre de 2025  
**Estado**: 📝 PENDIENTE DE REVISIÓN
