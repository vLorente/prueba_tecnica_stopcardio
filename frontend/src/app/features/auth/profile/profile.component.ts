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

  // Check if dates are different (for updated date display)
  isDifferentDate(date1: Date, date2: Date): boolean {
    return date1.getTime() !== date2.getTime();
  }
}
