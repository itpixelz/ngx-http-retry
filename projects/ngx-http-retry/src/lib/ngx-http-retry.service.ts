import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NgxHttpRetryService {
  constructor(private http: HttpClient) {}

  // GET request with retry logic
  get<T>(url: string, options = {}, retries = 3, delayMs = 1000): Observable<T> {
    return this.http.get<T>(url, options).pipe(
      this.retryStrategy<T>(retries, delayMs)
    );
  }

  // POST request with retry logic
  post<T>(url: string, body: any, options = {}, retries = 3, delayMs = 1000): Observable<T> {
    return this.http.post<T>(url, body, options).pipe(
      this.retryStrategy<T>(retries, delayMs)
    );
  }

  // PUT request with retry logic
  put<T>(url: string, body: any, options = {}, retries = 3, delayMs = 1000): Observable<T> {
    return this.http.put<T>(url, body, options).pipe(
      this.retryStrategy<T>(retries, delayMs)
    );
  }

  // DELETE request with retry logic
  delete<T>(url: string, options = {}, retries = 3, delayMs = 1000): Observable<T> {
    return this.http.delete<T>(url, options).pipe(
      this.retryStrategy<T>(retries, delayMs)
    );
  }

  // Centralized retry strategy using the new 'retry' operator
  private retryStrategy<T>(retries: number, delayMs: number) {
    return retry<T>({
      count: retries,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        if (this.isNonRetryableError(error)) {
          throw error;
        } else {
          console.warn(`Retry attempt #${retryCount}`);
          return timer(delayMs);
        }
      },
    });
  }

  // Define non-retryable HTTP status codes
  private isNonRetryableError(error: HttpErrorResponse): boolean {
    // Do not retry for client-side errors (4xx), except for 408 (Request Timeout)
    return error.status >= 400 && error.status < 500 && error.status !== 408;
  }
}
