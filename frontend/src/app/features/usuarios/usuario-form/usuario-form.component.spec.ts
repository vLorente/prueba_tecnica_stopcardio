import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { UsuarioFormComponent } from './usuario-form.component';
import type { User, UserCreate, UserUpdate } from '@core/models/user.model';

describe('UsuarioFormComponent', () => {
  let component: UsuarioFormComponent;
  let fixture: ComponentFixture<UsuarioFormComponent>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'employee',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioFormComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize in create mode when no user provided', () => {
      expect(component.isEditMode()).toBe(false);
    });

    it('should initialize form with empty values', () => {
      expect(component.userForm.get('email')?.value).toBe('');
      expect(component.userForm.get('fullName')?.value).toBe('');
      expect(component.userForm.get('password')?.value).toBe('');
      expect(component.userForm.get('role')?.value).toBe('employee');
      expect(component.userForm.get('isActive')?.value).toBe(true);
    });

    it('should require email field', () => {
      const email = component.userForm.get('email');
      expect(email?.hasError('required')).toBe(true);

      email?.setValue('test@example.com');
      expect(email?.hasError('required')).toBe(false);
    });

    it('should validate email format', () => {
      const email = component.userForm.get('email');

      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBe(true);

      email?.setValue('valid@example.com');
      expect(email?.hasError('email')).toBe(false);
    });

    it('should require fullName field', () => {
      const fullName = component.userForm.get('fullName');
      expect(fullName?.hasError('required')).toBe(true);

      fullName?.setValue('John Doe');
      expect(fullName?.hasError('required')).toBe(false);
    });

    it('should validate fullName minimum length', () => {
      const fullName = component.userForm.get('fullName');

      fullName?.setValue('Ab');
      expect(fullName?.hasError('minlength')).toBe(true);

      fullName?.setValue('John');
      expect(fullName?.hasError('minlength')).toBe(false);
    });

    it('should require password in create mode', () => {
      const password = component.userForm.get('password');
      expect(password?.hasError('required')).toBe(true);

      password?.setValue('password123');
      expect(password?.hasError('required')).toBe(false);
    });

    it('should validate password minimum length', () => {
      const password = component.userForm.get('password');

      password?.setValue('short');
      expect(password?.hasError('minlength')).toBe(true);

      password?.setValue('longenough');
      expect(password?.hasError('minlength')).toBe(false);
    });

    it('should emit formSubmit with create data when valid', () => {
      let emittedData: UserCreate | UserUpdate | undefined;
      component.formSubmit.subscribe((data) => {
        emittedData = data;
      });

      component.userForm.patchValue({
        email: 'new@example.com',
        fullName: 'New User',
        password: 'password123',
        role: 'hr',
        isActive: false
      });

      component.onSubmit();

      expect(emittedData).toEqual({
        email: 'new@example.com',
        fullName: 'New User',
        password: 'password123',
        role: 'hr',
        isActive: false
      } as UserCreate);
    });

    it('should not submit when form is invalid', () => {
      let emitted = false;
      component.formSubmit.subscribe(() => {
        emitted = true;
      });

      component.onSubmit();

      expect(emitted).toBe(false);
    });

    it('should mark all fields as touched when submitting invalid form', () => {
      component.onSubmit();

      expect(component.userForm.get('email')?.touched).toBe(true);
      expect(component.userForm.get('fullName')?.touched).toBe(true);
      expect(component.userForm.get('password')?.touched).toBe(true);
    });

    it('should display "Crear Usuario" as title', () => {
      expect(component.getFormTitle()).toBe('Crear Usuario');
    });

    it('should display "Crear" as submit button text', () => {
      expect(component.getSubmitButtonText()).toBe('Crear');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();
    });

    it('should initialize in edit mode when user provided', () => {
      expect(component.isEditMode()).toBe(true);
    });

    it('should initialize form with user values', () => {
      expect(component.userForm.get('email')?.value).toBe(mockUser.email);
      expect(component.userForm.get('fullName')?.value).toBe(mockUser.fullName);
      expect(component.userForm.get('password')?.value).toBe('');
      expect(component.userForm.get('role')?.value).toBe(mockUser.role);
      expect(component.userForm.get('isActive')?.value).toBe(mockUser.isActive);
    });

    it('should not require password in edit mode', () => {
      const password = component.userForm.get('password');
      expect(password?.hasError('required')).toBe(false);

      // Password is optional in edit mode, but if provided, no minlength validation
      password?.setValue('');
      expect(password?.valid).toBe(true);
    });

    it('should allow any password length in edit mode', () => {
      const password = component.userForm.get('password');

      // In edit mode, password has no validators, so any length is valid
      password?.setValue('short');
      expect(password?.hasError('minlength')).toBe(false);
      expect(password?.valid).toBe(true);

      password?.setValue('longenough');
      expect(password?.hasError('minlength')).toBe(false);
      expect(password?.valid).toBe(true);
    });

    it('should emit formSubmit with only changed fields', () => {
      let emittedData: UserCreate | UserUpdate | undefined;
      component.formSubmit.subscribe((data) => {
        emittedData = data;
      });

      component.userForm.patchValue({
        email: 'updated@example.com',
        fullName: 'Updated Name'
      });

      component.onSubmit();

      expect(emittedData).toEqual({
        email: 'updated@example.com',
        fullName: 'Updated Name'
      } as UserUpdate);
    });

    it('should include password in update if provided', () => {
      let emittedData: UserCreate | UserUpdate | undefined;
      component.formSubmit.subscribe((data) => {
        emittedData = data;
      });

      component.userForm.patchValue({
        password: 'newpassword123'
      });

      component.onSubmit();

      expect((emittedData as UserUpdate).password).toBe('newpassword123');
    });

    it('should not include unchanged fields in update', () => {
      let emittedData: UserCreate | UserUpdate | undefined;
      component.formSubmit.subscribe((data) => {
        emittedData = data;
      });

      component.userForm.patchValue({
        email: 'updated@example.com'
      });

      component.onSubmit();

      const updateData = emittedData as UserUpdate;
      expect(updateData.email).toBe('updated@example.com');
      expect(updateData.fullName).toBeUndefined();
      expect(updateData.role).toBeUndefined();
    });

    it('should display "Editar Usuario" as title', () => {
      expect(component.getFormTitle()).toBe('Editar Usuario');
    });

    it('should display "Actualizar" as submit button text', () => {
      expect(component.getSubmitButtonText()).toBe('Actualizar');
    });
  });

  describe('Form Interaction', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit formCancel when cancel clicked', () => {
      let cancelled = false;
      component.formCancel.subscribe(() => {
        cancelled = true;
      });

      component.onCancel();

      expect(cancelled).toBe(true);
    });

    it('should not submit when isSubmitting is true', () => {
      fixture.componentRef.setInput('isSubmitting', true);
      fixture.detectChanges();

      let emitted = false;
      component.formSubmit.subscribe(() => {
        emitted = true;
      });

      component.userForm.patchValue({
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123'
      });

      component.onSubmit();

      expect(emitted).toBe(false);
    });

    it('should detect field errors correctly', () => {
      const email = component.userForm.get('email');

      expect(component.hasError('email')).toBe(false);

      email?.markAsTouched();
      expect(component.hasError('email')).toBe(true);
    });

    it('should detect specific error types', () => {
      const email = component.userForm.get('email');

      email?.setValue('invalid');
      email?.markAsTouched();

      expect(component.hasError('email', 'email')).toBe(true);
      expect(component.hasError('email', 'required')).toBe(false);
    });

    it('should return appropriate error messages', () => {
      const email = component.userForm.get('email');

      email?.setErrors({ required: true });
      expect(component.getErrorMessage('email')).toBe('Este campo es obligatorio');

      email?.setErrors({ email: true });
      expect(component.getErrorMessage('email')).toBe('Email no válido');

      const fullName = component.userForm.get('fullName');
      fullName?.setErrors({ minlength: { requiredLength: 3 } });
      expect(component.getErrorMessage('fullName')).toBe('Mínimo 3 caracteres');
    });

    it('should return empty string for valid fields', () => {
      const email = component.userForm.get('email');
      email?.setValue('valid@example.com');

      expect(component.getErrorMessage('email')).toBe('');
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display all form fields', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('#email')).toBeTruthy();
      expect(compiled.querySelector('#fullName')).toBeTruthy();
      expect(compiled.querySelector('#password')).toBeTruthy();
      expect(compiled.querySelector('#role')).toBeTruthy();
      expect(compiled.querySelector('[formControlName="isActive"]')).toBeTruthy();
    });

    it('should display error messages when fields are invalid', () => {
      const email = component.userForm.get('email');
      email?.markAsTouched();
      email?.setErrors({ required: true });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorMessage = compiled.querySelector('.error-message');

      expect(errorMessage).toBeTruthy();
      expect(errorMessage?.textContent).toContain('Este campo es obligatorio');
    });

    it('should disable submit button when form is invalid', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

      expect(submitButton.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.userForm.patchValue({
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
        role: 'employee',
        isActive: true
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('Template Rendering - Edit Mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();
    });

    it('should display form title in edit mode', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('h3');

      expect(title?.textContent).toContain('Editar Usuario');
    });

    it('should display help text for password in edit mode', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const helpText = compiled.querySelector('.help-text');

      expect(helpText?.textContent).toContain('Dejar en blanco para mantener');
    });
  });
});
