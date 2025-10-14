# Prueba Técnica - Sistema de Gestión de Fichajes y RRHH

## Objetivo de la Prueba

Desarrollar una aplicación web funcional de gestión de fichajes y recursos humanos, desplegable mediante Docker.

## Requisitos Técnicos

- La aplicación debe estar completamente dockerizada (incluyendo base de datos y servicios necesarios)
- Debe incluir un archivo `docker-compose.yml` para facilitar el despliegue
- Stack tecnológico: libre elección (recomendamos documentar tu decisión)
- La aplicación debe ser funcional y estar lista para ejecutarse con un simple `docker-compose up`

## Funcionalidades Requeridas

### 1. Sistema de Usuarios (2 niveles de permisos)

#### Empleado
Puede fichar entrada/salida, ver su propio historial de fichajes, solicitar correcciones de fichajes erróneos, solicitar vacaciones/ausencias, y consultar el estado de sus solicitudes.

#### RRHH
Todos los permisos de empleado + visualizar fichajes de todos los empleados, gestionar todas las solicitudes de corrección de fichajes, aprobar/rechazar solicitudes de vacaciones y ausencias, acceder a reportes de asistencia, crear/editar/eliminar usuarios, asignar roles, y configuración general del sistema.

### 2. Módulo de Fichajes

- Registro de entrada y salida con timestamp
- Visualización del historial de fichajes
- Sistema de solicitudes para corregir fichajes erróneos (con workflow de aprobación por RRHH)

### 3. Módulo de Vacaciones y Ausencias

- Formulario de solicitud con fechas y motivo
- Sistema de aprobación/rechazo con comentarios (exclusivo de RRHH)
- Visualización del estado de las solicitudes (pendiente, aprobada, rechazada)
- Balance de días disponibles por empleado

## Entregables

1. Código fuente completo en un repositorio Git (GitHub, GitLab o similar)
2. Archivo `README.md` con:
   - Instrucciones de instalación y despliegue
   - Credenciales de prueba para cada tipo de usuario
   - Stack tecnológico utilizado y justificación
   - Decisiones de diseño relevantes
3. Archivo `docker-compose.yml` funcional
4. *(Opcional)* Archivo `.env.example` con variables de entorno necesarias

## Evaluación

Se valorará especialmente:

- Arquitectura y organización del código
- Seguridad (autenticación, autorización, validaciones)
- Experiencia de usuario (UI/UX)
- Calidad del código y buenas prácticas
- Funcionalidad completa del sistema
- Facilidad de despliegue
- Documentación clara y completa

## Plazo de Entrega

Por favor, envía tu solución en un plazo de **7 días** a partir de la recepción de este correo.

> **IMPORTANTE**: Esta prueba está diseñada para evaluar tu capacidad técnica y forma de trabajo. Entregar rápido no es necesariamente mejor; te recomendamos aprovechar el tiempo disponible para presentar una solución sólida, bien estructurada y documentada. La calidad es más importante que la velocidad.

## Notas Adicionales

- **Recuerda que esto es una prueba técnica**: No es necesario implementar un diseño visual sofisticado o elaborado. Enfócate en la funcionalidad, arquitectura del código y buenas prácticas. Una interfaz clara, simple y funcional es completamente suficiente.
- Puedes utilizar librerías y frameworks que consideres apropiados
- Si tienes dudas técnicas durante el desarrollo, no dudes en contactarnos
- Incluye datos de prueba (seed data) para facilitar la evaluación: al menos 3-4 empleados y 1 usuario RRHH con algunos fichajes y solicitudes de ejemplo