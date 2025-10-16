import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteMock = {
      snapshot: {
        queryParams: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const form = component.loginForm;
    expect(form.valid).toBe(false);

    form.patchValue({
      email: 'test@example.com',
      password: 'pass123'
    });

    expect(form.valid).toBe(true);
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);

    emailControl?.setValue('valid@example.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('abc');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('abcd');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should not submit invalid form', async () => {
    component.loginForm.patchValue({
      email: '',
      password: ''
    });

    await component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should login successfully', async () => {
    authService.login.and.returnValue(Promise.resolve());
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(component.loading()).toBe(false);

    const submitPromise = component.onSubmit();
    expect(component.loading()).toBe(true);

    await submitPromise;

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should navigate to returnUrl after login', async () => {
    authService.login.and.returnValue(Promise.resolve());
    activatedRoute.snapshot.queryParams = { returnUrl: '/profile' };

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });

    await component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should handle login error', async () => {
    const errorMessage = 'Invalid credentials';
    authService.login.and.returnValue(Promise.reject(new Error(errorMessage)));

    component.loginForm.patchValue({
      email: 'wrong@example.com',
      password: 'wrongpass'
    });

    await component.onSubmit();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe(errorMessage);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should clear error message', () => {
    component.error.set('Test error');
    expect(component.error()).toBe('Test error');

    component.clearError();
    expect(component.error()).toBeNull();
  });
});
