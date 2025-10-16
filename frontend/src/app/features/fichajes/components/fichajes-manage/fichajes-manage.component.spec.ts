import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FichajesManageComponent } from './fichajes-manage.component';
import { FichajesService } from '@features/fichajes/services/fichajes.service';
import { signal } from '@angular/core';
import type { Fichaje } from '@core/models/fichaje.model';

describe('FichajesManageComponent', () => {
  let component: FichajesManageComponent;
  let fixture: ComponentFixture<FichajesManageComponent>;
  let mockFichajesService: any;

  const mockPendingFichaje: Fichaje = {
    id: 1,
    userId: 2,
    userEmail: 'user@example.com',
    userFullName: 'Test User',
    checkIn: new Date(2025, 9, 16, 8, 0, 0),
    checkOut: new Date(2025, 9, 16, 17, 0, 0),
    hoursWorked: 9.0,
    status: 'pending_correction',
    notes: null,
    correctionReason: 'Olvidé fichar a la hora correcta',
    correctionRequestedAt: new Date(2025, 9, 16, 18, 0, 0),
    approvedBy: null,
    approvedAt: null,
    approvalNotes: null,
    createdAt: new Date(2025, 9, 16, 8, 0, 0),
    updatedAt: new Date(2025, 9, 16, 18, 0, 0)
  };

  beforeEach(async () => {
    // Create mock service
    mockFichajesService = {
      fichajes: signal<Fichaje[]>([mockPendingFichaje]),
      loading: signal(false),
      error: signal<string | null>(null),
      loadAllFichajes: jasmine.createSpy('loadAllFichajes').and.returnValue(Promise.resolve()),
      aprobarCorreccion: jasmine.createSpy('aprobarCorreccion').and.returnValue(Promise.resolve({} as Fichaje)),
      rechazarCorreccion: jasmine.createSpy('rechazarCorreccion').and.returnValue(Promise.resolve({} as Fichaje))
    };

    await TestBed.configureTestingModule({
      imports: [FichajesManageComponent],
      providers: [
        { provide: FichajesService, useValue: mockFichajesService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FichajesManageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load pending corrections on init', fakeAsync(async () => {
    const loadPromise = component.ngOnInit();
    tick();
    await loadPromise;

    expect(mockFichajesService.loadAllFichajes).toHaveBeenCalledWith({ status: 'pending_correction' });
    expect(component.pendingCorrections().length).toBe(1);
    expect(component.pendingCorrections()[0].status).toBe('pending_correction');
  }));

  it('should load all pending corrections from all users', fakeAsync(async () => {
    // Simular fichajes de múltiples usuarios
    const allFichajes: Fichaje[] = [
      mockPendingFichaje,
      { ...mockPendingFichaje, id: 2, userId: 3, userFullName: 'User 2', status: 'pending_correction' },
      { ...mockPendingFichaje, id: 3, userId: 4, userFullName: 'User 3', status: 'pending_correction' }
    ];
    mockFichajesService.fichajes.set(allFichajes);

    const loadPromise = component.loadPendingCorrections();
    tick();
    await loadPromise;

    // Verificar que carga todos los fichajes pendientes, no solo los del usuario actual
    expect(mockFichajesService.loadAllFichajes).toHaveBeenCalledWith({ status: 'pending_correction' });
    expect(component.pendingCorrections().length).toBe(3);
  }));

  it('should open approval modal', () => {
    component.openApprovalModal(mockPendingFichaje);

    expect(component.isModalOpen()).toBe(true);
    expect(component.modalAction()).toBe('approve');
    expect(component.selectedFichaje()).toEqual(mockPendingFichaje);
  });

  it('should open rejection modal', () => {
    component.openRejectionModal(mockPendingFichaje);

    expect(component.isModalOpen()).toBe(true);
    expect(component.modalAction()).toBe('reject');
    expect(component.selectedFichaje()).toEqual(mockPendingFichaje);
  });

  it('should close modal', () => {
    component.openApprovalModal(mockPendingFichaje);
    component.updateModalNotes('Test notes');

    component.closeModal();

    expect(component.isModalOpen()).toBe(false);
    expect(component.selectedFichaje()).toBeNull();
    expect(component.modalNotes()).toBe('');
  });

  it('should update modal notes', () => {
    const notes = 'Test approval notes';
    component.updateModalNotes(notes);

    expect(component.modalNotes()).toBe(notes);
  });

  it('should approve correction successfully', fakeAsync(async () => {
    // Reset spy to count only this test's calls
    mockFichajesService.loadAllFichajes.calls.reset();

    component.openApprovalModal(mockPendingFichaje);
    component.updateModalNotes('Aprobado correctamente');

    const processPromise = component.processAction();

    // Wait for the async operation
    await processPromise;
    tick();

    expect(mockFichajesService.aprobarCorreccion).toHaveBeenCalledWith(1, 'Aprobado correctamente');
    expect(mockFichajesService.loadAllFichajes).toHaveBeenCalledTimes(1); // Reload after approval
    expect(component.isModalOpen()).toBe(false);
    expect(component.isProcessing()).toBe(false);
  }));

  it('should approve correction without notes', fakeAsync(async () => {
    component.openApprovalModal(mockPendingFichaje);

    const processPromise = component.processAction();
    tick();
    await processPromise;
    tick();

    expect(mockFichajesService.aprobarCorreccion).toHaveBeenCalledWith(1, undefined);
  }));

  it('should reject correction successfully', fakeAsync(async () => {
    component.openRejectionModal(mockPendingFichaje);
    component.updateModalNotes('Datos incorrectos');

    const processPromise = component.processAction();
    tick();
    await processPromise;
    tick();

    expect(mockFichajesService.rechazarCorreccion).toHaveBeenCalledWith(1, 'Datos incorrectos');
    expect(mockFichajesService.loadAllFichajes).toHaveBeenCalled();
    expect(component.isModalOpen()).toBe(false);
  }));

  it('should handle approval error', fakeAsync(async () => {
    mockFichajesService.aprobarCorreccion.and.returnValue(
      Promise.reject(new Error('Error al aprobar'))
    );

    component.openApprovalModal(mockPendingFichaje);

    const processPromise = component.processAction();
    tick();

    try {
      await processPromise;
    } catch (error) {
      // Expected error
    }

    tick();

    expect(component.isProcessing()).toBe(false);
  }));

  it('should format date correctly', () => {
    const date = new Date(2025, 9, 16, 8, 30, 0);
    const formatted = component.formatDate(date);

    expect(formatted).toContain('16');
    expect(formatted).toContain('10');
    expect(formatted).toContain('2025');
    expect(formatted).toContain('08');
    expect(formatted).toContain('30');
  });

  it('should return N/A for null date', () => {
    const formatted = component.formatDate(null);
    expect(formatted).toBe('N/A');
  });

  it('should calculate hours between dates', () => {
    const checkIn = new Date(2025, 9, 16, 8, 0, 0);
    const checkOut = new Date(2025, 9, 16, 17, 0, 0);

    const hours = component.calculateHours(checkIn, checkOut);
    expect(hours).toBe('9.00h');
  });

  it('should return "Incompleto" for null checkout', () => {
    const checkIn = new Date(2025, 9, 16, 8, 0, 0);
    const hours = component.calculateHours(checkIn, null);
    expect(hours).toBe('Incompleto');
  });

  it('should show empty state when no pending corrections', () => {
    mockFichajesService.fichajes.set([]);
    fixture.detectChanges();

    expect(component.hasPendingCorrections()).toBe(false);
  });

  it('should show loading state', () => {
    mockFichajesService.loading.set(true);
    fixture.detectChanges();

    expect(component.loading()).toBe(true);
  });

  it('should show error state', () => {
    const errorMessage = 'Error al cargar solicitudes';
    mockFichajesService.error.set(errorMessage);
    fixture.detectChanges();

    expect(component.error()).toBe(errorMessage);
  });

  it('should not process action without selected fichaje', async () => {
    component.selectedFichaje.set(null);

    await component.processAction();

    expect(mockFichajesService.aprobarCorreccion).not.toHaveBeenCalled();
    expect(mockFichajesService.rechazarCorreccion).not.toHaveBeenCalled();
  });
});
