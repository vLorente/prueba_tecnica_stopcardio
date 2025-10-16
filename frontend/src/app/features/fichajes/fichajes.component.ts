import { Component, inject, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FichajesService } from './services/fichajes.service';
import type { Fichaje } from '@core/models/fichaje.model';

/**
 * Fichajes Component
 * Componente para registrar fichajes (check-in/check-out) y ver historial
 */
@Component({
  selector: 'app-fichajes',
  imports: [CommonModule],
  templateUrl: './fichajes.component.html',
  styleUrl: './fichajes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FichajesComponent implements OnInit {
  readonly fichajesService: FichajesService = inject(FichajesService);

  // Expose service signals
  fichajes = this.fichajesService.fichajes;
  fichajeActivo = this.fichajesService.fichajeActivo;
  loading = this.fichajesService.loading;
  error = this.fichajesService.error;
  total = this.fichajesService.total;
  totalHours = this.fichajesService.totalHours;
  currentPage = this.fichajesService.currentPage;
  pageSize = this.fichajesService.pageSize;
  totalPages = this.fichajesService.totalPages;
  hasFichajeActivo = this.fichajesService.hasFichajeActivo;
  ultimoFichaje = this.fichajesService.ultimoFichaje;

  // Local state
  processingCheckIn = signal(false);
  processingCheckOut = signal(false);

  // Computed for pagination
  readonly hasPrevPage = computed(() => this.currentPage() > 1);
  readonly hasNextPage = computed(() => this.currentPage() < this.totalPages());

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  /**
   * Carga los datos iniciales
   */
  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.fichajesService.loadFichajeActivo(),
        this.fichajesService.loadFichajes()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  /**
   * Registra un check-in (entrada)
   */
  async onCheckIn(): Promise<void> {
    if (this.processingCheckIn() || this.hasFichajeActivo()) {
      return;
    }

    try {
      this.processingCheckIn.set(true);
      await this.fichajesService.checkIn();
    } catch (error) {
      console.error('Error en check-in:', error);
    } finally {
      this.processingCheckIn.set(false);
    }
  }

  /**
   * Registra un check-out (salida)
   */
  async onCheckOut(): Promise<void> {
    if (this.processingCheckOut() || !this.hasFichajeActivo()) {
      return;
    }

    try {
      this.processingCheckOut.set(true);
      await this.fichajesService.checkOut();
    } catch (error) {
      console.error('Error en check-out:', error);
    } finally {
      this.processingCheckOut.set(false);
    }
  }

  /**
   * Navega a la página anterior
   */
  async onPreviousPage(): Promise<void> {
    if (this.hasPrevPage()) {
      await this.fichajesService.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Navega a la página siguiente
   */
  async onNextPage(): Promise<void> {
    if (this.hasNextPage()) {
      await this.fichajesService.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Formatea las horas trabajadas
   */
  formatHours(hours: number | null): string {
    if (hours === null) {
      return '--';
    }
    return `${hours.toFixed(2)}h`;
  }

  /**
   * Cierra el mensaje de error
   */
  onCloseError(): void {
    this.fichajesService.clearError();
  }

  /**
   * Calcula el tiempo transcurrido desde el check-in activo
   *
   * @param checkIn - Fecha de check-in como Date object
   */
  getElapsedTime(checkIn: Date): string {
    const now = new Date();
    const diff = now.getTime() - checkIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  /**
   * Obtiene el estado visual del fichaje
   */
  getStatusClass(fichaje: Fichaje): string {
    if (!fichaje.checkOut) {
      return 'status-active';
    }
    return `status-${fichaje.status}`;
  }

  /**
   * Obtiene el texto del estado
   */
  getStatusText(fichaje: Fichaje): string {
    if (!fichaje.checkOut) {
      return 'En curso';
    }
    switch (fichaje.status) {
      case 'valid':
        return 'Válido';
      case 'pending_correction':
        return 'Corrección pendiente';
      case 'corrected':
        return 'Corregido';
      case 'rejected':
        return 'Rechazado';
      default:
        return fichaje.status;
    }
  }
}
