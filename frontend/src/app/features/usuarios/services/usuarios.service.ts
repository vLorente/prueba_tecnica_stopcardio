/**
 * Servicio para gestión de usuarios
 * Solo accesible para usuarios con rol HR
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import {
  User,
  UserCreate,
  UserUpdate,
  UserListResponse,
  UserListApiResponse,
  UserApi,
  UserQueryParams,
} from '@core/models/user.model';
import {
  mapUserApiToUser,
  mapUserCreateToApi,
  mapUserUpdateToApi,
  mapUserListFromApi,
} from '@core/mappers/user.mapper';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // ========================================
  // SIGNALS - Estado del servicio
  // ========================================

  private usersSignal = signal<User[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private totalSignal = signal<number>(0);
  private currentPageSignal = signal<number>(1);
  private pageSizeSignal = signal<number>(10);

  // ========================================
  // GETTERS - Acceso público a signals
  // ========================================

  get users() {
    return this.usersSignal.asReadonly();
  }

  get loading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  get total() {
    return this.totalSignal.asReadonly();
  }

  get currentPage() {
    return this.currentPageSignal.asReadonly();
  }

  get pageSize() {
    return this.pageSizeSignal.asReadonly();
  }

  // ========================================
  // COMPUTED SIGNALS - Valores derivados
  // ========================================

  readonly hasUsers = computed(() => this.usersSignal().length > 0);
  readonly totalPages = computed(() =>
    Math.ceil(this.totalSignal() / this.pageSizeSignal())
  );
  readonly hasNextPage = computed(
    () => this.currentPageSignal() < this.totalPages()
  );
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);

  // ========================================
  // MÉTODOS PÚBLICOS
  // ========================================

  /**
   * Cargar lista de usuarios con filtros y paginación
   */
  async loadUsers(params: UserQueryParams = {}): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      // Construir query params
      const queryParams: Record<string, string> = {};

      if (params.skip !== undefined) queryParams['skip'] = params.skip.toString();
      if (params.limit !== undefined) queryParams['limit'] = params.limit.toString();
      if (params.role) queryParams['role'] = params.role;
      if (params.isActive !== undefined && params.isActive !== null) {
        queryParams['is_active'] = params.isActive.toString();
      }

      const response = await firstValueFrom(
        this.apiService.get<UserListApiResponse>('/users/', queryParams)
      );

      const mapped = mapUserListFromApi(response);
      this.usersSignal.set(mapped.users);
      this.totalSignal.set(mapped.total);
      this.currentPageSignal.set(mapped.page);
      this.pageSizeSignal.set(mapped.pageSize);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cargar usuarios';
      this.errorSignal.set(errorMessage);
      console.error('Error loading users:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Crear un nuevo usuario
   */
  async createUser(user: UserCreate): Promise<User> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const apiUser = mapUserCreateToApi(user);

      const response = await firstValueFrom(
        this.apiService.post<UserApi>('/users/', apiUser)
      );

      const newUser = mapUserApiToUser(response);

      // Recargar lista después de crear
      await this.loadUsers({
        skip: (this.currentPageSignal() - 1) * this.pageSizeSignal(),
        limit: this.pageSizeSignal(),
      });

      return newUser;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear usuario';
      this.errorSignal.set(errorMessage);
      console.error('Error creating user:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Actualizar un usuario existente
   */
  async updateUser(id: number, user: UserUpdate): Promise<User> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const apiUser = mapUserUpdateToApi(user);

      const response = await firstValueFrom(
        this.apiService.put<UserApi>(`/users/${id}`, apiUser)
      );

      const updatedUser = mapUserApiToUser(response);

      // Actualizar en la lista local
      const currentUsers = this.usersSignal();
      const updatedUsers = currentUsers.map((u) =>
        u.id === id ? updatedUser : u
      );
      this.usersSignal.set(updatedUsers);

      return updatedUser;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al actualizar usuario';
      this.errorSignal.set(errorMessage);
      console.error('Error updating user:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Eliminar un usuario (soft delete - desactivar)
   */
  async deleteUser(id: number): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      await firstValueFrom(
        this.apiService.delete<void>(`/users/${id}`)
      );

      // Remover de la lista local
      const currentUsers = this.usersSignal();
      const filteredUsers = currentUsers.filter((u) => u.id !== id);
      this.usersSignal.set(filteredUsers);
      this.totalSignal.set(this.totalSignal() - 1);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al eliminar usuario';
      this.errorSignal.set(errorMessage);
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(id: number): Promise<User> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.apiService.get<UserApi>(`/users/${id}`)
      );

      const user = mapUserApiToUser(response);
      return user;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al obtener usuario';
      this.errorSignal.set(errorMessage);
      console.error('Error getting user:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Navegar a la siguiente página
   */
  async nextPage(): Promise<void> {
    if (this.hasNextPage()) {
      const nextPage = this.currentPageSignal() + 1;
      const skip = (nextPage - 1) * this.pageSizeSignal();
      await this.loadUsers({ skip, limit: this.pageSizeSignal() });
    }
  }

  /**
   * Navegar a la página anterior
   */
  async previousPage(): Promise<void> {
    if (this.hasPreviousPage()) {
      const prevPage = this.currentPageSignal() - 1;
      const skip = (prevPage - 1) * this.pageSizeSignal();
      await this.loadUsers({ skip, limit: this.pageSizeSignal() });
    }
  }

  /**
   * Navegar a una página específica
   */
  async goToPage(page: number): Promise<void> {
    if (page >= 1 && page <= this.totalPages()) {
      const skip = (page - 1) * this.pageSizeSignal();
      await this.loadUsers({ skip, limit: this.pageSizeSignal() });
    }
  }

  /**
   * Cambiar el tamaño de página
   */
  async changePageSize(pageSize: number): Promise<void> {
    this.pageSizeSignal.set(pageSize);
    await this.loadUsers({ skip: 0, limit: pageSize });
  }

  /**
   * Limpiar el error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Limpiar todos los datos
   */
  clear(): void {
    this.usersSignal.set([]);
    this.totalSignal.set(0);
    this.currentPageSignal.set(1);
    this.errorSignal.set(null);
    this.loadingSignal.set(false);
  }
}
