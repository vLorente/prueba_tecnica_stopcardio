import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Main Layout Component
 * Main application layout with navigation and header
 */
@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  /**
   * Logout handler
   */
  async onLogout(): Promise<void> {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await this.authService.logout();
    }
  }
}
