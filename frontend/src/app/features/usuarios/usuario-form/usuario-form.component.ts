import { Component, input, output, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { User, UserCreate, UserUpdate } from '@core/models/user.model';

/**
 * UsuarioFormComponent
 * Formulario reactivo reutilizable para crear/editar usuarios
 */
@Component({
  selector: 'app-usuario-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioFormComponent implements OnInit {
  private fb = new FormBuilder();

  // Inputs
  user = input<User | null>(null);
  isSubmitting = input<boolean>(false);

  // Outputs
  formSubmit = output<UserCreate | UserUpdate>();
  formCancel = output<void>();

  // Form
  userForm!: FormGroup;
  
  // Local state
  isEditMode = signal(false);

  ngOnInit(): void {
    this.isEditMode.set(this.user() !== null);
    this.initForm();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private initForm(): void {
    const currentUser = this.user();
    const isEdit = currentUser !== null;

    this.userForm = this.fb.group({
      email: [
        currentUser?.email || '',
        [Validators.required, Validators.email]
      ],
      fullName: [
        currentUser?.fullName || '',
        [Validators.required, Validators.minLength(3)]
      ],
      password: [
        '',
        isEdit ? [] : [Validators.required, Validators.minLength(8)]
      ],
      role: [
        currentUser?.role || 'employee',
        [Validators.required]
      ],
      isActive: [
        currentUser?.isActive ?? true
      ]
    });
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.userForm.invalid || this.isSubmitting()) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.value;
    
    if (this.isEditMode()) {
      // En modo edición, solo enviar campos modificados
      const updateData: UserUpdate = {};
      
      if (formValue.email !== this.user()?.email) {
        updateData.email = formValue.email;
      }
      if (formValue.fullName !== this.user()?.fullName) {
        updateData.fullName = formValue.fullName;
      }
      if (formValue.password) {
        updateData.password = formValue.password;
      }
      if (formValue.role !== this.user()?.role) {
        updateData.role = formValue.role;
      }
      if (formValue.isActive !== this.user()?.isActive) {
        updateData.isActive = formValue.isActive;
      }

      this.formSubmit.emit(updateData);
    } else {
      // En modo creación, enviar todos los campos
      const createData: UserCreate = {
        email: formValue.email,
        fullName: formValue.fullName,
        password: formValue.password,
        role: formValue.role,
        isActive: formValue.isActive
      };

      this.formSubmit.emit(createData);
    }
  }

  /**
   * Maneja la cancelación del formulario
   */
  onCancel(): void {
    this.formCancel.emit();
  }

  /**
   * Verifica si un campo tiene errores y ha sido tocado
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.userForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field.hasError('email')) {
      return 'Email no válido';
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    return 'Campo inválido';
  }

  /**
   * Obtiene el título del formulario según el modo
   */
  getFormTitle(): string {
    return this.isEditMode() ? 'Editar Usuario' : 'Crear Usuario';
  }

  /**
   * Obtiene el texto del botón de envío según el modo
   */
  getSubmitButtonText(): string {
    return this.isEditMode() ? 'Actualizar' : 'Crear';
  }
}
