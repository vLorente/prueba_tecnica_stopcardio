import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import type { User, LoginResponse } from '@core/models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'employee',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockLoginResponse: LoginResponse = {
    access_token: 'test-token',
    token_type: 'bearer'
  };

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be authenticated initially', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('should login successfully', async () => {
    const loginPromise = service.login('test@example.com', 'password123');

    const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login');
    expect(loginReq.request.method).toBe('POST');
    expect(loginReq.request.body).toEqual({ email: 'test@example.com', password: 'password123' });
    loginReq.flush(mockLoginResponse);

    // After login, getCurrentUser is called
    const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
    expect(meReq.request.method).toBe('GET');
    meReq.flush(mockUser);

    await loginPromise;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual(mockUser);
    expect(service.token()).toBe('test-token');
    expect(localStorage.getItem('auth_token')).toBe('test-token');
    expect(localStorage.getItem('auth_user')).toBeTruthy();
  });

  it('should logout successfully', async () => {
    // Setup: login first
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    const logoutPromise = service.logout();

    // Expect logout API call
    const logoutReq = httpMock.expectOne('http://localhost:8000/api/auth/logout');
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush({ message: 'Logged out successfully' });

    await logoutPromise;

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should logout even if API call fails', async () => {
    // Setup: login first
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    const logoutPromise = service.logout();

    // Simulate API error
    const logoutReq = httpMock.expectOne('http://localhost:8000/api/auth/logout');
    logoutReq.error(new ProgressEvent('error'), { status: 500 });

    await logoutPromise;

    // Should still clear local state and navigate
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should compute isHR correctly', async () => {
    const hrUser = { ...mockUser, role: 'hr' as const };
    const hrResponse = { ...mockLoginResponse };

    const loginPromise = service.login('admin@example.com', 'admin123');
    const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login');
    loginReq.flush(hrResponse);

    const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
    meReq.flush(hrUser);

    await loginPromise;

    expect(service.isHR()).toBe(true);
    expect(service.isEmployee()).toBe(false);
  });

  it('should compute fullName correctly', async () => {
    const loginPromise = service.login('test@example.com', 'password123');
    const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login');
    loginReq.flush(mockLoginResponse);

    const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
    meReq.flush(mockUser);

    await loginPromise;

    expect(service.fullName()).toBe('Test User');
  });

  it('should load auth state from localStorage', () => {
    // Setup localStorage
    localStorage.setItem('auth_token', 'stored-token');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    // Create new service instance to trigger constructor
    const newService = new AuthService();

    expect(newService.isAuthenticated()).toBe(true);
    expect(newService.user()).toEqual(mockUser);
    expect(newService.token()).toBe('stored-token');
  });

  it('should handle login error', async () => {
    const loginPromise = service.login('wrong@example.com', 'wrongpass');

    const req = httpMock.expectOne('http://localhost:8000/api/auth/login');
    req.flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    try {
      await loginPromise;
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error).toBeTruthy();
      expect(service.isAuthenticated()).toBe(false);
    }
  });
});
