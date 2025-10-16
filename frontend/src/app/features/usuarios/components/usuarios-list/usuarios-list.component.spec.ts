import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { UsuariosListComponent } from './usuarios-list.component';
import { UsuariosService } from '../../services/usuarios.service';
import type { User } from '@core/models/user.model';

describe('UsuariosListComponent', () => {
  let component: UsuariosListComponent;
  let fixture: ComponentFixture<UsuariosListComponent>;
  let usuariosServiceMock: any;
  let usersSignal: WritableSignal<User[]>;
  let loadingSignal: WritableSignal<boolean>;
  let errorSignal: WritableSignal<string | null>;
  let totalSignal: WritableSignal<number>;
  let currentPageSignal: WritableSignal<number>;
  let pageSizeSignal: WritableSignal<number>;
  let totalPagesSignal: WritableSignal<number>;
  let hasUsersSignal: WritableSignal<boolean>;
  let hasNextPageSignal: WritableSignal<boolean>;
  let hasPreviousPageSignal: WritableSignal<boolean>;

  const mockUser1: User = {
    id: 1,
    email: 'john@example.com',
    fullName: 'John Doe',
    role: 'employee',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  const mockUser2: User = {
    id: 2,
    email: 'jane@example.com',
    fullName: 'Jane HR',
    role: 'hr',
    isActive: true,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z')
  };

  const mockUser3: User = {
    id: 3,
    email: 'inactive@example.com',
    fullName: 'Inactive User',
    role: 'employee',
    isActive: false,
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-03T00:00:00Z')
  };

  beforeEach(async () => {
    // Create writable signals
    usersSignal = signal<User[]>([]);
    loadingSignal = signal(false);
    errorSignal = signal<string | null>(null);
    totalSignal = signal(0);
    currentPageSignal = signal(1);
    pageSizeSignal = signal(10);
    totalPagesSignal = signal(0);
    hasUsersSignal = signal(false);
    hasNextPageSignal = signal(false);
    hasPreviousPageSignal = signal(false);

    // Create mock service
    usuariosServiceMock = jasmine.createSpyObj('UsuariosService', [
      'loadUsers',
      'createUser',
      'updateUser',
      'deleteUser',
      'getUserById',
      'nextPage',
      'previousPage',
      'goToPage',
      'changePageSize',
      'clearError',
      'clear'
    ]);

    Object.defineProperty(usuariosServiceMock, 'users', { get: () => usersSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'loading', { get: () => loadingSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'error', { get: () => errorSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'total', { get: () => totalSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'currentPage', { get: () => currentPageSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'pageSize', { get: () => pageSizeSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'totalPages', { get: () => totalPagesSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'hasUsers', { get: () => hasUsersSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'hasNextPage', { get: () => hasNextPageSignal.asReadonly() });
    Object.defineProperty(usuariosServiceMock, 'hasPreviousPage', { get: () => hasPreviousPageSignal.asReadonly() });

    usuariosServiceMock.loadUsers.and.resolveTo();
    usuariosServiceMock.deleteUser.and.resolveTo();
    usuariosServiceMock.nextPage.and.resolveTo();
    usuariosServiceMock.previousPage.and.resolveTo();
    usuariosServiceMock.changePageSize.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [UsuariosListComponent],
      providers: [
        { provide: UsuariosService, useValue: usuariosServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(usuariosServiceMock.loadUsers).toHaveBeenCalled();
  });

  it('should display loading state when loading', () => {
    loadingSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const loadingState = compiled.querySelector('.loading-state');
    expect(loadingState).toBeTruthy();
    expect(loadingState?.textContent).toContain('Cargando usuarios');
  });

  it('should display empty state when no users', () => {
    loadingSignal.set(false);
    usersSignal.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No hay usuarios registrados');
  });

  it('should display users table when users exist', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser1, mockUser2]);
    hasUsersSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const table = compiled.querySelector('.usuarios-table');
    expect(table).toBeTruthy();

    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should display user information correctly in table', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser1]);
    hasUsersSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('John Doe');
    expect(compiled.textContent).toContain('john@example.com');
  });

  it('should display error message when error exists', () => {
    errorSignal.set('Error al cargar usuarios');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('.alert-error');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Error al cargar usuarios');
  });

  it('should close error message when close button clicked', () => {
    errorSignal.set('Error al cargar usuarios');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const closeButton = compiled.querySelector('.btn-close') as HTMLButtonElement;
    expect(closeButton).toBeTruthy();

    closeButton.click();
    expect(usuariosServiceMock.clearError).toHaveBeenCalled();
  });

  it('should open create modal when create button clicked', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser1]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const createButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
    expect(createButton).toBeTruthy();

    component.onCreateUser();
    expect(component.showCreateModal()).toBe(true);
    expect(component.selectedUser()).toBeNull();
  });

  it('should open edit modal when edit button clicked', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser1]);
    hasUsersSignal.set(true);
    fixture.detectChanges();

    component.onEditUser(mockUser1);
    expect(component.showEditModal()).toBe(true);
    expect(component.selectedUser()).toBe(mockUser1);
  });

  it('should open delete modal when delete button clicked', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser1]);
    hasUsersSignal.set(true);
    fixture.detectChanges();

    component.onDeleteUser(mockUser1);
    expect(component.showDeleteModal()).toBe(true);
    expect(component.selectedUser()).toBe(mockUser1);
  });

  it('should display delete confirmation modal with user info', () => {
    component.selectedUser.set(mockUser1);
    component.showDeleteModal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const modal = compiled.querySelector('.modal-overlay');
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain('John Doe');
    expect(modal?.textContent).toContain('john@example.com');
  });

  it('should delete user when confirm delete clicked', async () => {
    component.selectedUser.set(mockUser1);
    component.showDeleteModal.set(true);
    fixture.detectChanges();

    await component.confirmDelete();

    expect(usuariosServiceMock.deleteUser).toHaveBeenCalledWith(mockUser1.id);
    expect(component.showDeleteModal()).toBe(false);
    expect(component.selectedUser()).toBeNull();
  });

  it('should not delete if no user selected', async () => {
    component.selectedUser.set(null);
    component.showDeleteModal.set(true);

    await component.confirmDelete();

    expect(usuariosServiceMock.deleteUser).not.toHaveBeenCalled();
  });

  it('should not delete if already processing', async () => {
    component.selectedUser.set(mockUser1);
    component.processingDelete.set(true);

    await component.confirmDelete();

    expect(usuariosServiceMock.deleteUser).not.toHaveBeenCalled();
  });

  it('should close create modal', () => {
    component.showCreateModal.set(true);
    component.selectedUser.set(mockUser1);

    component.closeCreateModal();

    expect(component.showCreateModal()).toBe(false);
    expect(component.selectedUser()).toBeNull();
  });

  it('should close edit modal', () => {
    component.showEditModal.set(true);
    component.selectedUser.set(mockUser1);

    component.closeEditModal();

    expect(component.showEditModal()).toBe(false);
    expect(component.selectedUser()).toBeNull();
  });

  it('should close delete modal', () => {
    component.showDeleteModal.set(true);
    component.selectedUser.set(mockUser1);

    component.closeDeleteModal();

    expect(component.showDeleteModal()).toBe(false);
    expect(component.selectedUser()).toBeNull();
  });

  it('should navigate to next page', async () => {
    hasNextPageSignal.set(true);

    await component.onNextPage();

    expect(usuariosServiceMock.nextPage).toHaveBeenCalled();
  });

  it('should not navigate to next page if no next page', async () => {
    hasNextPageSignal.set(false);

    await component.onNextPage();

    expect(usuariosServiceMock.nextPage).not.toHaveBeenCalled();
  });

  it('should navigate to previous page', async () => {
    hasPreviousPageSignal.set(true);

    await component.onPreviousPage();

    expect(usuariosServiceMock.previousPage).toHaveBeenCalled();
  });

  it('should not navigate to previous page if no previous page', async () => {
    hasPreviousPageSignal.set(false);

    await component.onPreviousPage();

    expect(usuariosServiceMock.previousPage).not.toHaveBeenCalled();
  });

  it('should change page size when select changed', async () => {
    const event = { target: { value: '25' } } as any;

    await component.onPageSizeChange(event);

    expect(usuariosServiceMock.changePageSize).toHaveBeenCalledWith(25);
  });

  it('should display pagination info correctly', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser1]);
    hasUsersSignal.set(true);
    currentPageSignal.set(2);
    totalPagesSignal.set(5);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const paginationInfo = compiled.querySelector('.pagination-info');
    expect(paginationInfo?.textContent).toContain('Página 2 de 5');
  });

  it('should get role text correctly', () => {
    expect(component.getRoleText('employee')).toBe('Empleado');
    expect(component.getRoleText('hr')).toBe('RRHH');
  });

  it('should get role class correctly', () => {
    expect(component.getRoleClass('employee')).toBe('badge-employee');
    expect(component.getRoleClass('hr')).toBe('badge-hr');
  });

  it('should get status text correctly', () => {
    expect(component.getStatusText(true)).toBe('Activo');
    expect(component.getStatusText(false)).toBe('Inactivo');
  });

  it('should get status class correctly', () => {
    expect(component.getStatusClass(true)).toBe('badge-active');
    expect(component.getStatusClass(false)).toBe('badge-inactive');
  });

  it('should display HR badge correctly', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser2]);
    hasUsersSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge-hr');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('RRHH');
  });

  it('should display inactive badge correctly', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser3]);
    hasUsersSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge-inactive');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Inactivo');
  });

  it('should display stats correctly', () => {
    loadingSignal.set(false);
    usersSignal.set([mockUser1, mockUser2]);
    hasUsersSignal.set(true);
    totalSignal.set(50);
    currentPageSignal.set(1);
    totalPagesSignal.set(5);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const stats = compiled.querySelectorAll('.stat-value');
    expect(stats[0].textContent).toContain('50'); // Total
    expect(stats[1].textContent).toContain('2');  // Showing
    expect(stats[2].textContent).toContain('1 / 5'); // Page
  });

  it('should disable buttons when loading', () => {
    loadingSignal.set(true);
    usersSignal.set([mockUser1]);
    hasUsersSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button:not(.btn-close)');
    buttons.forEach(button => {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
