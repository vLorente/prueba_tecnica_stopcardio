import { Component, inject, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';
import type { User, UserCreate, UserUpdate } from '@core/models/user.model';

/**
 * UsuariosListComponent
 * Componente para gestión CRUD de usuarios (solo accesible para RRHH)
 */
@Component({
  selector: 'app-usuarios-list',
  imports: [CommonModule, UsuarioFormComponent],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosListComponent implements OnInit {
  private usuariosService = inject(UsuariosService);

  // Expose service signals
  users = this.usuariosService.users;
  loading = this.usuariosService.loading;
  error = this.usuariosService.error;
  total = this.usuariosService.total;
  currentPage = this.usuariosService.currentPage;
  pageSize = this.usuariosService.pageSize;
  totalPages = this.usuariosService.totalPages;
  hasUsers = this.usuariosService.hasUsers;
  hasNextPage = this.usuariosService.hasNextPage;
  hasPreviousPage = this.usuariosService.hasPreviousPage;

  // Local state for modals and operations
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedUser = signal<User | null>(null);
  processingDelete = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  /**
   * Carga la lista de usuarios
   */
  private async loadUsers(): Promise<void> {
    try {
      await this.usuariosService.loadUsers();
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  /**
   * Abre el modal para crear usuario
   */
  onCreateUser(): void {
    this.selectedUser.set(null);
    this.showCreateModal.set(true);
  }

  /**
   * Abre el modal para editar usuario
   */
  onEditUser(user: User): void {
    this.selectedUser.set(user);
    this.showEditModal.set(true);
  }

  /**
   * Abre el modal de confirmación para eliminar usuario
   */
  onDeleteUser(user: User): void {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
  }

  /**
   * Confirma y ejecuta la eliminación del usuario
   */
  async confirmDelete(): Promise<void> {
    const user = this.selectedUser();
    if (!user || this.processingDelete()) {
      return;
    }

    try {
      this.processingDelete.set(true);
      await this.usuariosService.deleteUser(user.id);
      this.closeDeleteModal();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      this.processingDelete.set(false);
    }
  }

  /**
   * Maneja el submit del formulario de creación
   */
  async onCreateSubmit(userData: UserCreate | UserUpdate): Promise<void> {
    try {
      await this.usuariosService.createUser(userData as UserCreate);
      this.closeCreateModal();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

  /**
   * Maneja el submit del formulario de edición
   */
  async onEditSubmit(userData: UserCreate | UserUpdate): Promise<void> {
    const user = this.selectedUser();
    if (!user) {
      return;
    }

    try {
      await this.usuariosService.updateUser(user.id, userData as UserUpdate);
      this.closeEditModal();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  /**
   * Cierra el modal de creación
   */
  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.selectedUser.set(null);
  }

  /**
   * Cierra el modal de edición
   */
  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedUser.set(null);
  }

  /**
   * Cierra el modal de eliminación
   */
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
  }

  /**
   * Navega a la página anterior
   */
  async onPreviousPage(): Promise<void> {
    if (this.hasPreviousPage()) {
      await this.usuariosService.previousPage();
    }
  }

  /**
   * Navega a la página siguiente
   */
  async onNextPage(): Promise<void> {
    if (this.hasNextPage()) {
      await this.usuariosService.nextPage();
    }
  }

  /**
   * Cambia el tamaño de página
   */
  async onPageSizeChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    await this.usuariosService.changePageSize(newSize);
  }

  /**
   * Cierra el mensaje de error
   */
  onCloseError(): void {
    this.usuariosService.clearError();
  }

  /**
   * Obtiene el texto del rol para mostrar
   */
  getRoleText(role: 'employee' | 'hr'): string {
    return role === 'hr' ? 'RRHH' : 'Empleado';
  }

  /**
   * Obtiene la clase CSS del badge de rol
   */
  getRoleClass(role: 'employee' | 'hr'): string {
    return role === 'hr' ? 'badge-hr' : 'badge-employee';
  }

  /**
   * Obtiene el texto del estado activo
   */
  getStatusText(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene la clase CSS del badge de estado
   */
  getStatusClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }
}
