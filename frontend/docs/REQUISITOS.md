# Requisitos del Sistema - Frontend

## 📋 Objetivo General

Desarrollar el frontend de una aplicación web de gestión de fichajes y recursos humanos para la empresa **StopCardio**, que permita a los empleados y al departamento de RRHH gestionar fichajes, solicitudes de vacaciones y ausencias de manera eficiente.

## 🎯 Contexto del Proyecto

Este frontend se conecta con un backend FastAPI ya desarrollado que proporciona una API RESTful completa. La aplicación debe ser clara, funcional y fácil de usar, priorizando la funcionalidad y las buenas prácticas sobre el diseño visual elaborado.

## 👥 Tipos de Usuarios

### 1. **Empleado** 
Rol básico con permisos limitados:
- ✅ Registrar fichajes de entrada/salida
- ✅ Ver su propio historial de fichajes
- ✅ Solicitar correcciones de fichajes erróneos
- ✅ Solicitar vacaciones y ausencias
- ✅ Consultar el estado de sus solicitudes
- ✅ Ver su balance de días disponibles

### 2. **RRHH (Recursos Humanos)**
Rol administrativo con todos los permisos de empleado más:
- ✅ Visualizar fichajes de todos los empleados
- ✅ Gestionar solicitudes de corrección de fichajes
- ✅ Aprobar/rechazar solicitudes de vacaciones y ausencias
- ✅ Acceder a reportes de asistencia
- ✅ Crear, editar y eliminar usuarios
- ✅ Asignar roles
- ✅ Configuración general del sistema

## 🏗️ Módulos Funcionales

### 1. **Módulo de Autenticación**
- Login con credenciales (username/password)
- Gestión de sesión con tokens JWT
- Logout
- Redirección según permisos

### 2. **Módulo de Fichajes**
- **Registro de fichajes**:
  - Botón para fichar entrada/salida
  - Registro automático de timestamp
  - Detección del tipo de fichaje (entrada/salida)
  
- **Historial de fichajes**:
  - Lista de fichajes propios (empleado)
  - Lista de todos los fichajes (RRHH)
  - Filtros por fecha, empleado, tipo
  - Paginación
  
- **Solicitudes de corrección**:
  - Formulario para solicitar corrección de fichaje
  - Campos: fichaje a corregir, nuevo timestamp, motivo
  - Lista de solicitudes pendientes/aprobadas/rechazadas
  - Sistema de aprobación (solo RRHH)

### 3. **Módulo de Vacaciones y Ausencias**
- **Solicitud de vacaciones/ausencias**:
  - Formulario con:
    - Tipo de solicitud (vacaciones, enfermedad, asunto personal, otro)
    - Fecha de inicio
    - Fecha de fin
    - Motivo
  - Cálculo automático de días solicitados (excluyendo fines de semana)
  - Visualización de días disponibles
  
- **Gestión de solicitudes**:
  - Lista de solicitudes propias con estado (empleado)
  - Lista de todas las solicitudes (RRHH)
  - Estados: pendiente, aprobada, rechazada, cancelada
  - Filtros por estado, tipo, empleado, fechas
  
- **Aprobación/Rechazo (RRHH)**:
  - Botones de aprobar/rechazar
  - Campo de comentarios
  - Validación de permisos

### 4. **Módulo de Gestión de Usuarios (RRHH)**
- **Lista de usuarios**:
  - Tabla con todos los empleados
  - Información: nombre, email, rol, estado
  - Búsqueda y filtros
  
- **Crear/Editar usuario**:
  - Formulario con:
    - Nombre completo
    - Email
    - Username
    - Password (solo en creación)
    - Rol (empleado/RRHH)
    - Días de vacaciones anuales
    - Estado (activo/inactivo)
  
- **Eliminar usuario**:
  - Confirmación antes de eliminar
  - Soft delete (inactivar)

### 5. **Dashboard/Panel Principal**
- **Vista Empleado**:
  - Estado del último fichaje (entrada/salida)
  - Botón de fichaje rápido
  - Balance de vacaciones
  - Resumen de solicitudes pendientes
  - Próximas ausencias aprobadas
  
- **Vista RRHH**:
  - Todo lo anterior +
  - Solicitudes pendientes de aprobación
  - Empleados en vacaciones hoy
  - Resumen de fichajes del día
  - Acceso rápido a reportes

## 🔌 Integración con Backend

### Base URL
```
http://localhost:8000/api
```

### Endpoints Principales

#### Autenticación
- `POST /auth/login` - Login (obtener token)
- `POST /auth/logout` - Logout
- `GET /auth/me` - Información del usuario actual

#### Fichajes
- `POST /fichajes/` - Registrar nuevo fichaje
- `GET /fichajes/me` - Historial propio
- `GET /fichajes/` - Todos los fichajes (RRHH)
- `GET /fichajes/{id}` - Detalle de fichaje
- `POST /fichajes/{id}/solicitar-correccion` - Solicitar corrección
- `GET /fichajes/correcciones/` - Lista de correcciones
- `PATCH /fichajes/correcciones/{id}/aprobar` - Aprobar corrección (RRHH)
- `PATCH /fichajes/correcciones/{id}/rechazar` - Rechazar corrección (RRHH)

#### Vacaciones y Ausencias
- `POST /vacaciones/` - Crear solicitud
- `GET /vacaciones/me` - Solicitudes propias
- `GET /vacaciones/` - Todas las solicitudes (RRHH)
- `GET /vacaciones/{id}` - Detalle de solicitud
- `PATCH /vacaciones/{id}/aprobar` - Aprobar solicitud (RRHH)
- `PATCH /vacaciones/{id}/rechazar` - Rechazar solicitud (RRHH)
- `DELETE /vacaciones/{id}` - Cancelar solicitud (empleado)

#### Usuarios (RRHH)
- `GET /users/` - Lista de usuarios
- `POST /users/` - Crear usuario
- `GET /users/{id}` - Detalle de usuario
- `PATCH /users/{id}` - Actualizar usuario
- `DELETE /users/{id}` - Eliminar usuario

## 🛡️ Requisitos de Seguridad

### Autenticación
- Token JWT en todas las peticiones protegidas
- Header: `Authorization: Bearer <token>`
- Expiración de token y renovación

### Autorización
- Validación de permisos en frontend y backend
- Redirección si no tiene permisos
- Ocultación de funciones no autorizadas

### Validación
- Validación de formularios en frontend
- Validación de datos en backend (doble validación)
- Mensajes de error claros

## 🎨 Requisitos de UI/UX

### Diseño
- ✅ **Simplicidad**: Interfaz clara y funcional
- ✅ **Responsive**: Adaptable a diferentes dispositivos
- ✅ **Consistencia**: Uso consistente de componentes
- ✅ **Accesibilidad**: Formularios accesibles, contraste adecuado

### Componentes Comunes
- Navegación principal
- Breadcrumbs
- Mensajes de éxito/error/advertencia
- Modales de confirmación
- Spinners de carga
- Paginación
- Tablas con ordenación y filtros
- Formularios con validación

### Estados de UI
- Loading states
- Empty states (sin datos)
- Error states
- Success feedback

## 📱 Responsive Design

### Breakpoints Recomendados
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Prioridades por Dispositivo
- **Mobile**: Fichaje rápido, ver solicitudes
- **Tablet/Desktop**: Gestión completa, reportes

## 🧪 Requisitos de Testing

### Tests Unitarios
- Componentes individuales
- Servicios
- Validaciones
- Utilidades

### Tests de Integración
- Flujos completos de usuario
- Integración con API
- Navegación entre páginas

### Cobertura Mínima
- 70% de cobertura general
- 90% en lógica de negocio crítica

## 📊 Requisitos de Rendimiento

- Tiempo de carga inicial < 3 segundos
- Respuesta a interacciones < 100ms
- Lazy loading de módulos
- Caché de datos cuando sea apropiado
- Optimización de imágenes y assets

## 🔄 Estado y Gestión de Datos

### Estado Global
- Usuario autenticado
- Token de sesión
- Información de permisos

### Estado Local
- Datos de formularios
- Filtros aplicados
- Estado de carga

### Caché
- Datos de usuario actual
- Listas frecuentemente consultadas
- TTL apropiado

## 📝 Documentación Requerida

- README.md con instrucciones de instalación
- Documentación de componentes principales
- Guía de estilos (opcional)
- Comentarios en código complejo
- JSDoc/TSDoc en funciones públicas

## 🚀 Entregables

1. ✅ Código fuente en repositorio Git
2. ✅ Dockerfile y docker-compose.yml
3. ✅ README.md completo
4. ✅ Variables de entorno documentadas
5. ✅ Tests con cobertura aceptable
6. ✅ Aplicación funcional y desplegable

## 🎯 Criterios de Éxito

- [ ] Todos los módulos implementados y funcionales
- [ ] Autenticación y autorización funcionando
- [ ] Integración completa con backend
- [ ] Responsive en mobile, tablet y desktop
- [ ] Tests con cobertura > 70%
- [ ] Sin errores críticos en consola
- [ ] Validaciones en todos los formularios
- [ ] Feedback claro al usuario en todas las acciones
- [ ] Código limpio y bien estructurado
- [ ] Documentación completa

## 📅 Priorización de Desarrollo

### 🔴 Alta Prioridad (MVP)
1. Autenticación y login
2. Dashboard básico
3. Módulo de fichajes (registro y visualización)
4. Módulo de vacaciones (solicitud y visualización)

### 🟡 Media Prioridad
1. Gestión de usuarios (RRHH)
2. Solicitudes de corrección de fichajes
3. Aprobación de solicitudes (RRHH)
4. Filtros y búsqueda avanzada

### 🟢 Baja Prioridad (Mejoras)
1. Reportes y estadísticas
2. Notificaciones
3. Exportación de datos
4. Configuración de sistema

---

**Versión**: 1.0  
**Fecha**: Octubre 16, 2025  
**Proyecto**: StopCardio HR Management System
