import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '@core/services/auth.service';

/**
 * Auth Interceptor
 * Adds JWT token to all HTTP requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  // Skip adding token for login endpoint
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  // Add token if available
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
