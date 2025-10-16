You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.
## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
## Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
## Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
## State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
## Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
## Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

### HTTP Calls and Asynchronous Operations
- **ALWAYS use async/await pattern** with `firstValueFrom()` for HTTP calls
- **NEVER use `.subscribe()` directly** or create Promises manually with `new Promise()`
- Use `try/catch/finally` blocks for error handling
- Set `loading` state in `try` block and clear it in `finally` block
- Example pattern (MANDATORY):
  ```typescript
  async loadData(): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);
      
      const response = await firstValueFrom(
        this.apiService.get<DataResponse>('/endpoint')
      );
      
      // Process response
      this.dataSignal.set(response.data);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error loading data';
      this.errorSignal.set(errorMessage);
      console.error('Error loading data:', error);
      throw error; // Re-throw for caller to handle if needed
    } finally {
      this.loadingSignal.set(false);
    }
  }
  ```
- **DO NOT** use Observable operators like `pipe()`, `tap()`, `catchError()` with `.subscribe()`
- This pattern ensures consistency, easier testing, and better error handling across the project

## Testing Best Practices
- Use `fakeAsync` and `tick()` for testing asynchronous operations
- Wrap all async test functions with `fakeAsync` when testing promises or observables
- Use `tick()` to advance the virtual clock and resolve pending promises
- Use `tick(milliseconds)` to simulate specific time delays
- Mock services using writable signals for better control in tests
- Create signal-based mocks with both readonly and writable versions
- Example pattern:
  ```typescript
  it('should test async operation', fakeAsync(async () => {
    const promise = service.asyncMethod();
    tick(); // Advance clock to resolve promise
    const result = await promise;
    expect(result).toBeDefined();
  }));
  ```
