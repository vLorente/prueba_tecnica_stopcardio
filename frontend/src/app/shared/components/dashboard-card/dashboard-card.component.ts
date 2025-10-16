import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Dashboard Card Component
 * Reusable card component for dashboard actions and features
 */
@Component({
  selector: 'app-dashboard-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardCardComponent {
  /**
   * Card title
   */
  title = input.required<string>();

  /**
   * Card description
   */
  description = input.required<string>();

  /**
   * Card icon (emoji or icon class)
   */
  icon = input.required<string>();

  /**
   * Route to navigate to (null for disabled cards)
   */
  route = input<string | null>(null);

  /**
   * Whether the card is disabled
   */
  disabled = input<boolean>(false);

  /**
   * Custom color for the card accent
   */
  color = input<string>('#667eea');

  /**
   * Optional CSS class for special styling (e.g., 'card-hr')
   */
  customClass = input<string>('');

  /**
   * Show action text at bottom (default: 'Acceder')
   */
  actionText = input<string>('Acceder');

  /**
   * Show arrow indicator
   */
  showArrow = input<boolean>(true);
}
