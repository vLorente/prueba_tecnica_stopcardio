import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { ProfileComponent } from './profile.component';
import { AuthService } from '@core/services/auth.service';
import type { User } from '@core/models/user.model';

// Register Spanish locale
registerLocaleData(localeEs);

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'employee',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  };

  beforeEach(async () => {
    // Create mock signals
    const userSignal = signal<User | null>(mockUser);
    const fullNameSignal = signal('Test User');
    const isHRSignal = signal(false);

    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      user: userSignal,
      fullName: fullNameSignal,
      isHR: isHRSignal
    });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: LOCALE_ID, useValue: 'es-ES' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user information', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test User');
    expect(compiled.textContent).toContain('test@example.com');
  });

  it('should compute role display correctly for employee', () => {
    expect(component.roleDisplay()).toBe('Empleado');
  });

  it('should compute role display correctly for HR', () => {
    const hrUser: User = { ...mockUser, role: 'hr' };
    const userSignal = signal<User | null>(hrUser);
    const isHRSignal = signal(true);

    Object.defineProperty(authServiceMock, 'user', { value: userSignal });
    Object.defineProperty(authServiceMock, 'isHR', { value: isHRSignal });

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.roleDisplay()).toBe('Recursos Humanos');
  });

  it('should get initials from full name', () => {
    expect(component.getInitials('John Doe')).toBe('JD');
    expect(component.getInitials('María García López')).toBe('MG');
    expect(component.getInitials('Test')).toBe('T');
  });

  it('should format date correctly', () => {
    const formattedDate = component.formatDate('2024-01-15T00:00:00Z');
    expect(formattedDate).toContain('2024');
    expect(formattedDate).toContain('enero');
  });

  it('should display active status badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const statusBadge = compiled.querySelector('.status-badge');
    expect(statusBadge).toBeTruthy();
    expect(statusBadge?.classList.contains('status-active')).toBe(true);
    expect(statusBadge?.textContent).toContain('Activo');
  });

  it('should display profile note', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('La información del perfil es de solo lectura');
  });
});
