import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { DashboardCardComponent } from '@shared/components/dashboard-card/dashboard-card.component';

/**
 * Dashboard Component
 * Main dashboard with welcome message and quick actions
 */
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DashboardCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  readonly authService: AuthService = inject(AuthService);

  readonly currentDate = new Date();
}
