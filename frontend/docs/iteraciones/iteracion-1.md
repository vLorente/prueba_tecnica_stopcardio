# Iteración 1 — Autenticación Básica ✅ COMPLETADA

Duración estimada: 1 día
**Estado:** ✅ Completada
**Tests:** 67/67 SUCCESS

Objetivo:
Implementar login/logout funcional con protección de rutas. SIMPLE Y FUNCIONAL.

Historias de usuario incluidas:
- ✅ HU-AUTH-001: Login de Usuario
- ✅ HU-AUTH-002: Logout de Usuario
- ✅ HU-AUTH-003: Ver Perfil (solo lectura)

Artefactos creados:
- `src/app/core/models/user.model.ts` - Modelos User (camelCase) y UserApi (snake_case)
- `src/app/core/mappers/user.mapper.ts` - Mappers bidireccionales frontend ↔️ API
- `src/app/core/services/api.service.ts`
- `src/app/core/services/auth.service.ts` - Signals privados con getters públicos
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/guards/auth.guard.ts` (authGuard, hrGuard, guestGuard)
- `src/app/features/auth/login/*` (componentes y tests)
- `src/app/features/auth/profile/*` (componentes y tests)
- `src/app/features/dashboard/*` (componentes y tests)
- `src/app/layouts/main-layout/*` (componentes y tests)
- Rutas lazy-loading configuradas en `src/app/app.routes.ts`
- Configuración de locale español (es-ES) en `app.config.ts`

Tests incluidos:
- `auth.service.spec.ts` - 14 tests
- `api.service.spec.ts` - 5 tests
- `auth.guard.spec.ts` - 6 tests
- `auth.interceptor.spec.ts` - 5 tests
- `login.component.spec.ts` - 11 tests
- `profile.component.spec.ts` - 8 tests (nuevo)
- `dashboard.component.spec.ts` - 10 tests (nuevo)
- `main-layout.component.spec.ts` - 16 tests (nuevo)
- `app.spec.ts` - 1 test

**Total: 67 tests pasando correctamente**

Criterios de aceptación:
- ✅ Login autorizado y persistencia en localStorage
- ✅ Logout limpia estado y redirige a `/login`
- ✅ Rutas protegidas devuelven 403/redirect apropiado
- ✅ Componentes básicos renderizan correctamente
- ✅ Guard HR protege ruta `/usuarios`
- ✅ Locale español configurado para DatePipe
- ✅ Signals con encapsulación apropiada (privados + getters)

Mejoras implementadas:
- ✅ Refactor de nomenclatura: Frontend usa camelCase, API usa snake_case
- ✅ Sistema de mappers para conversión frontend ↔️ API
- ✅ Cambio de "Dto" a "Api" para claridad en nombres de interfaces
- ✅ Signals privados con getters públicos en AuthService
- ✅ Tests completos para todos los componentes principales
- ✅ Configuración de locale español

Notas:
- Ver `docs/ANGULAR-20-GUIA.md` para convenciones de implementación con signals y `inject()`.
- Arquitectura dual de modelos: User (frontend) + UserApi (backend) con mappers automáticos

---

**Finalizada el:** 16 de Octubre de 2025
