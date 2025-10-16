import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

/**
 * Profile Component
 * Displays current user profile information (read-only)
 */
@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  private authService = inject(AuthService);

  // Expose auth service signals
  user = this.authService.user;
  fullName = this.authService.fullName;
  isHR = this.authService.isHR;

  // Format role for display
  roleDisplay = computed(() => {
    const role = this.user()?.role;
    return role === 'hr' ? 'Recursos Humanos' : 'Empleado';
  });

  // Get initials from full name
  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
