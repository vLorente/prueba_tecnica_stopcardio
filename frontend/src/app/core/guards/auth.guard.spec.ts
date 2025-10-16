import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, hrGuard, guestGuard } from './auth.guard';
import { AuthService } from '@core/services/auth.service';
import type { User } from '@core/models/user.model';

describe('Auth Guards', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'employee',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z')
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
      isHR: jasmine.createSpy().and.returnValue(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('authGuard', () => {
    it('should allow access when authenticated', () => {
      (authService.isAuthenticated as jasmine.Spy).and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, { url: '/dashboard' } as any)
      );

      expect(result).toBe(true);
    });

    it('should redirect to login when not authenticated', () => {
      (authService.isAuthenticated as jasmine.Spy).and.returnValue(false);
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, { url: '/dashboard' } as any)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
      expect(result).toBe(mockUrlTree);
    });
  });

  describe('hrGuard', () => {
    it('should allow access when authenticated and is HR', () => {
      (authService.isAuthenticated as jasmine.Spy).and.returnValue(true);
      (authService.isHR as jasmine.Spy).and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        hrGuard({} as any, { url: '/usuarios' } as any)
      );

      expect(result).toBe(true);
    });

    it('should redirect to dashboard when not HR', () => {
      (authService.isAuthenticated as jasmine.Spy).and.returnValue(true);
      (authService.isHR as jasmine.Spy).and.returnValue(false);
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        hrGuard({} as any, { url: '/usuarios' } as any)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      expect(result).toBe(mockUrlTree);
    });

    it('should redirect to dashboard when not authenticated', () => {
      (authService.isAuthenticated as jasmine.Spy).and.returnValue(false);
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        hrGuard({} as any, { url: '/usuarios' } as any)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      expect(result).toBe(mockUrlTree);
    });
  });

  describe('guestGuard', () => {
    it('should allow access when not authenticated', () => {
      (authService.isAuthenticated as jasmine.Spy).and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as any, { url: '/login' } as any)
      );

      expect(result).toBe(true);
    });

    it('should redirect to dashboard when authenticated', () => {
      (authService.isAuthenticated as jasmine.Spy).and.returnValue(true);
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as any, { url: '/login' } as any)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      expect(result).toBe(mockUrlTree);
    });
  });
});
