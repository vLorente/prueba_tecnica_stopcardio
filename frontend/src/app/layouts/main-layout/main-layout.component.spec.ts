import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '@core/services/auth.service';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    // Create mock signals
    const fullNameSignal = signal('Test User');
    const isHRSignal = signal(false);
    const isEmployeeSignal = signal(true);

    authServiceMock = jasmine.createSpyObj('AuthService', ['logout'], {
      fullName: fullNameSignal,
      isHR: isHRSignal,
      isEmployee: isEmployeeSignal
    });

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have authService injected', () => {
    expect(component.authService).toBeTruthy();
  });

  it('should display logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('.logo');
    expect(logo).toBeTruthy();
    expect(logo?.textContent).toContain('StopCardio HR');
  });

  it('should display user name in header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const userName = compiled.querySelector('.user-name');
    expect(userName).toBeTruthy();
    expect(userName?.textContent).toContain('Test User');
  });

  it('should display employee role badge for employee', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const userRole = compiled.querySelector('.user-role');
    expect(userRole).toBeTruthy();
    expect(userRole?.classList.contains('role-employee')).toBe(true);
    expect(userRole?.textContent).toContain('Empleado');
  });

  it('should display HR role badge for HR users', () => {
    // Update mock to HR user
    const fullNameSignal = signal('HR User');
    const isHRSignal = signal(true);
    const isEmployeeSignal = signal(false);

    Object.defineProperty(authServiceMock, 'fullName', { value: fullNameSignal });
    Object.defineProperty(authServiceMock, 'isHR', { value: isHRSignal });
    Object.defineProperty(authServiceMock, 'isEmployee', { value: isEmployeeSignal });

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const userRole = compiled.querySelector('.user-role');
    expect(userRole?.classList.contains('role-hr')).toBe(true);
    expect(userRole?.textContent).toContain('RRHH');
  });

  it('should display navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.nav-link');
    expect(navLinks.length).toBeGreaterThanOrEqual(3); // Dashboard, Fichajes, Vacaciones

    const linkTexts = Array.from(navLinks).map(link => link.textContent?.trim());
    expect(linkTexts).toContain('Dashboard');
    expect(linkTexts).toContain('Fichajes');
    expect(linkTexts).toContain('Vacaciones');
  });

  it('should show Administración RRHH link for HR users', () => {
    // Update mock to HR user
    const fullNameSignal = signal('HR User');
    const isHRSignal = signal(true);
    const isEmployeeSignal = signal(false);

    Object.defineProperty(authServiceMock, 'fullName', { value: fullNameSignal });
    Object.defineProperty(authServiceMock, 'isHR', { value: isHRSignal });
    Object.defineProperty(authServiceMock, 'isEmployee', { value: isEmployeeSignal });

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.nav-link');
    const linkTexts = Array.from(navLinks).map(link => link.textContent?.trim());
    expect(linkTexts).toContain('Administración RRHH');
  });

  it('should not show Administración RRHH link for employee users', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.nav-link');
    const linkTexts = Array.from(navLinks).map(link => link.textContent?.trim());
    expect(linkTexts).not.toContain('Administración RRHH');
  });

  it('should display logout button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutBtn = compiled.querySelector('.btn-logout');
    expect(logoutBtn).toBeTruthy();
    expect(logoutBtn?.textContent).toContain('Salir');
  });

  it('should display profile button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const profileBtn = compiled.querySelector('.btn-icon');
    expect(profileBtn).toBeTruthy();
  });

  it('should have router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should display footer', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('.footer');
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toContain('2025');
    expect(footer?.textContent).toContain('StopCardio HR');
  });

  it('should call logout when onLogout is called with confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    authServiceMock.logout.and.returnValue(Promise.resolve());

    await component.onLogout();

    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres cerrar sesión?');
    expect(authServiceMock.logout).toHaveBeenCalled();
  });

  it('should not call logout when onLogout is cancelled', async () => {
    spyOn(window, 'confirm').and.returnValue(false);

    await component.onLogout();

    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres cerrar sesión?');
    expect(authServiceMock.logout).not.toHaveBeenCalled();
  });

  it('should trigger logout on logout button click', () => {
    spyOn(component, 'onLogout');

    const compiled = fixture.nativeElement as HTMLElement;
    const logoutBtn = compiled.querySelector('.btn-logout') as HTMLButtonElement;
    logoutBtn.click();

    expect(component.onLogout).toHaveBeenCalled();
  });
});
