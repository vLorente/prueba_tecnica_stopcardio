import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DashboardCardComponent } from '@shared/components/dashboard-card/dashboard-card.component';
import { CommonModule } from '@angular/common';

/**
 * RRHH Dashboard Component
 * Main dashboard for HR administrators with access to all HR functionalities
 */
@Component({
  selector: 'app-rrhh-dashboard',
  imports: [CommonModule, DashboardCardComponent],
  templateUrl: './rrhh-dashboard.component.html',
  styleUrl: './rrhh-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhDashboardComponent {
  /**
   * HR functionality cards configuration
   */
  readonly features = [
    {
      title: 'Gestión de Vacaciones',
      description: 'Revisar y aprobar/rechazar solicitudes de vacaciones de los empleados',
      icon: '📋',
      route: '/rrhh/aprobaciones',
      color: '#667eea'
    },
    {
      title: 'Gestión de Fichajes',
      description: 'Revisar y aprobar/rechazar solicitudes de corrección de fichajes',
      icon: '✏️',
      route: '/rrhh/correcciones',
      color: '#f59e0b'
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar empleados, roles y permisos del sistema',
      icon: '👥',
      route: '/rrhh/usuarios',
      color: '#48bb78'
    }
  ];
}
