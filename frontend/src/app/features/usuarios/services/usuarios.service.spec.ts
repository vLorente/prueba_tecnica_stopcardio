import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuariosService } from './usuarios.service';
import type { User, UserApi, UserListApiResponse } from '@core/models/user.model';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let httpMock: HttpTestingController;

  const mockUserApi: UserApi = {
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'employee',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'employee',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z')
  };

  const mockUserListApi: UserListApiResponse = {
    users: [mockUserApi],
    total: 1,
    page: 1,
    page_size: 10
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UsuariosService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UsuariosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadUsers', () => {
    it('should load users successfully', fakeAsync(async () => {
      const loadPromise = service.loadUsers();

      const req = httpMock.expectOne((r) => r.url.includes('/api/users'));
      expect(req.request.method).toBe('GET');

      req.flush(mockUserListApi);
      tick();
      await loadPromise;

      expect(service.users().length).toBe(1);
      expect(service.total()).toBe(1);
    }));

    it('should load users with pagination', fakeAsync(async () => {
      const loadPromise = service.loadUsers({ skip: 10, limit: 20 });

      const req = httpMock.expectOne((r) => r.url.includes('/api/users'));

      expect(req.request.params.get('skip')).toBe('10');
      expect(req.request.params.get('limit')).toBe('20');

      req.flush(mockUserListApi);
      tick();
      await loadPromise;

      expect(service.users()).toBeDefined();
    }));

    it('should handle load error', async () => {
      // Suppress console.error for this test
      spyOn(console, 'error');

      const loadPromise = service.loadUsers();

      const req = httpMock.expectOne((r) => r.url.includes('/api/users'));
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await expectAsync(loadPromise).toBeRejected();

      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should get user by id successfully', fakeAsync(async () => {
      const getUserPromise = service.getUserById(1);

      const req = httpMock.expectOne('http://localhost:8000/api/users/1');
      expect(req.request.method).toBe('GET');

      req.flush(mockUserApi);

      tick();
      const result = await getUserPromise;

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.email).toBe('test@example.com');
    }));

    it('should handle get user error', async () => {
      const getUserPromise = service.getUserById(999);

      const req = httpMock.expectOne('http://localhost:8000/api/users/999');
      req.flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });

      await expectAsync(getUserPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('createUser', () => {
    it('should create user successfully', fakeAsync(async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
        role: 'employee' as const,
        isActive: true
      };

      const createPromise = service.createUser(userData);

      const createReq = httpMock.expectOne((r) => r.url.includes('/api/users') && r.method === 'POST');
      expect(createReq.request.body.email).toBe('new@example.com');
      expect(createReq.request.body.full_name).toBe('New User');

      createReq.flush(mockUserApi);
      tick();

      // After creating, service should reload list
      const listReq = httpMock.expectOne((r) => r.url.includes('/api/users') && r.method === 'GET');
      listReq.flush(mockUserListApi);
      tick();

      const result = await createPromise;

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    }));

    it('should handle create error', async () => {
      spyOn(console, 'error');

      const userData = {
        email: 'invalid@example.com',
        password: 'short',
        fullName: 'Invalid User',
        role: 'employee' as const,
        isActive: true
      };

      const createPromise = service.createUser(userData);

      const req = httpMock.expectOne((r) => r.url.includes('/api/users') && r.method === 'POST');
      req.flush({ error: 'Validation error' }, { status: 400, statusText: 'Bad Request' });

      await expectAsync(createPromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', fakeAsync(async () => {
      // Initialize with a user in the list
      service['usersSignal'].set([mockUser]);

      const updateData = {
        fullName: 'Updated Name',
        role: 'hr' as const,
        isActive: true
      };

      const updatePromise = service.updateUser(1, updateData);

      const updateReq = httpMock.expectOne('http://localhost:8000/api/users/1');
      expect(updateReq.request.method).toBe('PUT');
      expect(updateReq.request.body.full_name).toBe('Updated Name');
      expect(updateReq.request.body.role).toBe('hr');

      const updatedUserApi = { ...mockUserApi, full_name: 'Updated Name', role: 'hr' as const };
      updateReq.flush(updatedUserApi);
      tick();

      const result = await updatePromise;

      expect(result).toBeDefined();
      expect(result.fullName).toBe('Updated Name');
      expect(result.role).toBe('hr');
      // Verify it updated in local list
      expect(service.users()[0].fullName).toBe('Updated Name');
    }));

    it('should handle update error', async () => {
      spyOn(console, 'error');

      const updateData = {
        fullName: 'Updated Name',
        role: 'employee' as const,
        isActive: true
      };

      const updatePromise = service.updateUser(999, updateData);

      const req = httpMock.expectOne('http://localhost:8000/api/users/999');
      req.flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });

      await expectAsync(updatePromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', fakeAsync(async () => {
      // Initialize with users in the list
      service['usersSignal'].set([mockUser]);
      service['totalSignal'].set(1);

      const deletePromise = service.deleteUser(1);

      const deleteReq = httpMock.expectOne('http://localhost:8000/api/users/1');
      expect(deleteReq.request.method).toBe('DELETE');

      deleteReq.flush({});
      tick();

      await deletePromise;

      expect(service.users().length).toBe(0);
      expect(service.total()).toBe(0);
    }));

    it('should handle delete error', async () => {
      spyOn(console, 'error');

      const deletePromise = service.deleteUser(999);

      const req = httpMock.expectOne('http://localhost:8000/api/users/999');
      req.flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });

      await expectAsync(deletePromise).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('pagination', () => {
    it('should navigate to next page', fakeAsync(async () => {
      service['totalSignal'].set(30);
      service['pageSizeSignal'].set(10);
      service['currentPageSignal'].set(1);

      const nextPagePromise = service.nextPage();

      const req = httpMock.expectOne((r) => r.url.includes('/api/users'));
      expect(req.request.params.get('skip')).toBe('10');
      expect(req.request.params.get('limit')).toBe('10');

      req.flush(mockUserListApi);
      tick();

      await nextPagePromise;

      expect(service.currentPage()).toBe(1); // page is updated by the response
    }));

    it('should navigate to previous page', fakeAsync(async () => {
      service['totalSignal'].set(30);
      service['pageSizeSignal'].set(10);
      service['currentPageSignal'].set(2);

      const prevPagePromise = service.previousPage();

      const req = httpMock.expectOne((r) => r.url.includes('/api/users'));
      expect(req.request.params.get('skip')).toBe('0');
      expect(req.request.params.get('limit')).toBe('10');

      req.flush(mockUserListApi);
      tick();

      await prevPagePromise;

      expect(service.currentPage()).toBe(1);
    }));

    it('should navigate to specific page', fakeAsync(async () => {
      service['totalSignal'].set(50);
      service['pageSizeSignal'].set(10);

      const goToPagePromise = service.goToPage(3);

      const req = httpMock.expectOne((r) => r.url.includes('/api/users'));
      expect(req.request.params.get('skip')).toBe('20');
      expect(req.request.params.get('limit')).toBe('10');

      req.flush(mockUserListApi);
      tick();

      await goToPagePromise;

      expect(service.currentPage()).toBe(1); // page is updated by the response
    }));

    it('should not navigate to invalid page', async () => {
      service['totalSignal'].set(10);
      service['pageSizeSignal'].set(10);
      service['currentPageSignal'].set(1);

      await service.goToPage(5);

      httpMock.expectNone((r) => r.url.includes('/api/users'));
      expect(service.currentPage()).toBe(1);
    });

    it('should change page size', fakeAsync(async () => {
      const changeSizePromise = service.changePageSize(20);

      const req = httpMock.expectOne((r) => r.url.includes('/api/users'));
      expect(req.request.params.get('limit')).toBe('20');
      expect(req.request.params.get('skip')).toBe('0');

      const responseWithNewPageSize = { ...mockUserListApi, page_size: 20 };
      req.flush(responseWithNewPageSize);
      tick();

      await changeSizePromise;

      expect(service.pageSize()).toBe(20);
      expect(service.currentPage()).toBe(1);
    }));
  });

  describe('computed signals', () => {
    it('should calculate total pages correctly', () => {
      service['totalSignal'].set(25);
      service['pageSizeSignal'].set(10);

      expect(service.totalPages()).toBe(3);
    });

    it('should indicate if has users', () => {
      expect(service.hasUsers()).toBe(false);

      service['usersSignal'].set([mockUser]);

      expect(service.hasUsers()).toBe(true);
    });

    it('should check if has next page', () => {
      service['totalSignal'].set(30);
      service['pageSizeSignal'].set(10);
      service['currentPageSignal'].set(1);

      expect(service.hasNextPage()).toBe(true);

      service['currentPageSignal'].set(3);

      expect(service.hasNextPage()).toBe(false);
    });

    it('should check if has previous page', () => {
      service['currentPageSignal'].set(1);

      expect(service.hasPreviousPage()).toBe(false);

      service['currentPageSignal'].set(2);

      expect(service.hasPreviousPage()).toBe(true);
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
