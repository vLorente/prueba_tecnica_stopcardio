import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make GET request', (done) => {
    const testData = { id: 1, name: 'Test' };

    service.get<any>('/test').subscribe({
      next: (data) => {
        expect(data).toEqual(testData);
        done();
      }
    });

    const req = httpMock.expectOne('http://localhost:8000/api/test');
    expect(req.request.method).toBe('GET');
    req.flush(testData);
  });

  it('should make POST request', (done) => {
    const testData = { id: 1, name: 'Test' };
    const postData = { name: 'Test' };

    service.post<any>('/test', postData).subscribe({
      next: (data) => {
        expect(data).toEqual(testData);
        done();
      }
    });

    const req = httpMock.expectOne('http://localhost:8000/api/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(postData);
    req.flush(testData);
  });

  it('should handle errors', (done) => {
    service.get<any>('/error').subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        expect(error.message).toContain('Error');
        done();
      }
    });

    const req = httpMock.expectOne('http://localhost:8000/api/error');
    req.flush({ detail: 'Test error' }, { status: 404, statusText: 'Not Found' });
  });
});
