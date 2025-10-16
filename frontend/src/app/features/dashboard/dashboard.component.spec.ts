import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '@core/services/auth.service';
import type { User } from '@core/models/user.model';

// Register Spanish locale
registerLocaleData(localeEs);

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: 1,
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: 'hr',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    // Create mock signals
    const fullNameSignal = signal('Admin User');
    const isHRSignal = signal(true);

    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      fullName: fullNameSignal,
      isHR: isHRSignal
    });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: LOCALE_ID, useValue: 'es-ES' },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have authService injected', () => {
    expect(component.authService).toBeTruthy();
  });

  it('should have currentDate set', () => {
    expect(component.currentDate).toBeDefined();
    expect(component.currentDate instanceof Date).toBe(true);
  });

  it('should display welcome message with user name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const welcomeText = compiled.querySelector('h1')?.textContent;
    expect(welcomeText).toContain('Bienvenido');
    expect(welcomeText).toContain('Admin User');
  });

  it('should display quick actions section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const quickActions = compiled.querySelector('.quick-actions');
    expect(quickActions).toBeTruthy();
  });

  it('should display HR-specific content for HR users', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const hrSection = compiled.textContent;
    expect(hrSection).toContain('Gestión de Usuarios');
  });

  it('should display employee-specific content for employee users', () => {
    // Update mock to employee
    const fullNameSignal = signal('Employee User');
    const isHRSignal = signal(false);

    Object.defineProperty(authServiceMock, 'fullName', { value: fullNameSignal });
    Object.defineProperty(authServiceMock, 'isHR', { value: isHRSignal });

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Employee User');
  });

  it('should have navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a[routerLink]');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should display role badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.role-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Recursos Humanos');
  });
});
