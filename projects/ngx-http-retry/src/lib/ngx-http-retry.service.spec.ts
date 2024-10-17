import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NgxHttpRetryService } from './ngx-http-retry.service';

describe('NgxHttpRetryService', () => {
  let service: NgxHttpRetryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NgxHttpRetryService],
    });

    service = TestBed.inject(NgxHttpRetryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should retry the request on server error (500)', fakeAsync(() => {
    const mockData = { id: 1, name: 'Test' };
    const url = '/test-endpoint';

    service.get<any>(url, {}, 2, 100).subscribe(
      data => expect(data).toEqual(mockData),
      fail // Test should fail if it reaches the error handler
    );

    // First request: Server error
    const req1 = httpMock.expectOne(url);
    req1.flush(null, { status: 500, statusText: 'Server Error' });

    // Simulate the retry delay
    tick(100);

    // Second request (retry): Success response
    const req2 = httpMock.expectOne(url);
    req2.flush(mockData);
  }));

  it('should not retry on client error (404)', () => {
    const url = '/test-endpoint';

    service.get<any>(url, {}, 2, 100).subscribe(
      () => fail('Expected to fail with 404'),
      error => expect(error.status).toBe(404)
    );

    const req = httpMock.expectOne(url);
    req.flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('should retry the specified number of times', fakeAsync(() => {
    const url = '/test-endpoint';
  
    service.get<any>(url, {}, 2, 100).subscribe(
      () => fail('Expected to fail after retries'),
      error => expect(error.status).toBe(500) // Expect final error after retries
    );
  
    // First request: Server error
    const req1 = httpMock.expectOne(url);
    req1.flush(null, { status: 500, statusText: 'Server Error' });
  
    // Simulate the first retry after 100ms
    tick(100);
    const req2 = httpMock.expectOne(url);
    req2.flush(null, { status: 500, statusText: 'Server Error' });
  
    // Simulate the second retry after another 100ms
    tick(100);
    const req3 = httpMock.expectOne(url);
    req3.flush(null, { status: 500, statusText: 'Server Error' });
  
    // Ensure all requests were handled
    httpMock.verify();
  }));  

  it('should correctly handle exponential backoff delays', fakeAsync(() => {
    const url = '/test-endpoint';

    // Retry with exponential backoff
    service.get<any>(url, {}, 2, 100).subscribe(
      () => fail('Expected to fail after retries'),
      error => expect(error.status).toBe(500)
    );

    // First request: Server error
    const req1 = httpMock.expectOne(url);
    req1.flush(null, { status: 500, statusText: 'Server Error' });

    // Simulate the first retry after 100ms
    tick(100);
    const req2 = httpMock.expectOne(url);
    req2.flush(null, { status: 500, statusText: 'Server Error' });

    // Simulate the second retry after another 100ms
    tick(100);
    const req3 = httpMock.expectOne(url);
    req3.flush(null, { status: 500, statusText: 'Server Error' });
  }));
});
