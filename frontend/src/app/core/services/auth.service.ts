import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import type { User, UserApi, LoginRequest, LoginResponse } from '@core/models/user.model';
import { mapUserApiToUser } from '@core/mappers/user.mapper';

/**
 * Authentication Service
 * Manages user authentication state with signals
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  // Private signals
  private userSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);
  private isAuthenticatedSignal = computed(() => this.userSignal() !== null && this.tokenSignal() !== null);
  private isHRSignal = computed(() => this.userSignal()?.role === 'hr');
  private isEmployeeSignal = computed(() => this.userSignal()?.role === 'employee');
  private fullNameSignal = computed(() => this.userSignal()?.fullName || '');

  // Public getters
  get user(): Signal<User | null> {
    return this.userSignal.asReadonly();
  }

  get token(): Signal<string | null> {
    return this.tokenSignal.asReadonly();
  }

  get isAuthenticated(): Signal<boolean> {
    return this.isAuthenticatedSignal;
  }

  get isHR(): Signal<boolean> {
    return this.isHRSignal;
  }

  get isEmployee(): Signal<boolean> {
    return this.isEmployeeSignal;
  }

  get fullName(): Signal<string> {
    return this.fullNameSignal;
  }

  constructor() {
    // Load auth state from localStorage on init
    this.loadAuthState();
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const loginData: LoginRequest = { email, password };
      const response = await firstValueFrom(
        this.apiService.post<LoginResponse>('/auth/login', loginData)
      );

      // Store token
      this.tokenSignal.set(response.access_token);

      // Get user data from /auth/me endpoint
      await this.getCurrentUser();

      // Persist token to localStorage
      this.saveAuthState(response.access_token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await firstValueFrom(
        this.apiService.post('/auth/logout', {})
      );
    } catch (error) {
      // Log error but continue with logout (even if server call fails)
      console.error('Logout API call failed:', error);
    } finally {
      // Clear signals
      this.tokenSignal.set(null);
      this.userSignal.set(null);

      // Clear localStorage
      this.clearAuthState();

      // Navigate to login
      this.router.navigate(['/login']);
    }
  }

  /**
   * Get current user (refresh from API)
   */
  async getCurrentUser(): Promise<User> {
    try {
      const userApi = await firstValueFrom(
        this.apiService.get<UserApi>('/auth/me')
      );
      const user = mapUserApiToUser(userApi);
      this.userSignal.set(user);
      this.saveUser(user);
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Save auth state to localStorage
   */
  private saveAuthState(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Save user to localStorage
   */
  private saveUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  /**
   * Load auth state from localStorage
   */
  private loadAuthState(): void {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.tokenSignal.set(token);
        this.userSignal.set(user);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearAuthState();
      }
    }
  }

  /**
   * Clear auth state from localStorage
   */
  private clearAuthState(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}
