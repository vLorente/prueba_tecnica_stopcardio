import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, computed } from '@angular/core';
import { VacacionesComponent } from './vacaciones.component';
import { VacacionesService } from './services/vacaciones.service';
import type { Vacacion, VacacionBalance } from '@core/models/vacaciones.model';

describe('VacacionesComponent', () => {
  let component: VacacionesComponent;
  let fixture: ComponentFixture<VacacionesComponent>;
  let mockVacacionesService: any;

  const mockVacacion: Vacacion = {
    id: 1,
    userId: 1,
    userEmail: 'test@example.com',
    userFullName: 'Test User',
    tipo: 'vacation',
    fechaInicio: new Date('2025-12-20T00:00:00Z'),
    fechaFin: new Date('2025-12-31T00:00:00Z'),
    diasSolicitados: 10,
    motivo: 'Vacaciones de navidad para descansar con la familia',
    status: 'pending',
    reviewedBy: null,
    reviewedByName: null,
    reviewedAt: null,
    comentariosRevision: null,
    isPending: true,
    isApproved: false,
    isActive: false,
    createdAt: new Date('2025-10-16T10:00:00Z'),
    updatedAt: new Date('2025-10-16T10:00:00Z')
  };

  const mockBalance: VacacionBalance = {
    userId: 1,
    userEmail: 'test@example.com',
    userFullName: 'Test User',
    diasAnuales: 22,
    diasDisponibles: 7,
    diasTomados: 5,
    diasPendientes: 10,
    solicitudesPendientes: 1,
    solicitudesAprobadas: 2,
    proximoPeriodo: new Date('2026-01-01T00:00:00Z')
  };

  beforeEach(async () => {
    // Create writable signals
    const vacacionesSignal = signal<Vacacion[]>([]);
    const balanceSignal = signal<VacacionBalance | null>(null);
    const loadingSignal = signal(false);
    const errorSignal = signal<string | null>(null);
    const currentPageSignal = signal(1);
    const totalPagesSignal = signal(0);

    mockVacacionesService = {
      createVacacion: jasmine.createSpy('createVacacion'),
      loadVacaciones: jasmine.createSpy('loadVacaciones'),
      loadBalance: jasmine.createSpy('loadBalance'),
      goToPage: jasmine.createSpy('goToPage'),
      clearError: jasmine.createSpy('clearError'),
      vacaciones: vacacionesSignal.asReadonly(),
      balance: balanceSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      error: errorSignal.asReadonly(),
      currentPage: currentPageSignal.asReadonly(),
      totalPages: totalPagesSignal.asReadonly(),
      hasVacaciones: computed(() => vacacionesSignal().length > 0),
      // Expose writable signals for testing
      _vacacionesSignal: vacacionesSignal,
      _balanceSignal: balanceSignal,
      _loadingSignal: loadingSignal,
      _errorSignal: errorSignal,
      _currentPageSignal: currentPageSignal,
      _totalPagesSignal: totalPagesSignal
    };

    await TestBed.configureTestingModule({
      imports: [VacacionesComponent, ReactiveFormsModule],
      providers: [
        { provide: VacacionesService, useValue: mockVacacionesService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VacacionesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', fakeAsync(() => {
    mockVacacionesService.loadBalance.and.returnValue(Promise.resolve());
    mockVacacionesService.loadVacaciones.and.returnValue(Promise.resolve());

    fixture.detectChanges(); // triggers ngOnInit
    tick();

    expect(mockVacacionesService.loadBalance).toHaveBeenCalled();
    expect(mockVacacionesService.loadVacaciones).toHaveBeenCalled();
  }));

  describe('Form validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create form with default values', () => {
      expect(component.vacacionForm).toBeDefined();
      expect(component.vacacionForm.get('tipo')?.value).toBe('vacation');
      expect(component.vacacionForm.get('fechaInicio')?.value).toBe('');
      expect(component.vacacionForm.get('fechaFin')?.value).toBe('');
      expect(component.vacacionForm.get('motivo')?.value).toBe('');
    });

    it('should have required validators', () => {
      const form = component.vacacionForm;

      expect(form.get('tipo')?.hasError('required')).toBe(false); // Has default value
      expect(form.get('fechaInicio')?.hasError('required')).toBe(true);
      expect(form.get('fechaFin')?.hasError('required')).toBe(true);
      expect(form.get('motivo')?.hasError('required')).toBe(true);
    });

    it('should validate motivo min length', () => {
      const motivoControl = component.vacacionForm.get('motivo');
      motivoControl?.setValue('corto');

      expect(motivoControl?.hasError('minlength')).toBe(true);
    });

    it('should validate motivo max length', () => {
      const motivoControl = component.vacacionForm.get('motivo');
      const longText = 'a'.repeat(1001);
      motivoControl?.setValue(longText);

      expect(motivoControl?.hasError('maxlength')).toBe(true);
    });

    it('should be valid with correct data', () => {
      component.vacacionForm.patchValue({
        tipo: 'vacation',
        fechaInicio: '2025-12-20',
        fechaFin: '2025-12-31',
        motivo: 'Vacaciones de navidad para descansar con la familia'
      });

      expect(component.vacacionForm.valid).toBe(true);
    });
  });

  describe('toggleForm', () => {
    it('should toggle form visibility', () => {
      expect(component.showForm()).toBe(false);

      component.toggleForm();
      expect(component.showForm()).toBe(true);

      component.toggleForm();
      expect(component.showForm()).toBe(false);
    });

    it('should reset form when hiding', () => {
      component.vacacionForm.patchValue({
        tipo: 'sick_leave',
        fechaInicio: '2025-12-20',
        fechaFin: '2025-12-31',
        motivo: 'Motivo de prueba con suficientes caracteres'
      });

      component.showForm.set(true);
      component.toggleForm(); // Hide

      expect(component.vacacionForm.get('tipo')?.value).toBe('vacation');
      expect(component.vacacionForm.get('fechaInicio')?.value).toBeNull();
      expect(component.vacacionForm.get('fechaFin')?.value).toBeNull();
      expect(component.vacacionForm.get('motivo')?.value).toBeNull();
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.vacacionForm.patchValue({
        tipo: 'vacation',
        fechaInicio: '2025-12-20',
        fechaFin: '2025-12-31',
        motivo: 'Vacaciones de navidad para descansar con la familia'
      });
      component.showForm.set(true);
    });

    it('should submit form with valid data', fakeAsync(async () => {
      mockVacacionesService.createVacacion.and.returnValue(Promise.resolve(mockVacacion));

      const submitPromise = component.onSubmit();
      tick();
      await submitPromise;

      expect(mockVacacionesService.createVacacion).toHaveBeenCalled();
      const callArgs = mockVacacionesService.createVacacion.calls.mostRecent().args[0];
      expect(callArgs.tipo).toBe('vacation');
      expect(callArgs.motivo).toBe('Vacaciones de navidad para descansar con la familia');
      expect(component.showForm()).toBe(false);
      expect(component.submitting()).toBe(false);
    }));

    it('should not submit if form is invalid', fakeAsync(async () => {
      component.vacacionForm.patchValue({ motivo: '' });

      const submitPromise = component.onSubmit();
      tick();
      await submitPromise;

      expect(mockVacacionesService.createVacacion).not.toHaveBeenCalled();
    }));

    it('should not submit if already submitting', fakeAsync(async () => {
      component.submitting.set(true);

      const submitPromise = component.onSubmit();
      tick();
      await submitPromise;

      expect(mockVacacionesService.createVacacion).not.toHaveBeenCalled();
    }));

    it('should not submit if end date is before start date', fakeAsync(async () => {
      component.vacacionForm.patchValue({
        fechaInicio: '2025-12-31',
        fechaFin: '2025-12-20'
      });

      const submitPromise = component.onSubmit();
      tick();
      await submitPromise;

      expect(mockVacacionesService.createVacacion).not.toHaveBeenCalled();
    }));

    it('should handle submission error', fakeAsync(async () => {
      mockVacacionesService.createVacacion.and.returnValue(Promise.reject(new Error('Error')));

      const submitPromise = component.onSubmit();
      tick();
      await submitPromise;

      expect(component.submitting()).toBe(false);
    }));

    it('should reset form after successful submission', fakeAsync(async () => {
      mockVacacionesService.createVacacion.and.returnValue(Promise.resolve(mockVacacion));

      const submitPromise = component.onSubmit();
      tick();
      await submitPromise;

      expect(component.vacacionForm.get('tipo')?.value).toBe('vacation');
      expect(component.vacacionForm.get('fechaInicio')?.value).toBeNull();
      expect(component.vacacionForm.get('fechaFin')?.value).toBeNull();
      expect(component.vacacionForm.get('motivo')?.value).toBeNull();
    }));
  });

  describe('pagination', () => {
    beforeEach(() => {
      mockVacacionesService._currentPageSignal.set(2);
      mockVacacionesService._totalPagesSignal.set(5);
      mockVacacionesService.goToPage.and.returnValue(Promise.resolve());
    });

    it('should go to previous page', fakeAsync(async () => {
      const pagePromise = component.onPreviousPage();
      tick();
      await pagePromise;

      expect(mockVacacionesService.goToPage).toHaveBeenCalledWith(1);
    }));

    it('should not go to previous page if on first page', fakeAsync(async () => {
      mockVacacionesService._currentPageSignal.set(1);

      const pagePromise = component.onPreviousPage();
      tick();
      await pagePromise;

      expect(mockVacacionesService.goToPage).not.toHaveBeenCalled();
    }));

    it('should go to next page', fakeAsync(async () => {
      const pagePromise = component.onNextPage();
      tick();
      await pagePromise;

      expect(mockVacacionesService.goToPage).toHaveBeenCalledWith(3);
    }));

    it('should not go to next page if on last page', fakeAsync(async () => {
      mockVacacionesService._currentPageSignal.set(5);

      const pagePromise = component.onNextPage();
      tick();
      await pagePromise;

      expect(mockVacacionesService.goToPage).not.toHaveBeenCalled();
    }));

    it('should compute hasPrevPage correctly', () => {
      mockVacacionesService._currentPageSignal.set(2);
      expect(component.hasPrevPage()).toBe(true);

      mockVacacionesService._currentPageSignal.set(1);
      expect(component.hasPrevPage()).toBe(false);
    });

    it('should compute hasNextPage correctly', () => {
      mockVacacionesService._currentPageSignal.set(4);
      mockVacacionesService._totalPagesSignal.set(5);
      expect(component.hasNextPage()).toBe(true);

      mockVacacionesService._currentPageSignal.set(5);
      expect(component.hasNextPage()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should call clearError on service', () => {
      component.onCloseError();

      expect(mockVacacionesService.clearError).toHaveBeenCalled();
    });
  });

  describe('getEstadoClass', () => {
    it('should return correct class for pending status', () => {
      const result = component.getEstadoClass(mockVacacion);
      expect(result).toBe('status-pending');
    });

    it('should return correct class for approved status', () => {
      const approvedVacacion = { ...mockVacacion, status: 'approved' as const };
      const result = component.getEstadoClass(approvedVacacion);
      expect(result).toBe('status-approved');
    });

    it('should return correct class for rejected status', () => {
      const rejectedVacacion = { ...mockVacacion, status: 'rejected' as const };
      const result = component.getEstadoClass(rejectedVacacion);
      expect(result).toBe('status-rejected');
    });

    it('should return correct class for cancelled status', () => {
      const cancelledVacacion = { ...mockVacacion, status: 'cancelled' as const };
      const result = component.getEstadoClass(cancelledVacacion);
      expect(result).toBe('status-cancelled');
    });
  });

  describe('balance calculations', () => {
    beforeEach(() => {
      mockVacacionesService._balanceSignal.set(mockBalance);
    });

    it('should calculate usage percentage correctly', () => {
      const result = component.getUsagePercentage();
      expect(result).toBe(Math.round((5 / 22) * 100)); // diasTomados / diasAnuales
    });

    it('should return 0 if balance is null', () => {
      mockVacacionesService._balanceSignal.set(null);

      const result = component.getUsagePercentage();
      expect(result).toBe(0);
    });

    it('should return 0 if diasAnuales is 0', () => {
      mockVacacionesService._balanceSignal.set({ ...mockBalance, diasAnuales: 0 });

      const result = component.getUsagePercentage();
      expect(result).toBe(0);
    });

    it('should return success class for low usage', () => {
      mockVacacionesService._balanceSignal.set({ ...mockBalance, diasTomados: 5, diasAnuales: 22 }); // ~23%

      const result = component.getProgressClass();
      expect(result).toBe('progress-success');
    });

    it('should return warning class for medium usage', () => {
      mockVacacionesService._balanceSignal.set({ ...mockBalance, diasTomados: 16, diasAnuales: 22 }); // ~73%

      const result = component.getProgressClass();
      expect(result).toBe('progress-warning');
    });

    it('should return danger class for high usage', () => {
      mockVacacionesService._balanceSignal.set({ ...mockBalance, diasTomados: 20, diasAnuales: 22 }); // ~91%

      const result = component.getProgressClass();
      expect(result).toBe('progress-danger');
    });
  });
});
