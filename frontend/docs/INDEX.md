# Resumen de Documentación - Frontend StopCardio

Este documento proporciona enlaces rápidos a toda la documentación del proyecto.

## 📚 Documentación Principal

### 1. [README.md](../README.md)
**Inicio rápido y comandos principales**
- Instalación y configuración
- Comandos disponibles (make)
- Stack tecnológico
- Credenciales de prueba

### 2. [REQUISITOS.md](./REQUISITOS.md)
**Requisitos funcionales y técnicos completos**
- Objetivo del proyecto
- Tipos de usuarios y permisos
- Módulos funcionales detallados
- Requisitos de seguridad y UX
- Criterios de éxito

### 3. [HISTORIAS-USUARIO.md](./HISTORIAS-USUARIO.md)
**23 historias de usuario detalladas**
- Autenticación (3 HU)
- Fichajes (6 HU)
- Vacaciones y Ausencias (7 HU)
- Gestión de Usuarios (4 HU)
- Dashboard y Navegación (3 HU)

Incluye criterios de aceptación y endpoints para cada historia.

### 4. [API.md](./API.md)
**Documentación completa de la API del backend**
- Todos los endpoints disponibles
- Request/Response de cada uno
- Códigos de error
- Modelos de datos
- Roles y permisos

### 5. [PLAN-DESARROLLO.md](./PLAN-DESARROLLO.md)
**Roadmap de desarrollo MVP**
- 6 iteraciones planificadas (enfoque MVP)
- Objetivos y componentes de cada iteración
- Estimación: 5.5 días de desarrollo
- Testing integrado en cada iteración
- Filosofía pragmática y simple

### 6. [ANGULAR-20-GUIA.md](./ANGULAR-20-GUIA.md)
**Guía de convenciones de Angular 20**
- Uso de signals para estado
- Standalone components (default)
- inject() en lugar de constructor DI
- Control flow nativo (@if, @for, @switch)
- Computed values y reactive state
- Guards e interceptors funcionales

### 7. [CHANGELOG.md](./CHANGELOG.md)
**Registro de cambios por iteración**
- Log detallado de cada iteración (0-6)
- Features añadidas, cambiadas, corregidas
- Tecnologías aplicadas por iteración
- Estado del proyecto en cada hito

## 🎯 Para Comenzar el Desarrollo

## 🗂️ Iteraciones

En esta carpeta encontrarás un resumen por iteración (0-6) con objetivos, artefactos y criterios de aceptación:

- [Iteración 0 - Configuración del Entorno](./iteraciones/iteracion-0.md)
- [Iteración 1 - Autenticación Básica](./iteraciones/iteracion-1.md)
- [Iteración 2 - Módulo de Fichajes](./iteraciones/iteracion-2.md)
- [Iteración 3 - Módulo de Vacaciones](./iteraciones/iteracion-3.md)
- [Iteración 4 - Gestión RRHH: Aprobaciones](./iteraciones/iteracion-4.md)
- [Iteración 5 - Gestión de Usuarios (CRUD)](./iteraciones/iteracion-5.md)
- [Iteración 6 - Pulido Final y Documentación](./iteraciones/iteracion-6.md)


### Paso 1: Leer Requisitos
👉 [REQUISITOS.md](./REQUISITOS.md)
- Entender el alcance del proyecto
- Conocer los tipos de usuarios
- Revisar módulos funcionales

### Paso 2: Revisar Historias de Usuario
👉 [HISTORIAS-USUARIO.md](./HISTORIAS-USUARIO.md)
- Identificar historias de alta prioridad (🔴)
- Leer criterios de aceptación
- Entender flujos de usuario

### Paso 3: Revisar Guía de Angular 20
👉 [ANGULAR-20-GUIA.md](./ANGULAR-20-GUIA.md)
- Entender uso de signals
- Convenciones de componentes standalone
- Control flow nativo
- Best practices específicas del proyecto

### Paso 4: Familiarizarse con la API
👉 [API](./openapi.json)
- Revisar endpoints disponibles
- Entender estructura de peticiones/respuestas
- Conocer códigos de error

### Paso 5: Seguir el Plan de Desarrollo
👉 [PLAN-DESARROLLO.md](./PLAN-DESARROLLO.md)
- Comenzar con Iteración 1 (Autenticación)
- Seguir el orden sugerido
- Implementar tests en cada iteración

## 📊 Resumen Rápido del Proyecto

### Objetivo
Desarrollar el frontend de un sistema de gestión de fichajes y RRHH que permita:
- Registrar entradas/salidas de empleados
- Solicitar y gestionar vacaciones
- Administrar usuarios y permisos

### Usuarios
1. **Empleado**: Fichajes propios, solicitudes, consultas
2. **RRHH**: Todo lo anterior + gestión completa

### Módulos Principales
1. 🔐 **Autenticación** - Login/Logout/Perfil
2. ⏰ **Fichajes** - Registro, historial, correcciones
3. 🏖️ **Vacaciones** - Solicitudes, aprobaciones, balance
4. 👥 **Usuarios** - CRUD completo (solo RRHH)
5. 📊 **Dashboard** - Vista general y métricas

### Tecnologías
- **Angular 20** con signals y standalone components
- **TypeScript 5.9** con strict mode
- **RxJS 7.8** para programación reactiva
- **Jasmine + Karma** para testing
- **Docker** para despliegue

### Timeline MVP
- **Iteración 0**: ✅ Completada (Setup)
- **Iteraciones 1-4**: 🔴 Alta prioridad (4 días) - Core funcional
- **Iteraciones 5-6**: 🟡 Media prioridad (1.5 días) - Gestión y pulido

**Total**: 5.5 días estimados

## 🔗 Enlaces Útiles

### Documentación Externa
- [Angular Documentation](https://angular.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Documentation](https://rxjs.dev/)
- [Jasmine Testing](https://jasmine.github.io/)

### Backend
- Documentación del backend: `/workspaces/prueba_tecnica_stopcardio/backend/docs/`
- Swagger UI: `http://localhost:8000/docs` (cuando el backend esté corriendo)

### Repositorio
- Frontend: `/workspaces/prueba_tecnica_stopcardio/frontend/`
- Backend: `/workspaces/prueba_tecnica_stopcardio/backend/`

## 🎓 Principios del Proyecto

1. **Funcionalidad sobre diseño**: Priorizar que funcione bien antes que se vea bonito
2. **Clean Code**: Código limpio, legible y mantenible
3. **Testing**: Cobertura mínima del 70%
4. **Documentación**: Todo bien documentado
5. **Iterativo**: Desarrollar en iteraciones pequeñas
6. **User-Centric**: Enfocado en experiencia de usuario

## 💡 Tips de Desarrollo

### Organización
- Seguir la estructura de carpetas propuesta
- Un componente por responsabilidad
- Servicios para lógica compartida
- Guards para protección de rutas

### Testing
- Escribir tests mientras desarrollas
- Tests unitarios para cada servicio
- Tests de componentes para UI crítica
- Tests E2E para flujos principales

### Git
- Commits pequeños y frecuentes
- Mensajes descriptivos
- Usar commits semánticos (feat, fix, docs, etc.)
- Crear branches por feature

### Debugging
- Usar Angular DevTools
- Console.log estratégico
- Breakpoints en VS Code
- Network tab para API calls

---

**Última actualización**: Octubre 16, 2025  
**Versión de documentación**: 1.0  
**Proyecto**: StopCardio HR Management System
