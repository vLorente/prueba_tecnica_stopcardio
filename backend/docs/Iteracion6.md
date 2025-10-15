# Iteración 6: Módulo de Vacaciones y Ausencias

## 📋 Resumen

Implementar el módulo completo de gestión de vacaciones y ausencias siguiendo Clean Architecture, con solicitudes de permisos, sistema de aprobación por RRHH, gestión de balance de días disponibles, y consultas filtradas por estado y tipo.

**Fecha inicio**: 15 de octubre de 2025  
**Estado**: 📝 EN PLANIFICACIÓN  
**Prioridad**: ALTA

---

## 🎯 Objetivos

### Objetivo Principal
Desarrollar un sistema robusto de gestión de vacaciones que permita:
- Solicitud de vacaciones y ausencias con fechas y motivo
- Sistema de aprobación/rechazo exclusivo de RRHH con comentarios
- Visualización del estado de las solicitudes (pendiente, aprobada, rechazada)
- Gestión de balance de días disponibles por empleado
- Cálculo automático de días solicitados (excluyendo fines de semana)

### Objetivos Secundarios
- Mantener arquitectura limpia y coherente con módulos anteriores
- Implementar validaciones de negocio complejas
- Garantizar integridad de datos de solicitudes
- Prevenir conflictos de fechas (solapamiento de vacaciones)
- Facilitar auditoría y reportes de ausencias

---

## 🏗️ Arquitectura

### Estructura de Capas

```
┌─────────────────────────────────────────────────────┐
│                   API Layer                          │
│         ┌────────────────────────┐                  │
│         │ vacaciones.py (Router) │                  │
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
│         │ solicitud_service.py │                    │
│         │ - Validaciones       │                    │
│         │ - Cálculo días       │                    │
│         │ - Gestión balance    │                    │
│         │ - Lógica aprobación  │                    │
│         └──────────┬───────────┘                    │
└────────────────────┼────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────┐
│              Data Access Layer                       │
│         ┌──────────┴───────────┐                    │
│         │ solicitud_repository │                    │
│         │ - CRUD operations    │                    │
│         │ - Queries complejas  │                    │
│         │ - Detección conflictos│                   │
│         └──────────┬───────────┘                    │
└────────────────────┼────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────┐
│               Database Layer                         │
│         ┌──────────┴───────────┐                    │
│         │  solicitud.py (Model)│                    │
│         │  - Tabla solicitudes │                    │
│         │  - SolicitudStatus   │                    │
│         │  - SolicitudTipo     │                    │
│         │  user.py (extended)  │                    │
│         │  - dias_vacaciones   │                    │
│         └──────────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Componentes a Implementar

### 1. Modelo de Datos

#### `app/models/solicitud.py`

##### SolicitudStatus Enum
```python
class SolicitudStatus(str, Enum):
    """Estados posibles de una solicitud."""
    PENDING = "pending"      # Pendiente de revisión
    APPROVED = "approved"    # Aprobada por HR
    REJECTED = "rejected"    # Rechazada por HR
    CANCELLED = "cancelled"  # Cancelada por el empleado
```

##### SolicitudTipo Enum
```python
class SolicitudTipo(str, Enum):
    """Tipos de solicitud."""
    VACATION = "vacation"      # Vacaciones
    SICK_LEAVE = "sick_leave"  # Baja por enfermedad
    PERSONAL = "personal"      # Asunto personal
    OTHER = "other"            # Otro motivo
```

##### Modelo Solicitud
```python
class Solicitud(BaseModel, table=True):
    """Modelo de solicitud de vacaciones/ausencias."""
    __tablename__ = "solicitud"
    
    # Relación con usuario (solicitante)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    user: "User" = Relationship(
        back_populates="solicitudes",
        sa_relationship_kwargs={"foreign_keys": "Solicitud.user_id"}
    )
    
    # Datos de la solicitud
    tipo: SolicitudTipo = Field(nullable=False)
    fecha_inicio: date = Field(index=True, nullable=False)
    fecha_fin: date = Field(index=True, nullable=False)
    dias_solicitados: int = Field(nullable=False)  # Calculado automáticamente
    motivo: str = Field(max_length=1000, nullable=False)
    
    # Estado
    status: SolicitudStatus = Field(default=SolicitudStatus.PENDING, nullable=False)
    
    # Información de revisión (HR)
    reviewed_by: int | None = Field(default=None, foreign_key="user.id")
    reviewed_by_user: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Solicitud.reviewed_by"}
    )
    reviewed_at: datetime | None = Field(default=None)
    comentarios_revision: str | None = Field(default=None, max_length=500)
    
    # Propiedades calculadas
    @property
    def is_pending(self) -> bool:
        """Verifica si está pendiente de revisión."""
        return self.status == SolicitudStatus.PENDING
    
    @property
    def is_approved(self) -> bool:
        """Verifica si fue aprobada."""
        return self.status == SolicitudStatus.APPROVED
    
    @property
    def is_active(self) -> bool:
        """Verifica si la solicitud está en periodo activo."""
        today = date.today()
        return (
            self.status == SolicitudStatus.APPROVED
            and self.fecha_inicio <= today <= self.fecha_fin
        )
```

**Características:**
- ✅ Relaciones con User (solicitante y revisor)
- ✅ Enum para estados y tipos de solicitud
- ✅ Fechas de inicio y fin
- ✅ Cálculo automático de días solicitados
- ✅ Sistema de revisión por HR con comentarios
- ✅ Timestamps de auditoría
- ✅ Índices en user_id y fechas
- ✅ Propiedades calculadas para estados

#### Actualización de `app/models/user.py`
```python
# Agregar a User model:

# Balance de vacaciones
dias_vacaciones_anuales: int = Field(default=23, nullable=False)  # Días por año
dias_vacaciones_disponibles: float = Field(default=23.0, nullable=False)  # Balance actual

# Relationship con solicitudes
solicitudes: list["Solicitud"] = Relationship(
    back_populates="user",
    sa_relationship_kwargs={"foreign_keys": "Solicitud.user_id"}
)
```

---

### 2. Schemas Pydantic

#### `app/schemas/solicitud.py`

##### Schemas de Request

```python
class SolicitudCreate(BaseModel):
    """Request para crear solicitud de vacaciones/ausencia."""
    tipo: SolicitudTipo
    fecha_inicio: date
    fecha_fin: date
    motivo: str = Field(min_length=10, max_length=1000)
    
    @model_validator(mode='after')
    def validate_dates(self) -> 'SolicitudCreate':
        """Valida que fecha_fin >= fecha_inicio."""
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha de fin debe ser posterior a la fecha de inicio")
        return self

class SolicitudUpdate(BaseModel):
    """Request para actualizar solicitud (solo si está pendiente)."""
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    motivo: str | None = Field(default=None, min_length=10, max_length=1000)
    
    @model_validator(mode='after')
    def validate_dates(self) -> 'SolicitudUpdate':
        """Valida fechas si ambas están presentes."""
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin < self.fecha_inicio:
                raise ValueError("La fecha de fin debe ser posterior a la fecha de inicio")
        return self

class SolicitudReview(BaseModel):
    """Request para aprobar/rechazar solicitud (solo HR)."""
    approved: bool
    comentarios_revision: str | None = Field(default=None, max_length=500)

class SolicitudFilters(BaseModel):
    """Filtros para consulta de solicitudes."""
    user_id: int | None = None
    tipo: SolicitudTipo | None = None
    status: SolicitudStatus | None = None
    fecha_desde: date | None = None
    fecha_hasta: date | None = None
    activas_only: bool = False  # Solo solicitudes en periodo activo
```

##### Schemas de Response

```python
class SolicitudResponse(BaseModel):
    """Respuesta con datos de solicitud."""
    id: int
    user_id: int
    user_email: str
    user_full_name: str
    tipo: SolicitudTipo
    fecha_inicio: date
    fecha_fin: date
    dias_solicitados: int
    motivo: str
    status: SolicitudStatus
    reviewed_by: int | None
    reviewed_by_name: str | None
    reviewed_at: datetime | None
    comentarios_revision: str | None
    is_pending: bool
    is_approved: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SolicitudListResponse(BaseModel):
    """Respuesta con lista paginada de solicitudes."""
    solicitudes: list[SolicitudResponse]
    total: int
    skip: int
    limit: int

class VacationBalance(BaseModel):
    """Balance de vacaciones de un empleado."""
    user_id: int
    user_email: str
    user_full_name: str
    dias_anuales: int
    dias_disponibles: float
    dias_tomados: int
    dias_pendientes: int  # Días en solicitudes pendientes
    solicitudes_pendientes: int
    solicitudes_aprobadas: int
    proximo_periodo: date | None  # Próxima solicitud aprobada
```

---

### 3. Repositorio (Data Access)

#### `app/repositories/solicitud_repository.py`

##### Métodos CRUD Básicos
```python
async def create(session: AsyncSession, solicitud: Solicitud) -> Solicitud
async def get_by_id(session: AsyncSession, solicitud_id: int) -> Solicitud | None
async def update(session: AsyncSession, solicitud_id: int, data: dict) -> Solicitud | None
async def delete(session: AsyncSession, solicitud_id: int) -> bool
```

##### Queries Especializadas
```python
async def get_by_user(
    session: AsyncSession,
    user_id: int,
    filters: SolicitudFilters,
    skip: int = 0,
    limit: int = 100
) -> tuple[list[Solicitud], int]
"""Obtiene solicitudes de un usuario con filtros."""

async def get_all(
    session: AsyncSession,
    filters: SolicitudFilters,
    skip: int = 0,
    limit: int = 100
) -> tuple[list[Solicitud], int]
"""Obtiene todas las solicitudes (HR) con filtros."""

async def get_pending(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> tuple[list[Solicitud], int]
"""Obtiene solicitudes pendientes de revisión."""

async def check_date_conflict(
    session: AsyncSession,
    user_id: int,
    fecha_inicio: date,
    fecha_fin: date,
    exclude_id: int | None = None
) -> bool:
"""Verifica si hay conflicto de fechas con solicitudes aprobadas."""

async def get_approved_days_in_year(
    session: AsyncSession,
    user_id: int,
    year: int
) -> int:
"""Calcula días de vacaciones aprobados en un año."""

async def get_pending_days(
    session: AsyncSession,
    user_id: int
) -> int:
"""Calcula días en solicitudes pendientes."""

async def get_active_requests(
    session: AsyncSession,
    user_id: int | None = None
) -> list[Solicitud]:
"""Obtiene solicitudes activas (en curso)."""

async def get_vacation_balance(
    session: AsyncSession,
    user_id: int
) -> dict:
"""Obtiene balance completo de vacaciones de un usuario."""
```

**Características:**
- ✅ CRUD completo asíncrono
- ✅ Queries con filtros múltiples
- ✅ Detección de conflictos de fechas
- ✅ Cálculos de días (aprobados, pendientes, disponibles)
- ✅ Paginación consistente
- ✅ Joins optimizados con selectinload

---

### 4. Servicio (Business Logic)

#### `app/services/solicitud_service.py`

##### Reglas de Negocio

- **RN-V01**: Usuario debe estar activo para solicitar vacaciones
- **RN-V02**: Fecha de inicio debe ser futura o actual
- **RN-V03**: Fecha de fin debe ser >= fecha de inicio
- **RN-V04**: Motivo debe tener al menos 10 caracteres
- **RN-V05**: No puede haber solapamiento con solicitudes aprobadas
- **RN-V06**: Días solicitados calculados excluyendo fines de semana
- **RN-V07**: Días solicitados no pueden exceder balance disponible (para tipo VACATION)
- **RN-V08**: Solo el empleado puede crear/actualizar/cancelar sus solicitudes
- **RN-V09**: Solo solicitudes PENDING pueden ser actualizadas/canceladas
- **RN-V10**: Solo HR puede aprobar/rechazar solicitudes
- **RN-V11**: Al aprobar, descontar días del balance (si es tipo VACATION)
- **RN-V12**: Al rechazar/cancelar, NO descontar días
- **RN-V13**: Solicitudes aprobadas no pueden ser modificadas/canceladas

##### Métodos del Servicio

```python
async def create_solicitud(
    session: AsyncSession,
    user: User,
    data: SolicitudCreate
) -> Solicitud:
"""Crea solicitud validando reglas de negocio."""

async def get_my_solicitudes(
    session: AsyncSession,
    user: User,
    filters: SolicitudFilters,
    skip: int = 0,
    limit: int = 100
) -> tuple[list[Solicitud], int]:
"""Obtiene solicitudes del usuario actual."""

async def get_all_solicitudes(
    session: AsyncSession,
    filters: SolicitudFilters,
    skip: int = 0,
    limit: int = 100
) -> tuple[list[Solicitud], int]:
"""Obtiene todas las solicitudes (solo HR)."""

async def get_solicitud_by_id(
    session: AsyncSession,
    solicitud_id: int,
    user: User
) -> Solicitud:
"""Obtiene una solicitud validando permisos."""

async def update_solicitud(
    session: AsyncSession,
    solicitud_id: int,
    user: User,
    data: SolicitudUpdate
) -> Solicitud:
"""Actualiza solicitud (solo si es PENDING y es del usuario)."""

async def cancel_solicitud(
    session: AsyncSession,
    solicitud_id: int,
    user: User
) -> Solicitud:
"""Cancela solicitud (solo si es PENDING y es del usuario)."""

async def review_solicitud(
    session: AsyncSession,
    solicitud_id: int,
    reviewer: User,
    data: SolicitudReview
) -> Solicitud:
"""Aprueba/rechaza solicitud (solo HR)."""

async def get_my_balance(
    session: AsyncSession,
    user: User
) -> VacationBalance:
"""Obtiene balance de vacaciones del usuario."""

async def get_user_balance(
    session: AsyncSession,
    user_id: int
) -> VacationBalance:
"""Obtiene balance de vacaciones de un usuario (solo HR)."""

def calculate_business_days(
    fecha_inicio: date,
    fecha_fin: date
) -> int:
"""Calcula días hábiles entre dos fechas (excluyendo fines de semana)."""
```

**Características:**
- ✅ Validaciones exhaustivas
- ✅ Cálculo automático de días hábiles
- ✅ Gestión de balance de días
- ✅ Detección de conflictos de fechas
- ✅ Autorización integrada (empleado vs HR)
- ✅ Actualización de balance al aprobar
- ✅ Timezone-aware timestamps

---

### 5. API Router

#### `app/api/routers/vacaciones.py`

##### Endpoints (10 endpoints)

```python
# Gestión de Solicitudes (Empleado)

@router.post("/", response_model=SolicitudResponse, status_code=status.HTTP_201_CREATED)
async def create_solicitud(...)
"""Crear nueva solicitud de vacaciones/ausencia."""

@router.get("/me", response_model=SolicitudListResponse)
async def get_my_solicitudes(...)
"""Obtener mis solicitudes con filtros."""

@router.get("/me/balance", response_model=VacationBalance)
async def get_my_balance(...)
"""Obtener mi balance de vacaciones."""

@router.get("/{solicitud_id}", response_model=SolicitudResponse)
async def get_solicitud(...)
"""Obtener una solicitud por ID."""

@router.put("/{solicitud_id}", response_model=SolicitudResponse)
async def update_solicitud(...)
"""Actualizar solicitud (solo si está pendiente)."""

@router.post("/{solicitud_id}/cancel", response_model=SolicitudResponse)
async def cancel_solicitud(...)
"""Cancelar solicitud (solo si está pendiente)."""

# Gestión RRHH

@router.get("/", response_model=SolicitudListResponse)
async def list_all_solicitudes(...)
"""Listar todas las solicitudes (solo HR)."""

@router.get("/pending", response_model=SolicitudListResponse)
async def get_pending_solicitudes(...)
"""Obtener solicitudes pendientes de revisión (solo HR)."""

@router.post("/{solicitud_id}/review", response_model=SolicitudResponse)
async def review_solicitud(...)
"""Aprobar/rechazar solicitud (solo HR)."""

@router.get("/balance/{user_id}", response_model=VacationBalance)
async def get_user_balance(...)
"""Obtener balance de vacaciones de un usuario (solo HR)."""
```

**Características:**
- ✅ 10 endpoints RESTful
- ✅ Dependencies inyectadas (`CurrentUser`, `CurrentHR`)
- ✅ Validación automática con Pydantic
- ✅ Status codes apropiados
- ✅ Documentación OpenAPI completa

---

### 6. Migración de Base de Datos

#### Nueva tabla `solicitud`
```sql
CREATE TABLE solicitud (
    id INTEGER PRIMARY KEY,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    user_id INTEGER NOT NULL REFERENCES user(id),
    tipo VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_solicitados INTEGER NOT NULL,
    motivo VARCHAR(1000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER NULL REFERENCES user(id),
    reviewed_at DATETIME NULL,
    comentarios_revision VARCHAR(500) NULL
);

CREATE INDEX ix_solicitud_user_id ON solicitud(user_id);
CREATE INDEX ix_solicitud_fecha_inicio ON solicitud(fecha_inicio);
CREATE INDEX ix_solicitud_fecha_fin ON solicitud(fecha_fin);
CREATE INDEX ix_solicitud_status ON solicitud(status);
```

#### Actualización de tabla `user`
```sql
ALTER TABLE user ADD COLUMN dias_vacaciones_anuales INTEGER NOT NULL DEFAULT 23;
ALTER TABLE user ADD COLUMN dias_vacaciones_disponibles REAL NOT NULL DEFAULT 23.0;
```

---

## 🧪 Testing

### Suite de Tests (`tests/test_solicitudes.py`)

#### Organización por Clases (24 tests mínimo)

```python
class TestCreateSolicitud:
    """Tests de creación de solicitudes."""
    - test_create_solicitud_success
    - test_create_solicitud_short_motivo
    - test_create_solicitud_invalid_dates
    - test_create_solicitud_insufficient_days
    - test_create_solicitud_date_conflict

class TestListSolicitudes:
    """Tests de listado de solicitudes."""
    - test_list_my_solicitudes
    - test_list_my_solicitudes_with_filters
    - test_hr_list_all_solicitudes
    - test_employee_cannot_list_all

class TestGetSolicitud:
    """Tests de consulta de solicitud individual."""
    - test_get_solicitud_by_id
    - test_get_non_existent_solicitud
    - test_employee_cannot_view_other_solicitud
    - test_hr_can_view_any_solicitud

class TestUpdateSolicitud:
    """Tests de actualización de solicitud."""
    - test_update_solicitud_success
    - test_update_solicitud_already_approved
    - test_update_solicitud_other_user
    - test_update_solicitud_invalid_dates

class TestCancelSolicitud:
    """Tests de cancelación de solicitud."""
    - test_cancel_solicitud_success
    - test_cancel_solicitud_already_approved
    - test_cancel_solicitud_other_user

class TestReviewSolicitud:
    """Tests de revisión de solicitud."""
    - test_hr_approve_solicitud
    - test_hr_reject_solicitud
    - test_employee_cannot_review
    - test_review_non_pending_solicitud

class TestVacationBalance:
    """Tests de balance de vacaciones."""
    - test_get_my_balance
    - test_hr_get_user_balance
    - test_balance_after_approval
    - test_balance_after_rejection
```

**Fixtures Necesarias:**
```python
@pytest.fixture
async def employee_solicitud(...)  # Solicitud de empleado
@pytest.fixture
async def pending_solicitud(...)    # Solicitud pendiente
@pytest.fixture
async def approved_solicitud(...)   # Solicitud aprobada
```

---

## 📝 Datos de Prueba

### Actualización de `scripts/seed_data.py`

```python
async def create_solicitudes(session, users: dict[str, User]) -> list[Solicitud]:
    """Crea solicitudes de ejemplo."""
    # 1. Solicitud aprobada tipo VACATION (vacaciones pasadas)
    # 2. Solicitud pendiente tipo VACATION (vacaciones futuras)
    # 3. Solicitud rechazada tipo VACATION
    # 4. Solicitud aprobada tipo SICK_LEAVE (baja médica)
    # 5. Solicitud pendiente tipo PERSONAL (asunto personal)
    # 6. Solicitud cancelada tipo OTHER
```

---

## 📚 Documentación de API

### Actualización de `test_api.http`

```http
################################################################################
# GESTIÓN DE SOLICITUDES DE VACACIONES
################################################################################

### Crear solicitud de vacaciones
POST {{baseUrl}}/api/vacaciones/
Authorization: Bearer {{employeeToken}}
Content-Type: {{contentType}}

{
  "tipo": "vacation",
  "fecha_inicio": "2025-12-01",
  "fecha_fin": "2025-12-05",
  "motivo": "Vacaciones de fin de año con la familia"
}

### Ver mis solicitudes
GET {{baseUrl}}/api/vacaciones/me
Authorization: Bearer {{employeeToken}}

### Ver mi balance de vacaciones
GET {{baseUrl}}/api/vacaciones/me/balance
Authorization: Bearer {{employeeToken}}

### Actualizar solicitud (solo si está pendiente)
PUT {{baseUrl}}/api/vacaciones/{{solicitudId}}
Authorization: Bearer {{employeeToken}}
Content-Type: {{contentType}}

{
  "fecha_inicio": "2025-12-02",
  "motivo": "Cambio de fechas - vacaciones de fin de año"
}

### Cancelar solicitud
POST {{baseUrl}}/api/vacaciones/{{solicitudId}}/cancel
Authorization: Bearer {{employeeToken}}

################################################################################
# GESTIÓN RRHH - VACACIONES
################################################################################

### Ver todas las solicitudes (HR)
GET {{baseUrl}}/api/vacaciones/
Authorization: Bearer {{hrToken}}

### Ver solicitudes pendientes (HR)
GET {{baseUrl}}/api/vacaciones/pending
Authorization: Bearer {{hrToken}}

### Aprobar solicitud (HR)
POST {{baseUrl}}/api/vacaciones/{{solicitudId}}/review
Authorization: Bearer {{hrToken}}
Content-Type: {{contentType}}

{
  "approved": true,
  "comentarios_revision": "Aprobado - buen descanso"
}

### Rechazar solicitud (HR)
POST {{baseUrl}}/api/vacaciones/{{solicitudId}}/review
Authorization: Bearer {{hrToken}}
Content-Type: {{contentType}}

{
  "approved": false,
  "comentarios_revision": "Rechazado - periodo de alta demanda, intenta otras fechas"
}

### Ver balance de empleado (HR)
GET {{baseUrl}}/api/vacaciones/balance/{{userId}}
Authorization: Bearer {{hrToken}}
```

---

## ✅ Checklist de Implementación

### Fase 1: Modelos y Migración
- [ ] Crear enum `SolicitudStatus`
- [ ] Crear enum `SolicitudTipo`
- [ ] Crear modelo `Solicitud`
- [ ] Actualizar modelo `User` con campos de vacaciones
- [ ] Crear migración de Alembic
- [ ] Aplicar migración

### Fase 2: Schemas
- [ ] Crear schemas de request (4)
- [ ] Crear schemas de response (3)
- [ ] Validadores de fechas
- [ ] Configuración de Pydantic

### Fase 3: Repository
- [ ] Métodos CRUD básicos (4)
- [ ] Queries especializadas (8)
- [ ] Detección de conflictos
- [ ] Cálculos de balance

### Fase 4: Service
- [ ] Implementar 13 reglas de negocio
- [ ] 10 métodos de servicio
- [ ] Función calculate_business_days
- [ ] Gestión de balance

### Fase 5: API Router
- [ ] 6 endpoints de empleado
- [ ] 4 endpoints de HR
- [ ] Dependencies de auth
- [ ] Documentación OpenAPI

### Fase 6: Testing
- [ ] 24+ tests organizados en clases
- [ ] Fixtures de solicitudes
- [ ] Tests de validaciones
- [ ] Tests de autorización
- [ ] Tests de balance

### Fase 7: Documentación
- [ ] Actualizar seed_data.py
- [ ] Actualizar test_api.http
- [ ] Crear Iteracion6-COMPLETADA.md
- [ ] Actualizar CHANGELOG.md

---

## 📊 Métricas Esperadas

### Código
- **Archivos nuevos**: 5
- **Archivos modificados**: 5
- **Líneas de código**: ~1800
- **Tests**: 24+
- **Endpoints**: 10
- **Reglas de negocio**: 13
- **Enums**: 2 (SolicitudStatus: 4 valores, SolicitudTipo: 4 valores)

### Cobertura
- **Target**: 100% en módulo de vacaciones
- **Tests pasando**: 94+ (70 actuales + 24 nuevos)

---

## 🎯 Casos de Uso Principales

### Empleado
1. ✅ Solicitar vacaciones con fechas y motivo
2. ✅ Ver mis solicitudes (todas y filtradas)
3. ✅ Ver estado de solicitud individual
4. ✅ Actualizar solicitud pendiente
5. ✅ Cancelar solicitud pendiente
6. ✅ Consultar mi balance de días

### RRHH
1. ✅ Ver todas las solicitudes
2. ✅ Filtrar solicitudes (estado, tipo, usuario, fechas)
3. ✅ Ver solicitudes pendientes de revisión
4. ✅ Aprobar solicitud con comentarios
5. ✅ Rechazar solicitud con comentarios
6. ✅ Consultar balance de cualquier empleado

---

## 🔐 Seguridad y Autorización

### Matriz de Permisos

| Endpoint                       | EMPLOYEE | HR  | Notas                           |
|--------------------------------|----------|-----|---------------------------------|
| POST /                         | ✅       | ✅  | Crear solicitud propia          |
| GET /me                        | ✅       | ✅  | Ver mis solicitudes             |
| GET /me/balance                | ✅       | ✅  | Ver mi balance                  |
| GET /{id}                      | ✅ (own) | ✅  | Ver solicitud                   |
| PUT /{id}                      | ✅ (own) | ❌  | Actualizar (solo pendiente)     |
| POST /{id}/cancel              | ✅ (own) | ❌  | Cancelar (solo pendiente)       |
| GET /                          | ❌       | ✅  | Ver todas las solicitudes       |
| GET /pending                   | ❌       | ✅  | Ver pendientes                  |
| POST /{id}/review              | ❌       | ✅  | Aprobar/rechazar                |
| GET /balance/{user_id}         | ❌       | ✅  | Ver balance de otros            |

---

## 🚀 Próximos Pasos tras Iteración 6

### Iteración 7 (Sugerida): Reportes y Dashboards
- Gráficos de ausencias por mes
- Exportación a PDF/Excel
- Dashboard de RRHH
- Calendario de vacaciones del equipo

### Iteración 8 (Sugerida): Notificaciones
- Email al crear solicitud
- Email al aprobar/rechazar
- Recordatorios de vacaciones próximas
- Alertas de balance bajo

---

## 💡 Notas Técnicas

### Cálculo de Días Hábiles
```python
def calculate_business_days(start: date, end: date) -> int:
    """Calcula días hábiles (Lunes-Viernes)."""
    days = 0
    current = start
    while current <= end:
        if current.weekday() < 5:  # 0=Lun, 4=Vie
            days += 1
        current += timedelta(days=1)
    return days
```

### Detección de Conflictos
- Verificar solapamiento con solicitudes APROBADAS
- Excluir la solicitud actual si es update
- Query SQL optimizada con índices en fechas

### Gestión de Balance
- Balance inicial: 22 días/año (España)
- Descontar solo al APROBAR solicitud tipo VACATION
- Otros tipos (SICK_LEAVE, PERSONAL, OTHER) no descuentan balance de vacaciones
- Permitir balance negativo con warning (casos especiales, a criterio de HR)

---

**Estado**: 📝 Documento de planificación listo para revisión  
**Fecha**: 15 de octubre de 2025  
**Siguiente paso**: Revisión y aprobación para comenzar implementación
