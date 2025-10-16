import { Component, inject, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VacacionesService } from './services/vacaciones.service';
import { VACACION_TIPO_LABELS, VACACION_ESTADO_LABELS } from '@core/models/vacaciones.model';
import type { Vacacion, VacacionTipo } from '@core/models/vacaciones.model';

/**
 * Vacaciones Component
 * Componente para solicitar vacaciones y ver historial de solicitudes
 */
@Component({
  selector: 'app-vacaciones',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vacaciones.component.html',
  styleUrl: './vacaciones.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VacacionesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly vacacionesService = inject(VacacionesService);

  // Expose service signals
  vacaciones = this.vacacionesService.vacaciones;
  balance = this.vacacionesService.balance;
  loading = this.vacacionesService.loading;
  error = this.vacacionesService.error;
  currentPage = this.vacacionesService.currentPage;
  totalPages = this.vacacionesService.totalPages;
  hasVacaciones = this.vacacionesService.hasVacaciones;

  // Local state
  submitting = signal(false);
  showForm = signal(false);

  // Computed for pagination
  readonly hasPrevPage = computed(() => this.currentPage() > 1);
  readonly hasNextPage = computed(() => this.currentPage() < this.totalPages());

  // Labels para UI
  readonly tipoLabels = VACACION_TIPO_LABELS;
  readonly estadoLabels = VACACION_ESTADO_LABELS;
  readonly tipoOptions: VacacionTipo[] = ['vacation', 'sick_leave', 'personal', 'other'];

  // Formulario reactivo
  readonly vacacionForm: FormGroup = this.fb.group({
    tipo: ['vacation' as VacacionTipo, [Validators.required]],
    fechaInicio: ['', [Validators.required]],
    fechaFin: ['', [Validators.required]],
    motivo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
  });

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  /**
   * Carga los datos iniciales
   */
  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.vacacionesService.loadBalance(),
        this.vacacionesService.loadVacaciones()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  /**
   * Muestra u oculta el formulario
   */
  toggleForm(): void {
    this.showForm.update(value => !value);
    if (!this.showForm()) {
      this.vacacionForm.reset({ tipo: 'vacation' });
    }
  }

  /**
   * Envía la solicitud de vacaciones
   */
  async onSubmit(): Promise<void> {
    if (this.vacacionForm.invalid || this.submitting()) {
      return;
    }

    try {
      this.submitting.set(true);

      const formValue = this.vacacionForm.value;
      const fechaInicio = new Date(formValue.fechaInicio);
      const fechaFin = new Date(formValue.fechaFin);

      // Validar que la fecha de fin sea posterior a la de inicio
      if (fechaFin <= fechaInicio) {
        // En producción, esto debería mostrarse como un error de validación
        console.error('La fecha de fin debe ser posterior a la de inicio');
        return;
      }

      await this.vacacionesService.createVacacion({
        tipo: formValue.tipo,
        fechaInicio,
        fechaFin,
        motivo: formValue.motivo
      });

      // Resetear formulario y ocultar
      this.vacacionForm.reset({ tipo: 'vacation' });
      this.showForm.set(false);
    } catch (error) {
      console.error('Error al crear solicitud:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Navega a la página anterior
   */
  async onPreviousPage(): Promise<void> {
    if (this.hasPrevPage()) {
      await this.vacacionesService.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Navega a la página siguiente
   */
  async onNextPage(): Promise<void> {
    if (this.hasNextPage()) {
      await this.vacacionesService.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Cierra el mensaje de error
   */
  onCloseError(): void {
    this.vacacionesService.clearError();
  }

  /**
   * Obtiene la clase CSS del estado
   */
  getEstadoClass(vacacion: Vacacion): string {
    return `status-${vacacion.status}`;
  }

  /**
   * Calcula el porcentaje de días usados
   */
  getUsagePercentage(): number {
    const bal = this.balance();
    if (!bal || bal.diasAnuales === 0) {
      return 0;
    }
    return Math.round((bal.diasTomados / bal.diasAnuales) * 100);
  }

  /**
   * Obtiene la clase del indicador de progreso
   */
  getProgressClass(): string {
    const percentage = this.getUsagePercentage();
    if (percentage >= 90) return 'progress-danger';
    if (percentage >= 70) return 'progress-warning';
    return 'progress-success';
  }
}
