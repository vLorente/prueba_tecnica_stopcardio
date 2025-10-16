import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VacacionesService } from '../services/vacaciones.service';
import { AuthService } from '@core/services/auth.service';
import type { Vacacion, VacacionEstado, VacacionTipo } from '@core/models/vacaciones.model';
import { VACACION_TIPO_LABELS, VACACION_ESTADO_LABELS } from '@core/models/vacaciones.model';

/**
 * Componente de Aprobaciones RRHH
 *
 * Permite a los usuarios con rol HR:
 * - Ver todas las solicitudes de vacaciones
 * - Filtrar por estado, tipo, usuario
 * - Aprobar solicitudes pendientes
 * - Rechazar solicitudes pendientes con comentarios
 */
@Component({
  selector: 'app-aprobaciones-rrhh',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aprobaciones-rrhh.component.html',
  styleUrl: './aprobaciones-rrhh.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AprobacionesRrhhComponent implements OnInit {
  private readonly vacacionesService = inject(VacacionesService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Labels para UI
  readonly tipoLabels = VACACION_TIPO_LABELS;
  readonly estadoLabels = VACACION_ESTADO_LABELS;

  // Signals locales
  readonly selectedSolicitud = signal<Vacacion | null>(null);
  readonly showApprovalModal = signal(false);
  readonly showRejectionModal = signal(false);
  readonly submitting = signal(false);
  readonly filterStatus = signal<VacacionEstado | ''>('pending');
  readonly filterTipo = signal<VacacionTipo | ''>('');

  // Formulario de rechazo (comentarios requeridos)
  readonly rejectionForm: FormGroup = this.fb.group({
    comentarios: ['', [Validators.required, Validators.maxLength(500)]]
  });

  // Formulario de aprobación (comentarios opcionales)
  readonly approvalForm: FormGroup = this.fb.group({
    comentarios: ['', [Validators.maxLength(500)]]
  });

  // Signals del servicio
  readonly solicitudes = this.vacacionesService.allSolicitudes;
  readonly loading = this.vacacionesService.loading;
  readonly error = this.vacacionesService.error;
  readonly currentPage = this.vacacionesService.hrCurrentPage;
  readonly totalPages = this.vacacionesService.hrTotalPages;

  async ngOnInit(): Promise<void> {
    // Cargar solicitudes pendientes por defecto
    await this.loadSolicitudes();
  }

  /**
   * Carga las solicitudes con los filtros actuales
   */
  async loadSolicitudes(): Promise<void> {
    const params: any = {};

    if (this.filterStatus()) {
      params.status = this.filterStatus();
    }

    if (this.filterTipo()) {
      params.tipo = this.filterTipo();
    }

    await this.vacacionesService.loadAllSolicitudes(params);
  }

  /**
   * Cambia el filtro de estado y recarga
   */
  async onFilterStatusChange(status: VacacionEstado | ''): Promise<void> {
    this.filterStatus.set(status);
    await this.loadSolicitudes();
  }

  /**
   * Cambia el filtro de tipo y recarga
   */
  async onFilterTipoChange(tipo: VacacionTipo | ''): Promise<void> {
    this.filterTipo.set(tipo);
    await this.loadSolicitudes();
  }

  /**
   * Abre el modal de aprobación
   */
  openApprovalModal(solicitud: Vacacion): void {
    this.selectedSolicitud.set(solicitud);
    this.showApprovalModal.set(true);
    this.approvalForm.reset();
  }

  /**
   * Abre el modal de rechazo
   */
  openRejectionModal(solicitud: Vacacion): void {
    this.selectedSolicitud.set(solicitud);
    this.showRejectionModal.set(true);
    this.rejectionForm.reset();
  }

  /**
   * Cierra todos los modales
   */
  closeModals(): void {
    this.showApprovalModal.set(false);
    this.showRejectionModal.set(false);
    this.selectedSolicitud.set(null);
    this.approvalForm.reset();
    this.rejectionForm.reset();
  }

  /**
   * Aprueba una solicitud
   */
  async onApprove(): Promise<void> {
    const solicitud = this.selectedSolicitud();
    if (!solicitud || this.submitting()) {
      return;
    }

    this.submitting.set(true);

    try {
      const comentarios = this.approvalForm.get('comentarios')?.value || null;

      await this.vacacionesService.reviewSolicitud(solicitud.id, {
        approved: true,
        comentariosRevision: comentarios
      });

      this.closeModals();
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Rechaza una solicitud
   */
  async onReject(): Promise<void> {
    if (this.rejectionForm.invalid || this.submitting()) {
      return;
    }

    const solicitud = this.selectedSolicitud();
    if (!solicitud) {
      return;
    }

    this.submitting.set(true);

    try {
      const comentarios = this.rejectionForm.get('comentarios')?.value;

      await this.vacacionesService.reviewSolicitud(solicitud.id, {
        approved: false,
        comentariosRevision: comentarios
      });

      this.closeModals();
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Navega a la página anterior
   */
  async onPreviousPage(): Promise<void> {
    if (this.currentPage() > 1) {
      await this.vacacionesService.goToHrPage(this.currentPage() - 1);
    }
  }

  /**
   * Navega a la página siguiente
   */
  async onNextPage(): Promise<void> {
    if (this.currentPage() < this.totalPages()) {
      await this.vacacionesService.goToHrPage(this.currentPage() + 1);
    }
  }

  /**
   * Determina la clase CSS para el badge de estado
   */
  getEstadoClass(solicitud: Vacacion): string {
    return `status-${solicitud.status}`;
  }

  /**
   * Determina la clase CSS para el badge de tipo
   */
  getTipoClass(tipo: VacacionTipo): string {
    return `tipo-${tipo}`;
  }

  /**
   * Verifica si una solicitud puede ser revisada (está pendiente)
   */
  canReview(solicitud: Vacacion): boolean {
    return solicitud.isPending;
  }

  /**
   * Limpia el error actual
   */
  clearError(): void {
    this.vacacionesService.clearError();
  }
}
