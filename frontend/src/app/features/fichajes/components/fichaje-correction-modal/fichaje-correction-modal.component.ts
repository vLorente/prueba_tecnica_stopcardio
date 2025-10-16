import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Fichaje } from '@core/models/fichaje.model';

/**
 * Modal para solicitar corrección de un fichaje
 * HU-FICHAJE-004: Solicitar corrección de fichaje
 */
@Component({
  selector: 'app-fichaje-correction-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './fichaje-correction-modal.component.html',
  styleUrl: './fichaje-correction-modal.component.css'
})
export class FichajeCorrectionModalComponent {
  private fb = inject(FormBuilder);

  // Inputs
  readonly fichaje = input.required<Fichaje>();
  readonly isOpen = input<boolean>(false);

  // Outputs
  readonly close = output<void>();
  readonly submit = output<{
    checkIn: Date;
    checkOut?: Date;
    correctionReason: string;
  }>();

  // State
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly formValid = signal(false);

  // Form
  readonly correctionForm = this.fb.nonNullable.group({
    checkInDate: ['', [Validators.required]],
    checkInTime: ['', [Validators.required]],
    checkOutDate: [''],
    checkOutTime: [''],
    correctionReason: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(1000)
    ]]
  });

  // Computed
  readonly canSubmit = computed(() => {
    return this.formValid() && !this.isSubmitting();
  });

  readonly originalCheckIn = computed(() => {
    const fichaje = this.fichaje();
    return fichaje.checkIn;
  });

  readonly originalCheckOut = computed(() => {
    const fichaje = this.fichaje();
    return fichaje.checkOut;
  });

  constructor() {
    // Inicializar formulario cuando cambie el fichaje
    effect(() => {
      const fichaje = this.fichaje();
      if (fichaje && this.isOpen()) {
        this.initializeForm(fichaje);
      }
    });

    // Suscribirse a cambios del formulario para actualizar formValid signal
    this.correctionForm.statusChanges.subscribe(() => {
      this.formValid.set(this.correctionForm.valid);
    });

    // Actualizar estado inicial
    this.formValid.set(this.correctionForm.valid);
  }

  /**
   * Inicializa el formulario con los datos actuales del fichaje
   */
  private initializeForm(fichaje: Fichaje): void {
    const checkInDate = this.formatDate(fichaje.checkIn);
    const checkInTime = this.formatTime(fichaje.checkIn);

    const formValue: any = {
      checkInDate,
      checkInTime,
      checkOutDate: '',
      checkOutTime: '',
      correctionReason: ''
    };

    if (fichaje.checkOut) {
      formValue.checkOutDate = this.formatDate(fichaje.checkOut);
      formValue.checkOutTime = this.formatTime(fichaje.checkOut);
    }

    this.correctionForm.patchValue(formValue);
    this.errorMessage.set(null);
    this.isSubmitting.set(false);
  }

  /**
   * Formatea una fecha a YYYY-MM-DD (local)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatea una hora a HH:MM (local)
   */
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Combina fecha y hora en un objeto Date (local)
   */
  private combineDateTime(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }

  /**
   * Valida los datos del formulario
   */
  private validateFormData(checkIn: Date, checkOut?: Date): string | null {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // No puede ser fecha futura (comparar solo fecha, no hora)
    const checkInDateOnly = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (checkInDateOnly > nowDateOnly) {
      return 'La fecha de entrada no puede ser futura';
    }

    // Máximo 30 días atrás
    if (checkIn < thirtyDaysAgo) {
      return 'Solo se pueden corregir fichajes de los últimos 30 días';
    }

    // Si hay checkout, debe ser posterior al checkin
    if (checkOut && checkOut <= checkIn) {
      return 'La fecha de salida debe ser posterior a la de entrada';
    }

    // Si hay checkout, tampoco puede ser futuro
    if (checkOut) {
      const checkOutDateOnly = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());
      if (checkOutDateOnly > nowDateOnly) {
        return 'La fecha de salida no puede ser futura';
      }
    }

    // Los nuevos valores deben ser diferentes a los originales
    const fichaje = this.fichaje();
    const checkInChanged = Math.abs(checkIn.getTime() - fichaje.checkIn.getTime()) > 60000; // 1 minuto de tolerancia
    const checkOutChanged = fichaje.checkOut
      ? (checkOut ? Math.abs(checkOut.getTime() - fichaje.checkOut.getTime()) > 60000 : true)
      : (checkOut !== undefined && checkOut !== null);

    if (!checkInChanged && !checkOutChanged) {
      return 'Debe modificar al menos la fecha de entrada o salida';
    }

    return null;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const formValue = this.correctionForm.getRawValue();

    // Combinar fecha y hora
    const checkIn = this.combineDateTime(formValue.checkInDate, formValue.checkInTime);

    let checkOut: Date | undefined;
    if (formValue.checkOutDate && formValue.checkOutTime) {
      checkOut = this.combineDateTime(formValue.checkOutDate, formValue.checkOutTime);
    }

    // Validar
    const validationError = this.validateFormData(checkIn, checkOut);
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // Emitir evento
    this.submit.emit({
      checkIn,
      checkOut,
      correctionReason: formValue.correctionReason
    });
  }

  /**
   * Cierra el modal
   */
  onClose(): void {
    this.correctionForm.reset();
    this.errorMessage.set(null);
    this.isSubmitting.set(false);
    this.close.emit();
  }

  /**
   * Maneja errores desde el componente padre
   */
  setError(message: string): void {
    this.errorMessage.set(message);
    this.isSubmitting.set(false);
  }

  /**
   * Resetea el estado de submitting
   */
  resetSubmitting(): void {
    this.isSubmitting.set(false);
  }
}
