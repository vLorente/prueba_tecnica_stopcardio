import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FichajesService } from './fichajes.service';
import type { FichajeApi, FichajeListResponseApi } from '@core/models/fichaje.model';

describe('FichajesService', () => {
  let service: FichajesService;
  let httpMock: HttpTestingController;

  const mockFichajeApi: FichajeApi = {
    id: 1,
    user_id: 1,
    user_email: 'test@example.com',
    user_full_name: 'Test User',
    check_in: '2025-10-16T08:00:00Z',
    check_out: null,
    hours_worked: null,
    status: 'valid',
    notes: null,
    correction_reason: null,
    correction_requested_at: null,
    approved_by: null,
    approved_at: null,
    approval_notes: null,
    created_at: '2025-10-16T08:00:00Z',
    updated_at: '2025-10-16T08:00:00Z'
  };

  const mockFichajeListApi: FichajeListResponseApi = {
    fichajes: [mockFichajeApi],
    total: 1,
    page: 1,
    page_size: 10,
    total_hours: 8.0
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FichajesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(FichajesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkIn', () => {
    it('should register check-in successfully', fakeAsync(async () => {
      const checkInPromise = service.checkIn({ notes: 'Test note' });

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/check-in');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ notes: 'Test note' });

      req.flush(mockFichajeApi);

      tick();

      // Expect loadFichajes to be called after check-in
      const listReq = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      listReq.flush(mockFichajeListApi);

      tick();
      const result = await checkInPromise;

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(service.fichajeActivo()).toBeTruthy();
    }));

    it('should handle check-in error', async () => {
      const checkInPromise = service.checkIn();

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/check-in');
      req.flush({ error: 'Ya tienes un fichaje activo' }, { status: 400, statusText: 'Bad Request' });

      await expectAsync(checkInPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('checkOut', () => {
    it('should register check-out successfully', fakeAsync(async () => {
      const fichajeCompleted = { ...mockFichajeApi, check_out: '2025-10-16T17:00:00Z', hours_worked: 9.0 };

      const checkOutPromise = service.checkOut({ notes: 'Finished work' });

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/check-out');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ notes: 'Finished work' });

      req.flush(fichajeCompleted);

      tick();

      // Expect loadFichajes to be called after check-out
      const listReq = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      listReq.flush(mockFichajeListApi);

      tick();
      const result = await checkOutPromise;

      expect(result).toBeDefined();
      expect(result.checkOut).toEqual(new Date('2025-10-16T17:00:00Z'));
      expect(service.fichajeActivo()).toBeNull();
    }));

    it('should handle check-out error', async () => {
      const checkOutPromise = service.checkOut();

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/check-out');
      req.flush({ error: 'No tienes un fichaje activo' }, { status: 400, statusText: 'Bad Request' });

      await expectAsync(checkOutPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('loadFichajeActivo', () => {
    it('should load active fichaje', async () => {
      const loadPromise = service.loadFichajeActivo();

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/me/active');
      expect(req.request.method).toBe('GET');

      req.flush(mockFichajeApi);

      await loadPromise;

      expect(service.fichajeActivo()).toBeTruthy();
      expect(service.fichajeActivo()?.id).toBe(1);
    });

    it('should set null when no active fichaje', async () => {
      const loadPromise = service.loadFichajeActivo();

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/me/active');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      await loadPromise;

      expect(service.fichajeActivo()).toBeNull();
    });
  });

  describe('loadFichajes', () => {
    it('should load fichajes list', async () => {
      const loadPromise = service.loadFichajes();

      const req = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      expect(req.request.method).toBe('GET');

      req.flush(mockFichajeListApi);

      await loadPromise;

      expect(service.fichajes().length).toBe(1);
      expect(service.total()).toBe(1);
      expect(service.totalHours()).toBe(8.0);
    });

    it('should load fichajes with query params', fakeAsync(async () => {
      const loadPromise = service.loadFichajes({
        skip: 10,
        limit: 20,
        dateFrom: '2025-10-01',
        dateTo: '2025-10-31'
      });

      // Use match() to get all requests and then verify
      const req = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));

      expect(req.request.params.get('skip')).toBe('10');
      expect(req.request.params.get('limit')).toBe('20');
      expect(req.request.params.get('date_from')).toBe('2025-10-01');
      expect(req.request.params.get('date_to')).toBe('2025-10-31');

      req.flush(mockFichajeListApi);

      tick();
      await loadPromise;

      expect(service.fichajes()).toBeDefined();
    }));

    it('should handle load error', async () => {
      const loadPromise = service.loadFichajes();

      const req = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await expectAsync(loadPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('goToPage', () => {
    it('should navigate to specified page', fakeAsync(async () => {
      // Setup initial state
      service['totalSignal'].set(50);
      service['pageSizeSignal'].set(10);

      const goToPagePromise = service.goToPage(3);

      const req = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));

      expect(req.request.params.get('skip')).toBe('20');
      expect(req.request.params.get('limit')).toBe('10');

      // Mock response with page 3
      const page3Response = { ...mockFichajeListApi, page: 3 };
      req.flush(page3Response);

      tick();
      await goToPagePromise;

      expect(service.currentPage()).toBe(3);
    }));

    it('should not navigate to invalid page', async () => {
      service['totalSignal'].set(10);
      service['pageSizeSignal'].set(10);

      await service.goToPage(5); // Out of range

      httpMock.expectNone((r) => r.url.includes('/fichajes/me'));
      expect(service.currentPage()).toBe(1); // Should remain on page 1
    });
  });

  describe('computed signals', () => {
    it('should calculate total pages correctly', () => {
      service['totalSignal'].set(25);
      service['pageSizeSignal'].set(10);

      expect(service.totalPages()).toBe(3);
    });

    it('should indicate if has active fichaje', () => {
      expect(service.hasFichajeActivo()).toBe(false);

      service['fichajeActivoSignal'].set({
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
        approvedBy: null,
        approvedAt: null,
        approvalNotes: null,
        createdAt: new Date('2025-10-16T08:00:00Z'),
        updatedAt: new Date('2025-10-16T08:00:00Z')
      });

      expect(service.hasFichajeActivo()).toBe(true);
    });

    it('should return latest fichaje', () => {
      service['fichajesSignal'].set([
        {
          id: 2,
          userId: 1,
          userEmail: 'test@example.com',
          userFullName: 'Test User',
          checkIn: new Date('2025-10-16T08:00:00Z'),
          checkOut: new Date('2025-10-16T17:00:00Z'),
          hoursWorked: 9.0,
          status: 'valid',
          notes: null,
          correctionReason: null,
          correctionRequestedAt: null,
          approvedBy: null,
          approvedAt: null,
          approvalNotes: null,
          createdAt: new Date('2025-10-16T08:00:00Z'),
          updatedAt: new Date('2025-10-16T17:00:00Z')
        }
      ]);

      const ultimo = service.ultimoFichaje();
      expect(ultimo).toBeTruthy();
      expect(ultimo?.id).toBe(2);
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

  describe('solicitarCorreccion', () => {
    it('should request correction successfully', fakeAsync(async () => {
      const correction = {
        checkIn: new Date('2025-10-16T08:30:00Z'),
        checkOut: new Date('2025-10-16T17:30:00Z'),
        correctionReason: 'Olvidé fichar a la hora correcta'
      };

      const correctedFichaje = {
        ...mockFichajeApi,
        status: 'pending_correction' as const,
        correction_reason: correction.correctionReason,
        correction_requested_at: '2025-10-16T10:00:00Z'
      };

      const correctionPromise = service.solicitarCorreccion(1, correction);

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/1/correct');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        check_in: '2025-10-16T08:30:00.000Z',
        check_out: '2025-10-16T17:30:00.000Z',
        correction_reason: correction.correctionReason
      });

      req.flush(correctedFichaje);

      tick();

      // Expect loadFichajes to be called after correction
      const listReq = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      listReq.flush(mockFichajeListApi);

      tick();
      const result = await correctionPromise;

      expect(result).toBeDefined();
      expect(result.status).toBe('pending_correction');
      expect(result.correctionReason).toBe(correction.correctionReason);
    }));

    it('should handle correction error', async () => {
      const correction = {
        checkIn: new Date('2025-10-16T08:30:00Z'),
        correctionReason: 'Test reason'
      };

      const correctionPromise = service.solicitarCorreccion(1, correction);

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/1/correct');
      req.flush(
        { error: 'No se puede solicitar corrección' },
        { status: 400, statusText: 'Bad Request' }
      );

      await expectAsync(correctionPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('aprobarCorreccion', () => {
    it('should approve correction successfully', fakeAsync(async () => {
      const approvedFichaje = {
        ...mockFichajeApi,
        status: 'corrected' as const,
        approved_by: 2,
        approved_at: '2025-10-16T12:00:00Z',
        approval_notes: 'Aprobado correctamente'
      };

      const approvePromise = service.aprobarCorreccion(1, 'Aprobado correctamente');

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/1/approve');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        approved: true,
        approval_notes: 'Aprobado correctamente'
      });

      req.flush(approvedFichaje);

      tick();

      // Expect loadFichajes to be called after approval
      const listReq = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      listReq.flush(mockFichajeListApi);

      tick();
      const result = await approvePromise;

      expect(result).toBeDefined();
      expect(result.status).toBe('corrected');
      expect(result.approvalNotes).toBe('Aprobado correctamente');
    }));

    it('should approve correction without notes', fakeAsync(async () => {
      const approvedFichaje = {
        ...mockFichajeApi,
        status: 'corrected' as const,
        approved_by: 2,
        approved_at: '2025-10-16T12:00:00Z',
        approval_notes: null
      };

      const approvePromise = service.aprobarCorreccion(1);

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/1/approve');
      expect(req.request.body).toEqual({
        approved: true,
        approval_notes: undefined
      });

      req.flush(approvedFichaje);

      tick();

      const listReq = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      listReq.flush(mockFichajeListApi);

      tick();
      await approvePromise;
    }));

    it('should handle approval error', async () => {
      const approvePromise = service.aprobarCorreccion(1);

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/1/approve');
      req.flush(
        { error: 'No tienes permisos' },
        { status: 403, statusText: 'Forbidden' }
      );

      await expectAsync(approvePromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('rechazarCorreccion', () => {
    it('should reject correction successfully', fakeAsync(async () => {
      const rejectedFichaje = {
        ...mockFichajeApi,
        status: 'rejected' as const,
        approved_by: 2,
        approved_at: '2025-10-16T12:00:00Z',
        approval_notes: 'Rechazado: datos incorrectos'
      };

      const rejectPromise = service.rechazarCorreccion(1, 'Rechazado: datos incorrectos');

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/1/approve');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        approved: false,
        approval_notes: 'Rechazado: datos incorrectos'
      });

      req.flush(rejectedFichaje);

      tick();

      // Expect loadFichajes to be called after rejection
      const listReq = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      listReq.flush(mockFichajeListApi);

      tick();
      const result = await rejectPromise;

      expect(result).toBeDefined();
      expect(result.status).toBe('rejected');
      expect(result.approvalNotes).toBe('Rechazado: datos incorrectos');
    }));

    it('should reject correction without notes', fakeAsync(async () => {
      const rejectedFichaje = {
        ...mockFichajeApi,
        status: 'rejected' as const,
        approved_by: 2,
        approved_at: '2025-10-16T12:00:00Z',
        approval_notes: null
      };

      const rejectPromise = service.rechazarCorreccion(1);

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/1/approve');
      expect(req.request.body).toEqual({
        approved: false,
        approval_notes: undefined
      });

      req.flush(rejectedFichaje);

      tick();

      const listReq = httpMock.expectOne((r) => r.url.includes('/fichajes/me'));
      listReq.flush(mockFichajeListApi);

      tick();
      await rejectPromise;
    }));

    it('should handle rejection error', async () => {
      const rejectPromise = service.rechazarCorreccion(1);

      const req = httpMock.expectOne('http://localhost:8000/api/fichajes/1/approve');
      req.flush(
        { error: 'No tienes permisos' },
        { status: 403, statusText: 'Forbidden' }
      );

      await expectAsync(rejectPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });
});

