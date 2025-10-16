# Plan de Desarrollo - Frontend StopCardio (MVP)

## 📋 Visión General

Este documento define el plan de desarrollo del **MVP (Producto Mínimo Viable)** del frontend de la aplicación StopCardio HR Management System. El enfoque es crear una aplicación funcional y simple, sin complejidades innecesarias.

## 🎯 Objetivos del MVP

1. **Funcionalidad básica completa**: Cubrir las necesidades esenciales de empleados y RRHH
2. **Simplicidad**: Sin features complejas ni sobre-ingeniería
3. **Testing integrado**: Tests en cada iteración, no al final
4. **Código limpio**: Pero sin optimizaciones prematuras
5. **Responsive básico**: Funcional en desktop (mobile como bonus)

## 🚀 Filosofía del MVP

- ✅ **Funciona > Perfecto**: Mejor algo funcional que algo perfecto incompleto
- ✅ **Simple > Complejo**: UI simple y clara, sin diseños elaborados
- ✅ **Tests esenciales**: Tests en cada iteración, cobertura razonable (no 100%)
- ✅ **Iterativo**: Cada iteración entrega valor y es testeable
- ❌ **No incluir**: Animaciones fancy, gráficos complejos, optimizaciones prematuras

## 📊 Resumen de Iteraciones (MVP)

| Iteración | Duración | Descripción | Testing |
|-----------|----------|-------------|---------|
| 0 | ✅ Completada | Configuración del entorno | N/A |
| 1 | 1 día | Autenticación básica | ✅ Tests incluidos |
| 2 | 1 día | Fichajes (empleado) | ✅ Tests incluidos |
| 3 | 1 día | Vacaciones básico (empleado) | ✅ Tests incluidos |
| 4 | 1 día | Gestión RRHH - Aprobaciones | ✅ Tests incluidos |
| 5 | 1 día | Gestión de usuarios (CRUD básico) | ✅ Tests incluidos |
| 6 | 0.5 día | Pulido final y documentación | ✅ Tests finales |

**Total estimado**: 5.5 días de desarrollo

## ⚠️ Fuera del Alcance del MVP

Las siguientes features NO están en el MVP y podrán agregarse después:

- ❌ Dashboard con gráficos y métricas elaboradas
- ❌ Sistema de notificaciones en tiempo real
- ❌ Exportación de datos (CSV, PDF)
- ❌ Reportes avanzados
- ❌ Búsqueda avanzada con autocomplete
- ❌ Animaciones y transiciones elaboradas
- ❌ Calendario visual de ausencias
- ❌ Perfiles de usuario editables
- ❌ Configuración avanzada del sistema
- ❌ Tests E2E completos (solo críticos si hay tiempo)

---

## Iteración 0: Configuración del Entorno ✅

**Estado**: ✅ COMPLETADA  
**Duración**: -

### Objetivos Cumplidos
- ✅ Configurar DevContainer
- ✅ Instalar dependencias (Node, npm, Chrome)
- ✅ Crear Makefile con comandos útiles
- ✅ Configurar scripts de instalación
- ✅ Documentación completa del proyecto

---

## Iteración 1: Autenticación Básica

**Duración estimada**: 1 día  
**Estado**: 📝 PENDIENTE

### 🎯 Objetivo
Implementar login/logout funcional con protección de rutas. **SIMPLE Y FUNCIONAL**.

### Historias de Usuario (MVP)
- HU-AUTH-001: Login de Usuario (solo básico)
- HU-AUTH-002: Logout de Usuario
- HU-AUTH-003: Ver Perfil (info básica, sin edición)

### Estructura Mínima
```
src/app/
├── core/
│   ├── models/
│   │   └── user.model.ts          # Interface User
│   ├── services/
│   │   ├── auth.service.ts        # Login, logout, getUser
│   │   └── api.service.ts         # HTTP client base
│   ├── guards/
│   │   └── auth.guard.ts          # Proteger rutas
│   └── interceptors/
│       └── auth.interceptor.ts    # Agregar token
├── features/
│   └── auth/
│       ├── login/
│       │   ├── login.component.ts
│       │   ├── login.component.html
│       │   └── login.component.css
│       └── profile/
│           ├── profile.component.ts (básico, solo lectura)
│           └── profile.component.html
└── layouts/
    └── main-layout/
        ├── main-layout.component.ts
        └── main-layout.component.html (header simple + router-outlet)
```

### Componentes a Crear

#### Core (Servicios)
**auth.service.ts**
```typescript
- login(username, password): Observable<{access_token, token_type}>
- logout(): void
- getToken(): string | null
- getCurrentUser(): Observable<User>
- isAuthenticated(): boolean
```

**api.service.ts**
```typescript
- get<T>(url): Observable<T>
- post<T>(url, body): Observable<T>
- patch<T>(url, body): Observable<T>
- delete<T>(url): Observable<T>
```

#### Guards
**auth.guard.ts** - Redirigir a /login si no autenticado

#### Interceptors
**auth.interceptor.ts** - Agregar `Authorization: Bearer token`

#### Componentes
**login.component** - Formulario simple (username, password, botón)
**profile.component** - Mostrar datos del usuario + botón logout
**main-layout.component** - Header con logo + router-outlet

### Routing Básico
```typescript
routes = [
  { path: '', redirectTo: 'fichajes', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: MainLayoutComponent, 
    canActivate: [AuthGuard],
    children: [
      { path: 'fichajes', component: FichajesComponent },
      { path: 'vacaciones', component: VacacionesComponent },
      { path: 'profile', component: ProfileComponent },
      // RRHH routes después
    ]
  }
]
```

### Testing (Incluido en esta iteración)
- ✅ `auth.service.spec.ts` - Tests del servicio de autenticación
- ✅ `auth.guard.spec.ts` - Tests del guard
- ✅ `auth.interceptor.spec.ts` - Tests del interceptor
- ✅ `login.component.spec.ts` - Tests básicos del componente

**Cobertura esperada**: ~60-70% (servicios y guards críticos)

### Criterios de Aceptación
- [ ] Usuario puede hacer login con credenciales válidas
- [ ] Token se guarda en localStorage
- [ ] Token se incluye en peticiones HTTP
- [ ] Guard redirige a /login si no autenticado
- [ ] Botón de logout limpia sesión y redirige
- [ ] Página de perfil muestra datos del usuario
- [ ] Tests pasan sin errores

### UI/UX Básico
- Formulario de login centrado, simple
- Mensajes de error claros (credenciales inválidas)
- Loading state durante login
- Header simple con logo + botón de perfil/logout

---

## Iteración 2: Módulo de Fichajes (Empleado)

**Duración estimada**: 1 día  
**Estado**: 📝 PENDIENTE

### 🎯 Objetivo
Permitir a empleados fichar entrada/salida y ver su historial. **FUNCIONALIDAD BÁSICA**.

### Historias de Usuario (MVP)
- HU-FICHAJE-001: Registrar Fichaje
- HU-FICHAJE-002: Ver Historial Propios (lista simple, paginación básica)

### Componentes a Crear

#### Services
**fichaje.service.ts**
```typescript
- registrarFichaje(tipo: 'entrada' | 'salida'): Observable<Fichaje>
- getMisFichajes(page, pageSize): Observable<PaginatedResponse<Fichaje>>
```

#### Models
**fichaje.model.ts**
```typescript
interface Fichaje {
  id: number;
  tipo: 'entrada' | 'salida';
  timestamp: string;
  created_at: string;
}
```

#### Pages
**fichajes.component** - Página principal con:
- Botón grande de "Fichar Entrada/Salida" (auto-detecta)
- Tabla simple de fichajes propios
- Paginación básica (botones anterior/siguiente)

#### Components
**fichaje-button.component** - Botón de fichaje con estado (entrada/salida)
**fichajes-table.component** - Tabla simple de fichajes

### Features MVP
- ✅ Botón de fichaje que detecta automáticamente tipo
- ✅ Tabla con columnas: Fecha, Hora, Tipo
- ✅ Paginación básica (20 por página)
- ✅ Mensaje de éxito al fichar
- ❌ NO: Filtros complejos, correcciones (fuera del MVP)

### Testing (Incluido)
- ✅ `fichaje.service.spec.ts`
- ✅ `fichaje-button.component.spec.ts`
- ✅ `fichajes.component.spec.ts` (básico)

### Criterios de Aceptación
- [ ] Empleado puede fichar entrada
- [ ] Empleado puede fichar salida
- [ ] Botón muestra estado correcto (entrada/salida)
- [ ] Tabla carga fichajes propios
- [ ] Paginación funciona
- [ ] Mensaje de confirmación al fichar
- [ ] Tests pasan

### UI Simple
- Botón grande y visible para fichar
- Tabla clara con formato de fecha/hora legible
- Paginación con botones simples

---

## Iteración 3: Módulo de Vacaciones (Básico)

**Duración estimada**: 1 día  
**Estado**: 📝 PENDIENTE

### 🎯 Objetivo
Permitir a empleados solicitar vacaciones y ver sus solicitudes. **SOLO LO ESENCIAL**.

### Historias de Usuario (MVP)
- HU-VACACIONES-001: Solicitar Vacaciones (formulario simple)
- HU-VACACIONES-002: Ver Mis Solicitudes (lista simple)
- HU-VACACIONES-007: Ver Balance (widget básico)

### Componentes a Crear

#### Services
**vacaciones.service.ts**
```typescript
- crearSolicitud(datos): Observable<Solicitud>
- getMisSolicitudes(): Observable<Solicitud[]>
- calcularDias(inicio, fin): number  // Excluye fines de semana
```

#### Models
**solicitud.model.ts**
```typescript
interface Solicitud {
  id: number;
  tipo: 'vacation' | 'sick_leave' | 'personal' | 'other';
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo: string;
  status: 'pending' | 'approved' | 'rejected';
  comentarios_revision?: string;
}
```

#### Pages
**vacaciones.component** - Lista de solicitudes
**nueva-solicitud.component** - Formulario de solicitud

#### Components
**solicitud-form.component** - Formulario simple
**solicitudes-list.component** - Lista de solicitudes
**balance-widget.component** - Muestra días disponibles

### Features MVP
- ✅ Formulario con: tipo, fecha inicio, fecha fin, motivo
- ✅ Cálculo automático de días (sin fines de semana)
- ✅ Validación básica: fechas válidas, motivo requerido
- ✅ Lista de solicitudes con estado (pendiente/aprobada/rechazada)
- ✅ Widget de balance de días
- ❌ NO: Cancelar solicitudes, filtros, calendario visual

### Testing (Incluido)
- ✅ `vacaciones.service.spec.ts`
- ✅ `solicitud-form.component.spec.ts`
- ✅ Tests de cálculo de días

### Criterios de Aceptación
- [ ] Formulario valida campos requeridos
- [ ] Cálculo de días excluye sábados y domingos
- [ ] Solicitud se crea correctamente
- [ ] Lista muestra estado con colores/iconos simples
- [ ] Balance de días visible y actualizado
- [ ] Tests pasan

### UI Simple
- Formulario claro con labels
- Date pickers nativos de HTML5
- Lista con cards simples por solicitud
- Estados con colores: verde (aprobada), amarillo (pendiente), rojo (rechazada)

---

## Iteración 4: Gestión RRHH - Aprobaciones

**Duración estimada**: 1 día  
**Estado**: 📝 PENDIENTE

### 🎯 Objetivo
Permitir a RRHH ver y aprobar/rechazar solicitudes de vacaciones. **FUNCIONALIDAD BÁSICA DE RRHH**.

### Historias de Usuario (MVP)
- HU-VACACIONES-004: Ver Todas las Solicitudes (RRHH)
- HU-VACACIONES-005: Aprobar Solicitud (RRHH)
- HU-VACACIONES-006: Rechazar Solicitud (RRHH)

### Componentes a Crear

#### Guards
**role.guard.ts** - Proteger rutas de RRHH (role === 'hr')

#### Services (Extensión)
**vacaciones.service.ts** - Agregar métodos:
```typescript
- getTodasSolicitudes(): Observable<Solicitud[]>
- aprobarSolicitud(id, comentarios?): Observable<Solicitud>
- rechazarSolicitud(id, comentarios): Observable<Solicitud>
```

#### Pages
**rrhh-solicitudes.component** - Lista de todas las solicitudes con acciones

#### Components
**solicitud-review.component** - Card con botones aprobar/rechazar

### Features MVP
- ✅ Tabla simple de todas las solicitudes
- ✅ Filtro básico por estado (pendiente/todas)
- ✅ Botones de aprobar/rechazar
- ✅ Modal simple de confirmación (opcional: campo de comentarios)
- ✅ Actualización de lista tras aprobar/rechazar
- ❌ NO: Filtros avanzados, búsqueda de empleados, exportación

### Routing Actualizado
```typescript
{
  path: 'rrhh',
  canActivate: [AuthGuard, RoleGuard],
  data: { role: 'hr' },
  children: [
    { path: 'solicitudes', component: RrhhSolicitudesComponent },
    { path: 'usuarios', component: UsuariosComponent }
  ]
}
```

### Testing (Incluido)
- ✅ `role.guard.spec.ts`
- ✅ Tests de métodos de aprobación/rechazo
- ✅ `rrhh-solicitudes.component.spec.ts` (básico)

### Criterios de Aceptación
- [ ] Solo usuarios con rol 'hr' acceden
- [ ] Lista muestra todas las solicitudes
- [ ] Filtro por pendientes funciona
- [ ] RRHH puede aprobar solicitud
- [ ] RRHH puede rechazar con comentarios
- [ ] Lista se actualiza tras acción
- [ ] Tests pasan

### UI Simple
- Tabla clara con información del empleado
- Botones de acción visibles (verde/rojo)
- Modal básico para confirmar acción
- Feedback visual de éxito/error

---

## Iteración 5: Gestión de Usuarios (CRUD Básico)

**Duración estimada**: 1 día  
**Estado**: 📝 PENDIENTE

### 🎯 Objetivo
RRHH puede crear, ver, editar y eliminar usuarios. **CRUD SIMPLE Y FUNCIONAL**.

### Historias de Usuario (MVP)
- HU-USUARIOS-001: Ver Lista de Usuarios
- HU-USUARIOS-002: Crear Usuario
- HU-USUARIOS-003: Editar Usuario (básico)
- HU-USUARIOS-004: Eliminar/Desactivar Usuario

### Componentes a Crear

#### Services
**usuarios.service.ts**
```typescript
- getUsuarios(): Observable<User[]>
- createUsuario(data): Observable<User>
- updateUsuario(id, data): Observable<User>
- deleteUsuario(id): Observable<void>
```

#### Pages
**usuarios.component** - Lista de usuarios
**usuario-form.component** - Formulario crear/editar (reusable)

#### Components
**usuarios-table.component** - Tabla simple de usuarios

### Features MVP
- ✅ Tabla con: nombre, email, rol, estado
- ✅ Botón "Crear Usuario"
- ✅ Formulario simple para crear/editar
- ✅ Validación básica de formulario
- ✅ Botón de eliminar con confirmación
- ❌ NO: Búsqueda avanzada, filtros complejos, perfiles elaborados

### Formulario Campos
- Username (requerido, único)
- Email (requerido, único, formato válido)
- Full Name (requerido)
- Password (solo en creación)
- Rol (dropdown: employee/hr)
- Días vacaciones anuales (número, default 23)

### Testing (Incluido)
- ✅ `usuarios.service.spec.ts`
- ✅ `usuario-form.component.spec.ts` (validaciones)
- ✅ Tests de CRUD básico

### Criterios de Aceptación
- [ ] Lista muestra todos los usuarios
- [ ] Formulario crea usuario correctamente
- [ ] Validaciones funcionan
- [ ] Editar usuario actualiza datos
- [ ] Eliminar usuario desactiva (soft delete)
- [ ] Solo RRHH accede a estas funciones
- [ ] Tests pasan

### UI Simple
- Tabla clara y legible
- Formulario con validación visual
- Confirmación antes de eliminar
- Mensajes claros de éxito/error

---

## Iteración 6: Pulido Final y Documentación

**Duración estimada**: 0.5 día  
**Estado**: 📝 PENDIENTE

### 🎯 Objetivo
Dejar la aplicación lista para uso. **ÚLTIMOS AJUSTES**.

### Tareas
- [ ] Revisar y corregir bugs evidentes
- [ ] Verificar responsive básico (que funcione en desktop)
- [ ] Agregar loading spinners básicos
- [ ] Mensajes de error claros en toda la app
- [ ] Verificar navegación fluida
- [ ] README actualizado con instrucciones
- [ ] Credenciales de prueba documentadas
- [ ] Tests finales de integración (si hay tiempo)

### Testing Final
- ✅ Ejecutar todos los tests: `make test-once`
- ✅ Verificar cobertura general (~60-70% aceptable para MVP)
- ✅ Tests manuales de flujos críticos:
  - Login → Fichar → Logout
  - Login → Solicitar vacaciones → Ver solicitudes
  - Login RRHH → Aprobar solicitud → Logout

### Documentación
- [ ] README.md completo
- [ ] Instrucciones de instalación
- [ ] Comandos disponibles
- [ ] Credenciales de prueba
- [ ] Notas sobre el MVP (qué incluye y qué no)

### Criterios de Aceptación MVP
- [ ] Todas las iteraciones 1-5 completadas
- [ ] Tests pasan sin errores críticos
- [ ] Aplicación funciona en desktop
- [ ] README completo y claro
- [ ] Backend conectado y funcionando
- [ ] Sin errores en consola

---

## 🛠️ Stack Tecnológico (MVP)

### Core
- **Angular 20**: Framework principal
- **TypeScript 5.9**: Lenguaje
- **RxJS 7.8**: Programación reactiva

### UI/Styling
- **CSS puro**: Sin frameworks, estilos simples y funcionales
- **HTML5**: Formularios nativos, date pickers nativos

### Testing
- **Jasmine**: Framework de tests
- **Karma**: Test runner  
- **Chrome Headless**: Browser para tests

### DevTools
- **Prettier**: Formateo de código
- **Angular CLI**: Generación de código

---

## 📝 Convenciones de Código (Simplificadas)

### Nomenclatura
- **Componentes**: PascalCase (`LoginComponent`)
- **Servicios**: PascalCase (`AuthService`)
- **Variables**: camelCase (`currentUser`)
- **Archivos**: kebab-case (`auth.service.ts`)

### Estructura de Componentes Básica
```typescript
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';
  
  constructor(private authService: AuthService, private router: Router) {}
  
  onSubmit(): void {
    this.loading = true;
    this.authService.login(this.username, this.password)
      .subscribe({
        next: () => this.router.navigate(['/fichajes']),
        error: (err) => this.error = 'Credenciales inválidas',
        complete: () => this.loading = false
      });
  }
}
```

### Comentarios
- Comentar solo lo no obvio
- Usar JSDoc para métodos públicos de servicios

---

## 🧪 Estrategia de Testing (MVP)

### Enfoque Pragmático
- **Objetivo**: 60-70% de cobertura (no 100%)
- **Prioridad**: Servicios > Guards > Componentes críticos
- **Pragmatismo**: Si funciona y es simple, no sobre-testear

### Qué Testear (Prioritario)
1. ✅ **Servicios**: Todos los métodos públicos
2. ✅ **Guards**: Lógica de autenticación y roles
3. ✅ **Interceptors**: Agregar token, manejo de errores
4. ✅ **Componentes críticos**: Login, formularios

### Qué NO Testear (Bajo ROI para MVP)
- ❌ Componentes de UI simples (solo muestran datos)
- ❌ Templates HTML (visual testing manual)
- ❌ CSS/Estilos
- ❌ Componentes wrapper sin lógica

### Ejemplo de Test Simple
```typescript
describe('AuthService', () => {
  it('should login and return token', () => {
    const service = TestBed.inject(AuthService);
    service.login('user', 'pass').subscribe(response => {
      expect(response.access_token).toBeDefined();
    });
  });
});
```

---

## 📦 Gestión de Estado (MVP)

### Estrategia Simple
- **Estado local**: Propiedades de componentes
- **Estado global**: localStorage para token
- **Sin NgRx**: No necesario para MVP

### Comunicación
```typescript
// Auth state en servicio
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  setUser(user: User): void {
    this.currentUserSubject.next(user);
  }
}
```

---

## 🚀 Despliegue (Simplificado)

### Desarrollo
```bash
make start
```
Disponible en: http://localhost:4200

### Producción (Básico)

#### Dockerfile
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/hr-frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📊 Checklist Final del MVP

### Funcionalidad
- [ ] Login/Logout funciona
- [ ] Empleado puede fichar
- [ ] Empleado puede ver sus fichajes
- [ ] Empleado puede solicitar vacaciones
- [ ] Empleado puede ver sus solicitudes
- [ ] RRHH puede ver todas las solicitudes
- [ ] RRHH puede aprobar/rechazar solicitudes
- [ ] RRHH puede gestionar usuarios (CRUD)

### Calidad
- [ ] Tests pasan: `make test-once`
- [ ] Cobertura > 60%
- [ ] Sin errores críticos en consola
- [ ] Código formateado: `make format`

### Documentación
- [ ] README.md completo
- [ ] Credenciales de prueba documentadas
- [ ] Instrucciones de instalación claras

### Integración
- [ ] Backend corriendo en localhost:8000
- [ ] Frontend conecta correctamente
- [ ] Autenticación funciona
- [ ] Todos los endpoints responden

---

## 🎯 Métricas de Éxito del MVP

### Funcionalidad
✅ **Debe Funcionar**:
- Autenticación completa
- Fichajes (registrar y ver)
- Vacaciones (solicitar y ver)
- Aprobaciones RRHH
- Gestión de usuarios

❌ **Puede Faltar** (post-MVP):
- Diseño elaborado
- Animaciones
- Gráficos
- Exportaciones
- Notificaciones avanzadas

### Calidad Mínima
- ✅ Sin bugs críticos que impidan usar la app
- ✅ Tests básicos pasan
- ✅ Código limpio y legible
- ✅ Documentación básica

### Experiencia de Usuario
- ✅ Interfaz clara y funcional
- ✅ Mensajes de error comprensibles
- ✅ Feedback visual de acciones
- ✅ Navegación intuitiva

---

## 💡 Principios del MVP

### DO (Hacer)
- ✅ Mantenerlo simple
- ✅ Testear lo importante
- ✅ Documentar lo esencial
- ✅ Priorizar funcionalidad
- ✅ Entregar valor rápido

### DON'T (No hacer)
- ❌ Over-engineering
- ❌ Optimización prematura
- ❌ Tests al 100%
- ❌ UI perfecta
- ❌ Features "nice to have"

---

## 📅 Timeline Realista

| Día | Iteración | Entregable |
|-----|-----------|------------|
| 1 | Iteración 1 | Login funcional + tests |
| 2 | Iteración 2 | Fichajes funcionales + tests |
| 3 | Iteración 3 | Vacaciones funcionales + tests |
| 4 | Iteración 4 | Aprobaciones RRHH + tests |
| 5 | Iteración 5 | Gestión usuarios + tests |
| 5.5 | Iteración 6 | Pulido y documentación |

**Total**: 5.5 días = **1 semana laboral + medio día**

---

## 🚦 Criterios para Pasar a la Siguiente Iteración

Antes de avanzar, verificar:
- [ ] Funcionalidad de la iteración completa
- [ ] Tests de la iteración pasan
- [ ] Sin bugs críticos
- [ ] Código commiteado
- [ ] Breve prueba manual funciona

---

## 📞 Referencias Rápidas

- **Documentación de API**: `docs/API.md`
- **Historias de Usuario**: `docs/HISTORIAS-USUARIO.md`
- **Requisitos**: `docs/REQUISITOS.md`
- **Comandos**: Ver `README.md` o ejecutar `make help`

---

**Versión**: 2.0 (MVP)  
**Fecha**: Octubre 16, 2025  
