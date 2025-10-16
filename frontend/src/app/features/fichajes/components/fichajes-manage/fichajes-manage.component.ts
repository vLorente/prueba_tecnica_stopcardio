import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FichajesService } from '@features/fichajes/services/fichajes.service';
import { CorrectionDetailModalComponent } from '@features/fichajes/components/correction-detail-modal/correction-detail-modal.component';
import type { Fichaje, FichajeStatus } from '@core/models/fichaje.model';

/**
 * Componente para que RRHH gestione las solicitudes de corrección de fichajes
 * HU-FICHAJE-006: Aprobar/Rechazar correcciones de fichajes
 */
@Component({
  selector: 'app-fichajes-manage',
  imports: [CommonModule, CorrectionDetailModalComponent],
  templateUrl: './fichajes-manage.component.html',
  styleUrl: './fichajes-manage.component.css'
})
export class FichajesManageComponent implements OnInit {
  private fichajesService = inject(FichajesService);

  // State
  readonly corrections = signal<Fichaje[]>([]);
  readonly selectedFichaje = signal<Fichaje | null>(null);
  readonly isModalOpen = signal(false);
  readonly modalAction = signal<'approve' | 'reject'>('approve');
  readonly modalNotes = signal('');
  readonly isProcessing = signal(false);
  readonly statusFilter = signal<FichajeStatus | 'all'>('pending_correction');

  // Modal de detalle
  readonly isDetailModalOpen = signal(false);
  readonly detailFichaje = signal<Fichaje | null>(null);

  // Computed
  readonly loading = computed(() => this.fichajesService.loading());
  readonly error = computed(() => this.fichajesService.error());

  readonly hasCorrections = computed(() => {
    return this.corrections().length > 0;
  });

  async ngOnInit(): Promise<void> {
    await this.loadCorrections();
  }

  /**
   * Carga las correcciones según el filtro de estado
   */
  async loadCorrections(): Promise<void> {
    try {
      const status = this.statusFilter();

      // Si el filtro es 'all', no enviamos el parámetro status
      const params = status === 'all' ? {} : { status };

      // Cargar TODOS los fichajes filtrados usando endpoint de RRHH
      await this.fichajesService.loadAllFichajes(params);

      // Los fichajes ya vienen filtrados por la API
      const allFichajes = this.fichajesService.fichajes();
      this.corrections.set(allFichajes);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    }
  }

  /**
   * Cambia el filtro de estado y recarga
   */
  async onStatusFilterChange(status: FichajeStatus | 'all'): Promise<void> {
    this.statusFilter.set(status);
    await this.loadCorrections();
  }

  /**
   * Formatea el estado de un fichaje para mostrar en UI
   */
  getStatusDisplay(status: FichajeStatus): { label: string } {
    const statusMap: Record<FichajeStatus, { label: string }> = {
      pending_correction: { label: 'Pendiente' },
      corrected: { label: 'Aprobada' },
      rejected: { label: 'Rechazada' },
      valid: { label: 'Válido' }
    };
    return statusMap[status] || { label: status };
  }

  /**
   * Verifica si un fichaje puede ser editado (está en estado pendiente)
   */
  canEditFichaje(fichaje: Fichaje): boolean {
    return fichaje.status === 'pending_correction';
  }

  /**
   * Determina qué campos se solicitan cambiar en la corrección
   * Compara los datos originales con los propuestos
   */
  getCorrectionFieldsLabel(fichaje: Fichaje): string {
    if (!fichaje.correctionReason || (!fichaje.proposedCheckIn && !fichaje.proposedCheckOut)) {
      return 'N/A';
    }

    const hasCheckInChange = fichaje.proposedCheckIn !== null;
    const hasCheckOutChange = fichaje.proposedCheckOut !== null;

    if (hasCheckInChange && hasCheckOutChange) {
      return 'Entrada y Salida';
    } else if (hasCheckInChange) {
      return 'Entrada';
    } else if (hasCheckOutChange) {
      return 'Salida';
    }

    return 'N/A';
  }

  /**
   * Abre el modal de detalle de la solicitud
   */
  openDetailModal(fichaje: Fichaje): void {
    this.detailFichaje.set(fichaje);
    this.isDetailModalOpen.set(true);
  }

  /**
   * Cierra el modal de detalle
   */
  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.detailFichaje.set(null);
  }

  /**
   * Abre el modal de aprobación
   */
  openApprovalModal(fichaje: Fichaje): void {
    this.selectedFichaje.set(fichaje);
    this.modalAction.set('approve');
    this.modalNotes.set('');
    this.isModalOpen.set(true);
  }

  /**
   * Abre el modal de rechazo
   */
  openRejectionModal(fichaje: Fichaje): void {
    this.selectedFichaje.set(fichaje);
    this.modalAction.set('reject');
    this.modalNotes.set('');
    this.isModalOpen.set(true);
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedFichaje.set(null);
    this.modalNotes.set('');
  }

  /**
   * Procesa la aprobación o rechazo
   */
  async processAction(): Promise<void> {
    const fichaje = this.selectedFichaje();
    if (!fichaje) return;

    const action = this.modalAction();
    const notes = this.modalNotes().trim();

    this.isProcessing.set(true);

    try {
      if (action === 'approve') {
        await this.fichajesService.aprobarCorreccion(fichaje.id, notes || undefined);
      } else {
        await this.fichajesService.rechazarCorreccion(fichaje.id, notes || undefined);
      }

      // Recargar lista
      await this.loadCorrections();

      // Cerrar modal
      this.closeModal();
    } catch (error: any) {
      console.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} corrección:`, error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Actualiza las notas del modal
   */
  updateModalNotes(notes: string): void {
    this.modalNotes.set(notes);
  }

  /**
   * Formatea una fecha a string legible
   */
  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Calcula las horas entre dos fechas
   */
  calculateHours(checkIn: Date, checkOut: Date | null): string {
    if (!checkOut) return 'Incompleto';
    const diff = checkOut.getTime() - checkIn.getTime();
    const hours = diff / (1000 * 60 * 60);
    return `${hours.toFixed(2)}h`;
  }
}
