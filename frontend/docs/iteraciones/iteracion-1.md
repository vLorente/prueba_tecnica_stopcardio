# Iteración 1 — Autenticación Básica

Duración estimada: 1 día

Objetivo:
Implementar login/logout funcional con protección de rutas. SIMPLE Y FUNCIONAL.

Historias de usuario incluidas:
- HU-AUTH-001: Login de Usuario
- HU-AUTH-002: Logout de Usuario
- HU-AUTH-003: Ver Perfil (solo lectura)

Artefactos creados:
- `src/app/core/models/user.model.ts`
- `src/app/core/services/api.service.ts`
- `src/app/core/services/auth.service.ts` (signals: user, token)
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/guards/auth.guard.ts` (authGuard, hrGuard, guestGuard)
- `src/app/features/auth/login/*` (componentes y tests)
- `src/app/features/auth/profile/*` (componentes)
- `src/app/layouts/main-layout/*` (componentes)
- Rutas lazy-loading configuradas en `src/app/app.routes.ts`

Tests incluidos:
- `auth.service.spec.ts`, `api.service.spec.ts`, `auth.guard.spec.ts`, `auth.interceptor.spec.ts`, `login.component.spec.ts`

Criterios de aceptación:
- Login autorizado y persistencia en localStorage
- Logout limpia estado y redirige a `/login`
- Rutas protegidas devuelven 403/redirect apropiado
- Componentes básicos renderizan correctamente

Notas:
- Ver `docs/ANGULAR-20-GUIA.md` para convenciones de implementación con signals y `inject()`.
