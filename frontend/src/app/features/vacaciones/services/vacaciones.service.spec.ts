import { TestBed, fakeAsync, tick } from '@angular/core/testing';
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

      await service.goToPage(5); // Out of range

      // Should not make HTTP request
      httpMock.expectNone((r) => r.url.includes('/vacaciones/me'));
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
});
