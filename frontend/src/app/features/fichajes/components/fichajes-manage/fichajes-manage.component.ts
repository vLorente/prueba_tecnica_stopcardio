import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FichajesService } from '@features/fichajes/services/fichajes.service';
import type { Fichaje } from '@core/models/fichaje.model';

/**
 * Componente para que RRHH gestione las solicitudes de corrección de fichajes
 * HU-FICHAJE-006: Aprobar/Rechazar correcciones de fichajes
 */
@Component({
  selector: 'app-fichajes-manage',
  imports: [CommonModule],
  templateUrl: './fichajes-manage.component.html',
  styleUrl: './fichajes-manage.component.css'
})
export class FichajesManageComponent implements OnInit {
  private fichajesService = inject(FichajesService);

  // State
  readonly pendingCorrections = signal<Fichaje[]>([]);
  readonly selectedFichaje = signal<Fichaje | null>(null);
  readonly isModalOpen = signal(false);
  readonly modalAction = signal<'approve' | 'reject'>('approve');
  readonly modalNotes = signal('');
  readonly isProcessing = signal(false);

  // Computed
  readonly loading = computed(() => this.fichajesService.loading());
  readonly error = computed(() => this.fichajesService.error());

  readonly hasPendingCorrections = computed(() => {
    return this.pendingCorrections().length > 0;
  });

  async ngOnInit(): Promise<void> {
    await this.loadPendingCorrections();
  }

  /**
   * Carga las solicitudes de corrección pendientes
   */
  async loadPendingCorrections(): Promise<void> {
    try {
      // Cargar TODOS los fichajes con status='pending_correction' usando endpoint de RRHH
      await this.fichajesService.loadAllFichajes({ status: 'pending_correction' });

      // Los fichajes ya vienen filtrados por la API
      const allFichajes = this.fichajesService.fichajes();
      this.pendingCorrections.set(allFichajes);
    } catch (error) {
      console.error('Error al cargar solicitudes pendientes:', error);
    }
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

      // Recargar lista de pendientes
      await this.loadPendingCorrections();

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
