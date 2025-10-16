import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, computed } from '@angular/core';
import { FichajesComponent } from './fichajes.component';
import { FichajesService } from './services/fichajes.service';
import type { Fichaje } from '@core/models/fichaje.model';

describe('FichajesComponent', () => {
  let component: FichajesComponent;
  let fixture: ComponentFixture<FichajesComponent>;
  let mockFichajesService: any;

  const mockFichaje: Fichaje = {
    id: 1,
    userId: 1,
    userEmail: 'test@example.com',
    userFullName: 'Test User',
    checkIn: new Date('2025-10-16T08:00:00Z'),
    checkOut: null,
    hoursWorked: null,
    status: 'valid',
    notes: null,
    correctionReason: null,
    correctionRequestedAt: null,
    proposedCheckIn: null,
    proposedCheckOut: null,
    approvedBy: null,
    approvedAt: null,
    approvalNotes: null,
    createdAt: new Date('2025-10-16T08:00:00Z'),
    updatedAt: new Date('2025-10-16T08:00:00Z')
  };

  beforeEach(async () => {
    // Create writable signals
    const fichajesSignal = signal<Fichaje[]>([]);
    const fichajeActivoSignal = signal<Fichaje | null>(null);
    const loadingSignal = signal(false);
    const errorSignal = signal<string | null>(null);
    const totalSignal = signal(0);
    const totalHoursSignal = signal(0);
    const currentPageSignal = signal(1);
    const pageSizeSignal = signal(10);
    const totalPagesSignal = signal(0);
    const ultimoFichajeSignal = signal<Fichaje | null>(null);

    mockFichajesService = {
      checkIn: jasmine.createSpy('checkIn'),
      checkOut: jasmine.createSpy('checkOut'),
      loadFichajeActivo: jasmine.createSpy('loadFichajeActivo'),
      loadFichajes: jasmine.createSpy('loadFichajes'),
      goToPage: jasmine.createSpy('goToPage'),
      clearError: jasmine.createSpy('clearError'),
      fichajes: fichajesSignal.asReadonly(),
      fichajeActivo: fichajeActivoSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      error: errorSignal.asReadonly(),
      total: totalSignal.asReadonly(),
      totalHours: totalHoursSignal.asReadonly(),
      currentPage: currentPageSignal.asReadonly(),
      pageSize: pageSizeSignal.asReadonly(),
      totalPages: totalPagesSignal.asReadonly(),
      hasFichajeActivo: computed(() => fichajeActivoSignal() !== null),
      ultimoFichaje: ultimoFichajeSignal.asReadonly(),
      // Expose writable signals for testing
      _fichajesSignal: fichajesSignal,
      _fichajeActivoSignal: fichajeActivoSignal,
      _loadingSignal: loadingSignal,
      _errorSignal: errorSignal,
      _totalSignal: totalSignal,
      _totalHoursSignal: totalHoursSignal,
      _currentPageSignal: currentPageSignal,
      _pageSizeSignal: pageSizeSignal,
      _totalPagesSignal: totalPagesSignal,
      _ultimoFichajeSignal: ultimoFichajeSignal
    };

    await TestBed.configureTestingModule({
      imports: [FichajesComponent],
      providers: [
        { provide: FichajesService, useValue: mockFichajesService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FichajesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    mockFichajesService.loadFichajeActivo.and.returnValue(Promise.resolve());
    mockFichajesService.loadFichajes.and.returnValue(Promise.resolve());

    fixture.detectChanges(); // triggers ngOnInit

    expect(mockFichajesService.loadFichajeActivo).toHaveBeenCalled();
    expect(mockFichajesService.loadFichajes).toHaveBeenCalled();
  });

  describe('onCheckIn', () => {
    it('should call checkIn on service', async () => {
      mockFichajesService.checkIn.and.returnValue(Promise.resolve(mockFichaje));

      await component.onCheckIn();

      expect(mockFichajesService.checkIn).toHaveBeenCalled();
      expect(component.processingCheckIn()).toBe(false);
    });

    it('should not call checkIn if already processing', async () => {
      component.processingCheckIn.set(true);

      await component.onCheckIn();

      expect(mockFichajesService.checkIn).not.toHaveBeenCalled();
    });

    it('should not call checkIn if already has active fichaje', async () => {
      mockFichajesService._fichajeActivoSignal.set(mockFichaje);

      await component.onCheckIn();

      expect(mockFichajesService.checkIn).not.toHaveBeenCalled();
    });

    it('should handle check-in error', async () => {
      mockFichajesService.checkIn.and.returnValue(Promise.reject(new Error('Error')));

      await component.onCheckIn();

      expect(component.processingCheckIn()).toBe(false);
    });
  });

  describe('onCheckOut', () => {
    beforeEach(() => {
      mockFichajesService._fichajeActivoSignal.set(mockFichaje);
    });

    it('should call checkOut on service', async () => {
      const fichajeCompleted = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z'), hoursWorked: 9.0 };
      mockFichajesService.checkOut.and.returnValue(Promise.resolve(fichajeCompleted));

      await component.onCheckOut();

      expect(mockFichajesService.checkOut).toHaveBeenCalled();
      expect(component.processingCheckOut()).toBe(false);
    });

    it('should not call checkOut if already processing', async () => {
      component.processingCheckOut.set(true);

      await component.onCheckOut();

      expect(mockFichajesService.checkOut).not.toHaveBeenCalled();
    });

    it('should not call checkOut if no active fichaje', async () => {
      mockFichajesService._fichajeActivoSignal.set(null);

      await component.onCheckOut();

      expect(mockFichajesService.checkOut).not.toHaveBeenCalled();
    });

    it('should handle check-out error', async () => {
      mockFichajesService.checkOut.and.returnValue(Promise.reject(new Error('Error')));

      await component.onCheckOut();

      expect(component.processingCheckOut()).toBe(false);
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      mockFichajesService._currentPageSignal.set(2);
      mockFichajesService._totalPagesSignal.set(5);
      mockFichajesService.goToPage.and.returnValue(Promise.resolve());
    });

    it('should go to previous page', async () => {
      await component.onPreviousPage();

      expect(mockFichajesService.goToPage).toHaveBeenCalledWith(1);
    });

    it('should not go to previous page if on first page', async () => {
      mockFichajesService._currentPageSignal.set(1);

      await component.onPreviousPage();

      expect(mockFichajesService.goToPage).not.toHaveBeenCalled();
    });

    it('should go to next page', async () => {
      await component.onNextPage();

      expect(mockFichajesService.goToPage).toHaveBeenCalledWith(3);
    });

    it('should not go to next page if on last page', async () => {
      mockFichajesService._currentPageSignal.set(5);

      await component.onNextPage();

      expect(mockFichajesService.goToPage).not.toHaveBeenCalled();
    });

    it('should compute hasPrevPage correctly', () => {
      mockFichajesService._currentPageSignal.set(2);
      expect(component.hasPrevPage()).toBe(true);

      mockFichajesService._currentPageSignal.set(1);
      expect(component.hasPrevPage()).toBe(false);
    });

    it('should compute hasNextPage correctly', () => {
      mockFichajesService._currentPageSignal.set(4);
      mockFichajesService._totalPagesSignal.set(5);
      expect(component.hasNextPage()).toBe(true);

      mockFichajesService._currentPageSignal.set(5);
      expect(component.hasNextPage()).toBe(false);
    });
  });

  describe('formatHours', () => {
    it('should format hours with 2 decimals', () => {
      const result = component.formatHours(8.5);
      expect(result).toBe('8.50h');
    });

    it('should return dash for null hours', () => {
      const result = component.formatHours(null);
      expect(result).toBe('--');
    });
  });

  describe('getElapsedTime', () => {
    it('should calculate elapsed time correctly', () => {
      // Mock the current date to be 2 hours after check-in
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-10-16T10:00:00Z'));

      const testDate = new Date('2025-10-16T08:00:00Z');
      const result = component.getElapsedTime(testDate);
      expect(result).toContain('2');
      expect(result).toContain('h');

      jasmine.clock().uninstall();
    });
  });

  describe('getStatusClass', () => {
    it('should return correct class for valid status with checkOut', () => {
      const completedFichaje = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z') };
      const result = component.getStatusClass(completedFichaje);
      expect(result).toBe('status-valid');
    });

    it('should return correct class for in-progress status', () => {
      const inProgressFichaje = { ...mockFichaje, status: 'valid' as const, checkOut: null };
      const result = component.getStatusClass(inProgressFichaje);
      expect(result).toBe('status-active');
    });

    it('should return correct class for pending correction', () => {
      const pendingFichaje = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z'), status: 'pending_correction' as const };
      const result = component.getStatusClass(pendingFichaje);
      expect(result).toBe('status-pending_correction');
    });

    it('should return correct class for corrected', () => {
      const correctedFichaje = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z'), status: 'corrected' as const };
      const result = component.getStatusClass(correctedFichaje);
      expect(result).toBe('status-corrected');
    });

    it('should return correct class for rejected', () => {
      const rejectedFichaje = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z'), status: 'rejected' as const };
      const result = component.getStatusClass(rejectedFichaje);
      expect(result).toBe('status-rejected');
    });
  });

  describe('getStatusText', () => {
    it('should return correct text for valid status', () => {
      const completedFichaje = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z') };
      const result = component.getStatusText(completedFichaje);
      expect(result).toBe('Válido');
    });

    it('should return correct text for in-progress', () => {
      const result = component.getStatusText(mockFichaje);
      expect(result).toBe('En curso');
    });

    it('should return correct text for pending correction', () => {
      const pendingFichaje = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z'), status: 'pending_correction' as const };
      const result = component.getStatusText(pendingFichaje);
      expect(result).toBe('Corrección pendiente');
    });

    it('should return correct text for corrected', () => {
      const correctedFichaje = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z'), status: 'corrected' as const };
      const result = component.getStatusText(correctedFichaje);
      expect(result).toBe('Corregido');
    });

    it('should return correct text for rejected', () => {
      const rejectedFichaje = { ...mockFichaje, checkOut: new Date('2025-10-16T17:00:00Z'), status: 'rejected' as const };
      const result = component.getStatusText(rejectedFichaje);
      expect(result).toBe('Rechazado');
    });
  });
});
