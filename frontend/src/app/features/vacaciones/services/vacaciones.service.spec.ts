import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VacacionesService } from './vacaciones.service';
import type {
  VacacionApi,
  VacacionListResponseApi,
  VacacionBalanceApi,
  VacacionCreate
} from '@core/models/vacaciones.model';

describe('VacacionesService', () => {
  let service: VacacionesService;
  let httpMock: HttpTestingController;

  const mockVacacionApi: VacacionApi = {
    id: 1,
    user_id: 1,
    user_email: 'test@example.com',
    user_full_name: 'Test User',
    tipo: 'vacation',
    fecha_inicio: '2025-12-20',
    fecha_fin: '2025-12-31',
    dias_solicitados: 10,
    motivo: 'Vacaciones de navidad',
    status: 'pending',
    reviewed_by: null,
    reviewed_by_name: null,
    reviewed_at: null,
    comentarios_revision: null,
    is_pending: true,
    is_approved: false,
    is_active: false,
    created_at: '2025-10-16T10:00:00Z',
    updated_at: '2025-10-16T10:00:00Z'
  };

  const mockVacacionListApi: VacacionListResponseApi = {
    solicitudes: [mockVacacionApi],
    total: 1,
    skip: 0,
    limit: 10
  };

  const mockBalanceApi: VacacionBalanceApi = {
    user_id: 1,
    user_email: 'test@example.com',
    user_full_name: 'Test User',
    dias_anuales: 22,
    dias_disponibles: 7,
    dias_tomados: 5,
    dias_pendientes: 10,
    solicitudes_pendientes: 1,
    solicitudes_aprobadas: 2,
    proximo_periodo: '2026-01-01'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VacacionesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(VacacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createVacacion', () => {
    it('should create vacation request successfully', fakeAsync(async () => {
      const vacacionData: VacacionCreate = {
        tipo: 'vacation',
        fechaInicio: new Date('2025-12-20T00:00:00Z'),
        fechaFin: new Date('2025-12-31T00:00:00Z'),
        motivo: 'Vacaciones de navidad para descansar'
      };

      const createPromise = service.createVacacion(vacacionData);

      const createReq = httpMock.expectOne('http://localhost:8000/api/vacaciones');
      expect(createReq.request.method).toBe('POST');
      expect(createReq.request.body.fecha_inicio).toBe('2025-12-20');
      expect(createReq.request.body.fecha_fin).toBe('2025-12-31');
      expect(createReq.request.body.tipo).toBe('vacation');
      expect(createReq.request.body.motivo).toBe('Vacaciones de navidad para descansar');

      createReq.flush(mockVacacionApi);

      tick();

      // After creating, service should reload list and balance
      const listReq = httpMock.expectOne((r) => r.url.includes('/vacaciones/me') && !r.url.includes('balance'));
      listReq.flush(mockVacacionListApi);

      const balanceReq = httpMock.expectOne((r) => r.url.includes('/vacaciones/me/balance'));
      balanceReq.flush(mockBalanceApi);

      tick();
      const result = await createPromise;

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.tipo).toBe('vacation');
      expect(result.fechaInicio.toISOString()).toContain('2025-12-20');
    }));

    it('should handle create error', async () => {
      const vacacionData: VacacionCreate = {
        tipo: 'vacation',
        fechaInicio: new Date('2025-12-20'),
        fechaFin: new Date('2025-12-31'),
        motivo: 'Motivo con al menos 10 caracteres'
      };

      const createPromise = service.createVacacion(vacacionData);

      const req = httpMock.expectOne('http://localhost:8000/api/vacaciones');
      req.flush({ error: 'No hay días disponibles' }, { status: 400, statusText: 'Bad Request' });

      await expectAsync(createPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('loadVacaciones', () => {
    it('should load vacaciones list', fakeAsync(async () => {
      const loadPromise = service.loadVacaciones();

      const req = httpMock.expectOne((r) => r.url.includes('/vacaciones/me'));
      expect(req.request.method).toBe('GET');

      req.flush(mockVacacionListApi);

      tick();
      await loadPromise;

      expect(service.vacaciones()).toBeDefined();
      expect(service.vacaciones().length).toBe(1);
      expect(service.total()).toBe(1);
    }));

    it('should load vacaciones with query params', fakeAsync(async () => {
      const loadPromise = service.loadVacaciones({
        skip: 10,
        limit: 20,
        status: 'approved',
        tipo: 'vacation'
      });

      const req = httpMock.expectOne((r) => r.url.includes('/vacaciones/me'));

      expect(req.request.params.get('skip')).toBe('10');
      expect(req.request.params.get('limit')).toBe('20');
      expect(req.request.params.get('status')).toBe('approved');
      expect(req.request.params.get('tipo')).toBe('vacation');

      req.flush(mockVacacionListApi);

      tick();
      await loadPromise;

      expect(service.vacaciones()).toBeDefined();
    }));

    it('should handle load error', async () => {
      const loadPromise = service.loadVacaciones();

      const req = httpMock.expectOne((r) => r.url.includes('/vacaciones/me'));
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await expectAsync(loadPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('loadBalance', () => {
    it('should load balance successfully', fakeAsync(async () => {
      const loadPromise = service.loadBalance();

      const req = httpMock.expectOne('http://localhost:8000/api/vacaciones/me/balance');
      expect(req.request.method).toBe('GET');

      req.flush(mockBalanceApi);

      tick();
      await loadPromise;

      expect(service.balance()).toBeDefined();
      expect(service.balance()?.diasAnuales).toBe(22);
      expect(service.balance()?.diasDisponibles).toBe(7);
    }));

    it('should handle balance error gracefully', fakeAsync(async () => {
      const loadPromise = service.loadBalance();

      const req = httpMock.expectOne('http://localhost:8000/api/vacaciones/me/balance');
      req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

      tick();
      await loadPromise;

      // Should set balance to null but not throw error
      expect(service.balance()).toBeNull();
    }));
  });

  describe('goToPage', () => {
    it('should navigate to specified page', fakeAsync(async () => {
      // Setup initial state
      service['totalSignal'].set(50);
      service['pageSizeSignal'].set(10);

      const goToPagePromise = service.goToPage(3);

      const req = httpMock.expectOne((r) => r.url.includes('/vacaciones/me'));

      expect(req.request.params.get('skip')).toBe('20');
      expect(req.request.params.get('limit')).toBe('10');

      const updatedMock = { ...mockVacacionListApi, skip: 20, limit: 10 };
      req.flush(updatedMock);

      tick();
      await goToPagePromise;

      expect(service.currentPage()).toBe(3);
    }));

    it('should not navigate to invalid page', async () => {
      service['totalSignal'].set(10);
      service['pageSizeSignal'].set(10);
      service['currentPageSignal'].set(1);

      await service.goToPage(5); // Out of range

      // Should not make HTTP request
      httpMock.expectNone((r) => r.url.includes('/vacaciones/me'));

      // Page should remain unchanged
      expect(service.currentPage()).toBe(1);
    });
  });

  describe('computed signals', () => {
    it('should compute totalPages correctly', () => {
      service['totalSignal'].set(25);
      service['pageSizeSignal'].set(10);

      expect(service.totalPages()).toBe(3);
    });

    it('should compute hasVacaciones correctly', () => {
      expect(service.hasVacaciones()).toBe(false);

      service['vacacionesSignal'].set([
        {
          id: 1,
          userId: 1,
          userEmail: 'test@example.com',
          userFullName: 'Test User',
          tipo: 'vacation',
          fechaInicio: new Date(),
          fechaFin: new Date(),
          diasSolicitados: 5,
          motivo: 'Motivo de la solicitud con suficientes caracteres',
          status: 'pending',
          reviewedBy: null,
          reviewedByName: null,
          reviewedAt: null,
          comentariosRevision: null,
          isPending: true,
          isApproved: false,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      expect(service.hasVacaciones()).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      service['errorSignal'].set('Test error');
      expect(service.error()).toBe('Test error');

      service.clearError();
      expect(service.error()).toBeNull();
    });
  });

  // ============================================================================
  // TESTS MÉTODOS HR
  // ============================================================================

  describe('HR Methods', () => {
    describe('loadAllSolicitudes', () => {
      it('should load all solicitudes with filters (HR)', fakeAsync(async () => {
        const loadPromise = service.loadAllSolicitudes({
          status: 'pending',
          user_id: 2
        });

        const req = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones') &&
          !r.url.includes('/me') &&
          !r.url.includes('/pending') &&
          r.params.get('status') === 'pending' &&
          r.params.get('user_id') === '2'
        );
        expect(req.request.method).toBe('GET');

        req.flush(mockVacacionListApi);
        tick();

        await loadPromise;

        expect(service.allSolicitudes()).toEqual([
          jasmine.objectContaining({
            id: 1,
            tipo: 'vacation',
            status: 'pending'
          })
        ]);
        expect(service.hrTotal()).toBe(1);
      }));

      it('should handle errors when loading all solicitudes', async () => {
        const loadPromise = service.loadAllSolicitudes();

        const req = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones') &&
          !r.url.includes('/me') &&
          !r.url.includes('/pending')
        );

        req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

        await expectAsync(loadPromise).toBeRejected();
        expect(service.error()).toBeTruthy();
      });
    });

    describe('loadPendingSolicitudes', () => {
      it('should load only pending solicitudes (HR)', fakeAsync(async () => {
        const loadPromise = service.loadPendingSolicitudes();

        const req = httpMock.expectOne((r) => r.url.includes('/vacaciones/pending'));
        expect(req.request.method).toBe('GET');

        req.flush(mockVacacionListApi);
        tick();

        await loadPromise;

        expect(service.pendingSolicitudes()).toEqual([
          jasmine.objectContaining({
            id: 1,
            status: 'pending',
            isPending: true
          })
        ]);
        expect(service.hasPendingSolicitudes()).toBe(true);
        expect(service.pendingCount()).toBe(1);
      }));
    });

    describe('reviewSolicitud', () => {
      it('should approve solicitud successfully (HR)', fakeAsync(async () => {
        const approvedVacacionApi: VacacionApi = {
          ...mockVacacionApi,
          status: 'approved',
          is_approved: true,
          is_pending: false,
          reviewed_by: 3,
          reviewed_by_name: 'HR Manager',
          reviewed_at: '2025-10-16T12:00:00Z',
          comentarios_revision: 'Aprobado'
        };

        const review = {
          approved: true,
          comentariosRevision: 'Aprobado'
        };

        const reviewPromise = service.reviewSolicitud(1, review);

        const reviewReq = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones/1/review')
        );
        expect(reviewReq.request.method).toBe('POST');
        expect(reviewReq.request.body).toEqual({
          approved: true,
          comentarios_revision: 'Aprobado'
        });

        reviewReq.flush(approvedVacacionApi);
        tick();

        // Expect auto-reload
        const allReq = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones') &&
          !r.url.includes('/me') &&
          !r.url.includes('/pending')
        );
        allReq.flush(mockVacacionListApi);

        const pendingReq = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones/pending')
        );
        pendingReq.flush({ ...mockVacacionListApi, solicitudes: [] });

        tick();

        const result = await reviewPromise;

        expect(result.status).toBe('approved');
        expect(result.isApproved).toBe(true);
        expect(result.comentariosRevision).toBe('Aprobado');
      }));

      it('should reject solicitud with comments (HR)', fakeAsync(async () => {
        const rejectedVacacionApi: VacacionApi = {
          ...mockVacacionApi,
          status: 'rejected',
          is_approved: false,
          is_pending: false,
          reviewed_by: 3,
          reviewed_by_name: 'HR Manager',
          reviewed_at: '2025-10-16T12:00:00Z',
          comentarios_revision: 'Rechazado por falta de disponibilidad'
        };

        const review = {
          approved: false,
          comentariosRevision: 'Rechazado por falta de disponibilidad'
        };

        const reviewPromise = service.reviewSolicitud(1, review);

        const reviewReq = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones/1/review')
        );
        expect(reviewReq.request.body.approved).toBe(false);
        expect(reviewReq.request.body.comentarios_revision).toBe('Rechazado por falta de disponibilidad');

        reviewReq.flush(rejectedVacacionApi);
        tick();

        // Expect auto-reload
        const allReq = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones') &&
          !r.url.includes('/me') &&
          !r.url.includes('/pending')
        );
        allReq.flush(mockVacacionListApi);

        const pendingReq = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones/pending')
        );
        pendingReq.flush({ ...mockVacacionListApi, solicitudes: [] });

        tick();

        const result = await reviewPromise;

        expect(result.status).toBe('rejected');
        expect(result.comentariosRevision).toBe('Rechazado por falta de disponibilidad');
      }));
    });

    describe('loadUserBalance', () => {
      it('should load balance for any user (HR)', fakeAsync(async () => {
        const userBalanceApi: VacacionBalanceApi = {
          ...mockBalanceApi,
          user_id: 5,
          user_email: 'employee@example.com',
          user_full_name: 'Employee Name'
        };

        const loadPromise = service.loadUserBalance(5);

        const req = httpMock.expectOne((r) => r.url.includes('/vacaciones/balance/5'));
        expect(req.request.method).toBe('GET');

        req.flush(userBalanceApi);
        tick();

        await loadPromise;

        expect(service.userBalance()).toEqual(
          jasmine.objectContaining({
            userId: 5,
            userEmail: 'employee@example.com',
            userFullName: 'Employee Name'
          })
        );
      }));
    });

    describe('goToHrPage', () => {
      it('should navigate to specific HR page', fakeAsync(async () => {
        // Setup initial state
        service['hrTotalSignal'].set(25);
        service['hrPageSizeSignal'].set(10);
        service['hrCurrentPageSignal'].set(1);

        const goToPagePromise = service.goToHrPage(2);

        const req = httpMock.expectOne((r) =>
          r.url.includes('/vacaciones') &&
          !r.url.includes('/me') &&
          !r.url.includes('/pending') &&
          r.params.get('skip') === '10' &&
          r.params.get('limit') === '10'
        );

        // Simular respuesta del backend con skip=10, limit=10
        const response = {
          ...mockVacacionListApi,
          skip: 10,
          limit: 10
        };

        req.flush(response);
        tick();

        await goToPagePromise;

        expect(service.hrCurrentPage()).toBe(2);
      }));

      it('should not navigate to invalid page', fakeAsync(async () => {
        service['hrTotalSignal'].set(10);
        service['hrPageSizeSignal'].set(10);
        service['hrCurrentPageSignal'].set(1);

        const goToPagePromise = service.goToHrPage(5); // Invalid, only 1 page
        tick();

        await goToPagePromise;

        // No debe hacer ninguna petición HTTP
        httpMock.expectNone((r) => r.url.includes('/vacaciones'));

        // La página no debe cambiar
        expect(service.hrCurrentPage()).toBe(1);
      }));
    });
  });
});
