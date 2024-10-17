# NgxHttpRetryService

[![npm version](https://img.shields.io/npm/v/ngx-http-retry.svg)](https://www.npmjs.com/package/ngx-http-retry)
[![npm downloads](https://img.shields.io/npm/dm/ngx-http-retry.svg)](https://www.npmjs.com/package/ngx-http-retry)
[![license](https://img.shields.io/npm/l/ngx-http-retry.svg)](LICENSE)

An Angular service that provides HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) with built-in retry logic using RxJS's `retry` operator.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Importing the Service](#importing-the-service)
  - [Available Methods](#available-methods)
    - [`get`](#get)
    - [`post`](#post)
    - [`put`](#put)
    - [`delete`](#delete)
  - [Customizing Retries](#customizing-retries)
- [Retry Strategy](#retry-strategy)
  - [Non-Retryable Errors](#non-retryable-errors)
  - [Exponential Backoff](#exponential-backoff)
  - [Custom Retry Conditions](#custom-retry-conditions)
- [Error Handling](#error-handling)
- [Extending the Service](#extending-the-service)
- [FAQs](#faqs)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)
- [Changelog](#changelog)

## Installation

Install the package via npm:

```bash
npm install ngx-http-retry
```

## Usage

### Importing the Service

Import `NgxHttpRetryService` into your Angular component or service:

```typescript
import { NgxHttpRetryService } from 'ngx-http-retry';

@Component({
  // ...
})
export class YourComponent {
  constructor(private httpRetryService: NgxHttpRetryService) {}
}
```

### Available Methods

The service provides the following methods, which mirror Angular's `HttpClient` methods but include retry logic:

- `get<T>(url: string, options?: any, retries?: number, delayMs?: number): Observable<T>`
- `post<T>(url: string, body: any, options?: any, retries?: number, delayMs?: number): Observable<T>`
- `put<T>(url: string, body: any, options?: any, retries?: number, delayMs?: number): Observable<T>`
- `delete<T>(url: string, options?: any, retries?: number, delayMs?: number): Observable<T>`

#### `get`

Performs a GET request with retry logic.

**Parameters:**

- `url: string` - The endpoint URL.
- `options?: any` - Optional HTTP options.
- `retries?: number` - Number of retry attempts (default: `3`).
- `delayMs?: number` - Delay between retries in milliseconds (default: `1000`).

**Returns:**

- `Observable<T>` - An observable of the response.

**Example:**

```typescript
this.httpRetryService.get<User[]>('https://api.example.com/users')
  .subscribe(
    users => console.log(users),
    error => console.error('Request failed', error)
  );
```

#### `post`

Performs a POST request with retry logic.

**Parameters:**

- `url: string` - The endpoint URL.
- `body: any` - The payload to send.
- `options?: any` - Optional HTTP options.
- `retries?: number` - Number of retry attempts (default: `3`).
- `delayMs?: number` - Delay between retries in milliseconds (default: `1000`).

**Returns:**

- `Observable<T>` - An observable of the response.

**Example:**

```typescript
const payload = { name: 'John Doe', email: 'john@example.com' };
this.httpRetryService.post<User>('https://api.example.com/users', payload)
  .subscribe(
    user => console.log('User created:', user),
    error => console.error('Request failed', error)
  );
```

#### `put`

Performs a PUT request with retry logic.

**Parameters:**

- `url: string` - The endpoint URL.
- `body: any` - The payload to update.
- `options?: any` - Optional HTTP options.
- `retries?: number` - Number of retry attempts (default: `3`).
- `delayMs?: number` - Delay between retries in milliseconds (default: `1000`).

**Returns:**

- `Observable<T>` - An observable of the response.

**Example:**

```typescript
const updatedData = { name: 'Jane Doe' };
this.httpRetryService.put<User>('https://api.example.com/users/1', updatedData)
  .subscribe(
    user => console.log('User updated:', user),
    error => console.error('Request failed', error)
  );
```

#### `delete`

Performs a DELETE request with retry logic.

**Parameters:**

- `url: string` - The endpoint URL.
- `options?: any` - Optional HTTP options.
- `retries?: number` - Number of retry attempts (default: `3`).
- `delayMs?: number` - Delay between retries in milliseconds (default: `1000`).

**Returns:**

- `Observable<T>` - An observable of the response.

**Example:**

```typescript
this.httpRetryService.delete<void>('https://api.example.com/users/1')
  .subscribe(
    () => console.log('User deleted'),
    error => console.error('Request failed', error)
  );
```

### Customizing Retries

Customize the number of retries and delay between retries:

```typescript
this.httpRetryService.get<User[]>('https://api.example.com/users', {}, 5, 2000)
  .subscribe(
    users => console.log(users),
    error => console.error('Request failed after retries', error)
  );
```

- **Retries:** `5`
- **Delay:** `2000` milliseconds

## Retry Strategy

The retry logic uses RxJS's `retry` operator with a custom strategy.

```typescript
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
```

### Non-Retryable Errors

By default, the following HTTP errors are **not retried**:

- Client-side errors (`4xx`), except for `408 Request Timeout`.

```typescript
private isNonRetryableError(error: HttpErrorResponse): boolean {
  return error.status >= 400 && error.status < 500 && error.status !== 408;
}
```

### Exponential Backoff

To implement exponential backoff, modify the `retryStrategy`:

```typescript
private retryStrategy<T>(retries: number, delayMs: number) {
  return retry<T>({
    count: retries,
    delay: (error: HttpErrorResponse, retryCount: number) => {
      if (this.isNonRetryableError(error)) {
        throw error;
      } else {
        const backoffDelay = delayMs * Math.pow(2, retryCount - 1);
        console.warn(`Retry attempt #${retryCount} after ${backoffDelay}ms`);
        return timer(backoffDelay);
      }
    },
  });
}
```

### Custom Retry Conditions

Customize retry conditions based on specific error codes or responses:

```typescript
private retryStrategy<T>(retries: number, delayMs: number) {
  return retry<T>({
    count: retries,
    delay: (error: HttpErrorResponse, retryCount: number) => {
      if (this.isNonRetryableError(error) || retryCount > retries) {
        throw error;
      } else if (error.status === 500) {
        // Immediate retry for server errors
        return timer(0);
      } else {
        return timer(delayMs);
      }
    },
  });
}
```

## Error Handling

Handle errors where you consume the service:

```typescript
this.httpRetryService.get<User[]>('https://api.example.com/users')
  .subscribe(
    users => {
      // Successful response
    },
    error => {
      // Error after all retries
      console.error('Request failed', error);
    }
  );
```

## Extending the Service

For extensive customization, extend `NgxHttpRetryService`:

```typescript
@Injectable({
  providedIn: 'root',
})
export class CustomHttpRetryService extends NgxHttpRetryService {
  protected isNonRetryableError(error: HttpErrorResponse): boolean {
    // Custom logic (e.g., don't retry on 404)
    return error.status === 404;
  }
}
```

Use `CustomHttpRetryService` in your components:

```typescript
constructor(private httpRetryService: CustomHttpRetryService) {}
```

## FAQs

### Does this service support Angular Universal (Server-Side Rendering)?

Yes, it is compatible with Angular Universal.

### How is this different from using `HttpClient` directly?

`NgxHttpRetryService` wraps `HttpClient` methods and adds configurable retry logic.

### Can I use this service for file uploads or downloads?

Yes, any HTTP request supported by `HttpClient` can be used.

### Does it support HTTP interceptors?

Yes, any interceptors configured with `HttpClient` are applied.

## Contributing

Contributions are welcome! Please submit issues or pull requests on [GitHub](https://github.com/itpixelz/ngx-http-retry).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

[Umar Draz](https://github.com/itpixelz)

## Changelog

### v1.0.0

- Initial release with GET, POST, PUT, DELETE methods and retry logic.
