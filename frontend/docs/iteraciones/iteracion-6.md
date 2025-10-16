# Iteración 6 — Solicitud de modificación en fichajes

## 📋 Objetivos

Implementar el sistema completo de gestión de correcciones de fichajes, permitiendo a los empleados solicitar correcciones de fichajes erróneos y al personal de RRHH aprobar o rechazar dichas solicitudes.

## 🎯 Historias de Usuario

### HU-FICHAJE-004: Solicitar Corrección de Fichaje

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

### HU-FICHAJE-005: Ver Solicitudes de Corrección

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

### HU-FICHAJE-006: Aprobar/Rechazar Corrección (RRHH)

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

## 🏗️ Arquitectura Técnica

### ⚠️ Cambios Importantes vs Plan Original

Después de revisar la API (`openapi.json`), descubrimos que:
- **NO existe una entidad separada `FichajeCorreccion`**
- Las correcciones se manejan como **campos adicionales en el modelo `Fichaje`**
- Estados: `valid` | `pending_correction` | `corrected` | `rejected`
- Solo hay **2 endpoints** (no 3 como se planeó inicialmente)

### Modelos Extendidos

```typescript
// core/models/fichaje.model.ts (EXTENDER modelo existente)

// Agregar nuevos estados
export type FichajeStatus = 
  | 'valid' 
  | 'pending_correction' 
  | 'corrected' 
  | 'rejected';

// Extender Fichaje existente con campos de corrección
export interface Fichaje {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  checkIn: Date;
  checkOut: Date | null;
  hoursWorked: number | null;
  
  // Campos de corrección (nuevos)
  status: FichajeStatus;
  correctionReason: string | null;
  correctionRequestedAt: Date | null;
  approvedBy: number | null;
  approvedAt: Date | null;
  approvalNotes: string | null;
  
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Requests para correcciones
export interface FichajeCorreccionRequest {
  checkIn: Date;
  checkOut: Date | null;
  correctionReason: string;  // min 10, max 1000 chars
}

export interface FichajeApprovalRequest {
  approved: boolean;  // true = aprobar, false = rechazar
  approvalNotes?: string;  // max 500 chars
}

// Extender FichajeApi con campos de corrección
export interface FichajeApi {
  // ... campos existentes ...
  status: 'valid' | 'pending_correction' | 'corrected' | 'rejected';
  correction_reason: string | null;
  correction_requested_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  approval_notes: string | null;
}
```

### Componentes

1. **`fichaje-correction-modal.component.ts`** (HU-004)
   - Modal para solicitar corrección
   - Formulario reactivo con validaciones
   - Date + time pickers para check-in y check-out
   - Textarea para motivo (10-1000 chars)
   - Muestra datos del fichaje original

2. **Extender `fichajes.component.ts`** (HU-005)
   - Agregar filtro por estado (dropdown)
   - Badges visuales según estado
   - Botón "Solicitar Corrección" en cada fila (si status = 'valid')
   - Mostrar detalles de corrección en fichajes con estado !== 'valid'

3. **`rrhh-corrections.component.ts`** (HU-006)
   - Vista de RRHH para gestionar solicitudes
   - Lista de fichajes con `status: 'pending_correction'`
   - Comparación lado a lado: original vs solicitado
   - Modal de confirmación para aprobar/rechazar
   - Campo de comentarios (approval_notes)
   - Guard de rol RRHH

### Servicios

```typescript
// features/fichajes/services/fichaje-corrections.service.ts
@Injectable({ providedIn: 'root' })
export class FichajeCorrectionsService {
  // HU-004
  async solicitarCorreccion(data: FichajeCorreccionCreate): Promise<FichajeCorreccion>
  
  // HU-005
  async getMisCorrecciones(estado?: string): Promise<FichajeCorreccion[]>
  
  // HU-006
  async getTodasCorrecciones(estado?: string): Promise<FichajeCorreccion[]>
  async aprobarCorreccion(id: number, comentarios?: string): Promise<void>
  async rechazarCorreccion(id: number, comentarios?: string): Promise<void>
}
```

### Rutas

```typescript
{
  path: 'correcciones',
  component: FichajeCorrectionsListComponent,
  canActivate: [AuthGuard]
},
{
  path: 'rrhh/correcciones',
  component: RrhhCorrectionsComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['hr'] }
}
```

---

## 📝 Plan de Implementación

### Fase 1: Modelos y Servicios
1. Crear modelos de FichajeCorreccion
2. Implementar FichajeCorrectionsService con async/await
3. Mappers API ↔ Domain
4. Tests unitarios del servicio

### Fase 2: HU-004 - Solicitar Corrección
1. Crear modal de solicitud de corrección
2. Formulario reactivo con validaciones
3. Integrar date/time pickers
4. Agregar botón "Solicitar Corrección" en lista de fichajes
5. Tests del componente

### Fase 3: HU-005 - Ver Solicitudes
1. Crear componente de lista de correcciones
2. Implementar filtros por estado
3. Diseñar indicadores visuales
4. Vista detallada de cada solicitud
5. Tests del componente

### Fase 4: HU-006 - Gestión RRHH
1. Crear componente de gestión RRHH
2. Lista de solicitudes pendientes
3. Modal de aprobación/rechazo
4. Integración con servicio
5. Tests del componente

### Fase 5: Integración y Testing
1. Tests end-to-end
2. Validación de flujo completo
3. Ajustes de UI/UX
4. Documentación

---

## ✅ Checklist de Implementación

### Modelos y Servicios
- [ ] Crear `fichaje-correccion.model.ts`
- [ ] Implementar mappers
- [ ] Crear `fichaje-corrections.service.ts`
- [ ] Tests del servicio (mínimo 15 tests)

### HU-004: Solicitar Corrección
- [ ] Componente `fichaje-correction-modal`
- [ ] Formulario reactivo con validaciones
- [ ] Date + time pickers
- [ ] Integrar en lista de fichajes
- [ ] Tests del componente (mínimo 8 tests)

### HU-005: Ver Solicitudes
- [ ] Componente `fichaje-corrections-list`
- [ ] Filtros por estado
- [ ] Indicadores visuales
- [ ] Vista detallada
- [ ] Tests del componente (mínimo 8 tests)

### HU-006: Gestión RRHH
- [ ] Componente `rrhh-corrections`
- [ ] Lista de solicitudes
- [ ] Modal de aprobación/rechazo
- [ ] Guard de rol
- [ ] Tests del componente (mínimo 8 tests)

### Integración
- [ ] Rutas configuradas
- [ ] Guards implementados
- [ ] Navegación integrada
- [ ] Tests E2E (mínimo 5 tests)

### Documentación
- [ ] Actualizar CHANGELOG
- [ ] Documentar README módulo
- [ ] Actualizar resumen de iteración

---

## 🎨 Diseño UI/UX

### Estados Visuales

**Pendiente**: 🟡 Badge amarillo "Pendiente"  
**Aprobada**: 🟢 Badge verde "Aprobada"  
**Rechazada**: 🔴 Badge rojo "Rechazada"

### Modal de Solicitud
```
┌─────────────────────────────────────┐
│ Solicitar Corrección de Fichaje     │
├─────────────────────────────────────┤
│ Fichaje Original:                   │
│ ├─ Fecha: 16/10/2025                │
│ ├─ Hora: 09:15:30                   │
│ └─ Tipo: Entrada                    │
│                                     │
│ Nuevo Timestamp:                    │
│ ├─ Fecha: [picker]                  │
│ └─ Hora: [picker]                   │
│                                     │
│ Motivo (mín 10 car):                │
│ [textarea]                          │
│                                     │
│ [Cancelar]         [Solicitar]      │
└─────────────────────────────────────┘
```

---

## 📊 Métricas Esperadas

- **Archivos nuevos**: ~10-12
- **Líneas de código**: ~2,500
- **Tests nuevos**: ~40-50
- **Componentes**: 3
- **Servicios**: 1
- **Modelos**: 3-4

---

## 🚀 Entregables

1. **Código**:
   - Modelos de FichajeCorreccion
   - Servicio de correcciones
   - 3 componentes funcionales
   - Rutas y guards configurados

2. **Tests**:
   - Tests unitarios de servicio
   - Tests de componentes
   - Tests E2E del flujo completo
   - Cobertura > 80%

3. **Documentación**:
   - CHANGELOG actualizado
   - README del módulo
   - Resumen técnico de iteración
   - Diagramas de flujo

---

## 📅 Estimación

**Duración estimada**: 2-3 días  
**Complejidad**: Media-Alta

---

## 🔄 Estado

**Estado actual**: 📝 Planificación  
**Inicio**: Pendiente  
**Finalización**: Pendiente
