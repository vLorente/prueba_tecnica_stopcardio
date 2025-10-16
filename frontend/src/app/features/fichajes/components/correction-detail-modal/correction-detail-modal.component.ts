import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Fichaje } from '@core/models/fichaje.model';

/**
 * Modal para mostrar el detalle de una solicitud de corrección de fichaje
 * Muestra comparación visual entre datos originales y solicitados
 */
@Component({
  selector: 'app-correction-detail-modal',
  imports: [CommonModule],
  templateUrl: './correction-detail-modal.component.html',
  styleUrl: './correction-detail-modal.component.css'
})
export class CorrectionDetailModalComponent {
  // Inputs
  fichaje = input.required<Fichaje>();
  isOpen = input.required<boolean>();

  // Outputs
  close = output<void>();

  /**
   * Cierra el modal
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Formatea una fecha para mostrar en UI
   */
  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  /**
   * Calcula las horas trabajadas entre dos fechas
   */
  calculateHours(checkIn: Date | null, checkOut: Date | null): string {
    if (!checkIn || !checkOut) return 'Incompleto';
    const diff = checkOut.getTime() - checkIn.getTime();
    const hours = diff / (1000 * 60 * 60);
    return `${hours.toFixed(2)}h`;
  }

  /**
   * Obtiene el label del estado para mostrar
   */
  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      pending_correction: 'Pendiente',
      corrected: 'Aprobada',
      rejected: 'Rechazada',
      valid: 'Válido'
    };
    return statusMap[status] || status;
  }
}
