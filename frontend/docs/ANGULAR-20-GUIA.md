# Guía de Angular 20 - Convenciones del Proyecto

## 📋 Resumen

Este documento define las convenciones específicas de **Angular 20** que seguiremos en el proyecto. Angular 20 introduce cambios importantes, especialmente el uso de **signals** como mecanismo principal de gestión de estado.

---

## 🎯 Principios Fundamentales

### 1. Standalone Components (Por Defecto)
```typescript
// ✅ CORRECTO - No especificar standalone: true (es el default)
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {}

// ❌ INCORRECTO - No agregar standalone: true explícitamente
@Component({
  standalone: true,  // ❌ No necesario, es el default
  selector: 'app-login'
})
```

### 2. Signals para Estado
```typescript
// ✅ CORRECTO - Usar signals
export class AuthService {
  private userSignal = signal<User | null>(null);
  user = this.userSignal.asReadonly();
  
  isAuthenticated = computed(() => this.user() !== null);
  
  setUser(user: User) {
    this.userSignal.set(user);  // ✅ usar set()
  }
  
  clearUser() {
    this.userSignal.set(null);
  }
}

// ❌ INCORRECTO - No usar mutate
setUser(user: User) {
  this.userSignal.mutate(u => u = user);  // ❌ No usar mutate
}
```

### 3. Inject Function (No Constructor DI)
```typescript
// ✅ CORRECTO - Usar inject()
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  login() {
    this.authService.login(/* ... */);
  }
}

// ❌ INCORRECTO - No usar constructor injection
export class LoginComponent {
  constructor(
    private authService: AuthService,  // ❌ Viejo estilo
    private router: Router
  ) {}
}
```

---

## 🧩 Components

### Input/Output Functions
```typescript
// ✅ CORRECTO - Usar input() y output()
export class UserCardComponent {
  user = input.required<User>();
  onEdit = output<User>();
  onDelete = output<string>();
  
  handleEdit() {
    this.onEdit.emit(this.user());
  }
}

// ❌ INCORRECTO - No usar decoradores
export class UserCardComponent {
  @Input() user!: User;  // ❌ Viejo estilo
  @Output() onEdit = new EventEmitter<User>();  // ❌
}
```

### Computed Values
```typescript
// ✅ CORRECTO - Usar computed()
export class ProfileComponent {
  user = input.required<User>();
  
  fullName = computed(() => 
    `${this.user().first_name} ${this.user().last_name}`
  );
  
  isAdmin = computed(() => 
    this.user().role === 'HR'
  );
}

// ❌ INCORRECTO - No usar getters para estado derivado
get fullName() {  // ❌ No recomendado
  return `${this.user().first_name} ${this.user().last_name}`;
}
```

### ChangeDetection
```typescript
// ✅ CORRECTO - Siempre usar OnPush
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush  // ✅ Siempre
})
export class UserListComponent {}
```

### Host Bindings
```typescript
// ✅ CORRECTO - Usar objeto host
@Component({
  selector: 'app-button',
  template: '<ng-content></ng-content>',
  host: {
    '[class.disabled]': 'disabled()',
    '(click)': 'handleClick()',
    'role': 'button'
  }
})
export class ButtonComponent {
  disabled = input(false);
}

// ❌ INCORRECTO - No usar decoradores
export class ButtonComponent {
  @HostBinding('class.disabled')  // ❌ Viejo estilo
  get isDisabled() { return this.disabled(); }
  
  @HostListener('click')  // ❌ Viejo estilo
  handleClick() {}
}
```

---

## 📝 Templates

### Control Flow Nativo
```html
<!-- ✅ CORRECTO - Usar @if, @for, @switch -->
@if (isAuthenticated()) {
  <div class="user-menu">
    <span>{{ user()?.username }}</span>
    <button (click)="logout()">Logout</button>
  </div>
} @else {
  <a routerLink="/login">Login</a>
}

@for (fichaje of fichajes(); track fichaje.id) {
  <div class="fichaje-item">
    {{ fichaje.timestamp | date }}
  </div>
} @empty {
  <p>No hay fichajes registrados</p>
}

<!-- ❌ INCORRECTO - No usar directivas estructurales viejas -->
<div *ngIf="isAuthenticated()">  <!-- ❌ Viejo estilo -->
  ...
</div>

<div *ngFor="let fichaje of fichajes()">  <!-- ❌ Viejo estilo -->
  ...
</div>
```

### Class/Style Bindings
```html
<!-- ✅ CORRECTO - Usar bindings directos -->
<div [class.active]="isActive()"
     [class.disabled]="isDisabled()"
     [style.color]="statusColor()"
     [style.font-size.px]="fontSize()">
  Content
</div>

<!-- ❌ INCORRECTO - No usar ngClass/ngStyle -->
<div [ngClass]="{'active': isActive(), 'disabled': isDisabled()}">  <!-- ❌ -->
  Content
</div>

<div [ngStyle]="{'color': statusColor(), 'font-size': fontSize() + 'px'}">  <!-- ❌ -->
  Content
</div>
```

### Signals en Templates
```html
<!-- ✅ CORRECTO - Llamar signals como funciones -->
<h1>Welcome, {{ user()?.username }}!</h1>

@if (loading()) {
  <div class="spinner">Loading...</div>
}

<p>Total fichajes: {{ fichajesCount() }}</p>

<!-- ❌ INCORRECTO - No omitir paréntesis -->
<h1>Welcome, {{ user?.username }}!</h1>  <!-- ❌ user es un signal, necesita () -->
```

---

## 🔧 Services

### Service Structure
```typescript
// ✅ CORRECTO - providedIn: 'root' + inject()
@Injectable({
  providedIn: 'root'
})
export class FichajesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // Estado con signals
  private fichajesSignal = signal<Fichaje[]>([]);
  fichajes = this.fichajesSignal.asReadonly();
  
  fichajesCount = computed(() => this.fichajes().length);
  
  // Métodos
  async loadFichajes(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<Fichaje[]>('/api/fichajes')
    );
    this.fichajesSignal.set(data);
  }
  
  async createFichaje(type: 'IN' | 'OUT'): Promise<void> {
    const newFichaje = await firstValueFrom(
      this.http.post<Fichaje>('/api/fichajes', { type })
    );
    this.fichajesSignal.update(list => [...list, newFichaje]);
  }
}
```

### Signal Updates
```typescript
// ✅ CORRECTO - Usar set() y update()
// set() - Reemplazar valor completo
this.usersSignal.set(newUsers);
this.loadingSignal.set(false);

// update() - Modificar basándose en valor anterior
this.usersSignal.update(users => [...users, newUser]);
this.counterSignal.update(count => count + 1);

// ❌ INCORRECTO - No usar mutate
this.usersSignal.mutate(users => users.push(newUser));  // ❌ Evitar mutate
```

---

## 📋 Forms

### Reactive Forms (Recomendado)
```typescript
// ✅ CORRECTO - Usar Reactive Forms con signals
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  
  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  
  loading = signal(false);
  error = signal<string | null>(null);
  
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;
    
    this.loading.set(true);
    this.error.set(null);
    
    try {
      await this.authService.login(this.loginForm.value);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}
```

```html
<!-- Template del form -->
<form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
  <input 
    type="text" 
    formControlName="username"
    [class.error]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
  
  <input 
    type="password" 
    formControlName="password"
    [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
  
  @if (error()) {
    <div class="error-message">{{ error() }}</div>
  }
  
  <button 
    type="submit" 
    [disabled]="loginForm.invalid || loading()">
    @if (loading()) {
      Logging in...
    } @else {
      Login
    }
  </button>
</form>
```

---

## 🔒 Guards

### Function Guards (Recomendado)
```typescript
// ✅ CORRECTO - Usar functional guards con inject()
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// Uso en routes
export const routes: Routes = [
  {
    path: 'fichajes',
    component: FichajesComponent,
    canActivate: [authGuard]  // ✅ Usar directamente
  }
];
```

---

## 🌐 HTTP Interceptors

### Functional Interceptors
```typescript
// ✅ CORRECTO - Usar functional interceptors
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};

// Registrar en app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])  // ✅ Array de interceptors
    )
  ]
};
```

---

## 🖼️ Images

### NgOptimizedImage
```typescript
// ✅ CORRECTO - Usar para imágenes estáticas
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-logo',
  imports: [NgOptimizedImage],
  template: `
    <img 
      ngSrc="/assets/logo.png" 
      alt="StopCardio Logo"
      width="200" 
      height="100"
      priority>
  `
})
export class LogoComponent {}

// ❌ INCORRECTO - NgOptimizedImage NO funciona con base64
<img ngSrc="data:image/png;base64,..." alt="...">  <!-- ❌ No usar -->
```

---

## 📦 Module Structure (Standalone)

### Feature Structure
```
src/app/
├── core/                       # Servicios singleton, modelos, guards
│   ├── models/
│   ├── services/
│   ├── guards/
│   └── interceptors/
├── shared/                     # Componentes/pipes reutilizables
│   ├── components/
│   └── pipes/
├── features/                   # Features organizadas por módulo
│   ├── auth/
│   │   ├── login/
│   │   └── profile/
│   ├── fichajes/
│   └── vacaciones/
└── layouts/                    # Layouts de la app
    └── main-layout/
```

---

## 🧪 Testing con Signals

### Component Testing
```typescript
// ✅ Test de componente con signals
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  
  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);
    
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });
  
  it('should update loading signal when submitting', async () => {
    authService.login.and.returnValue(Promise.resolve());
    
    expect(component.loading()).toBe(false);
    
    component.onSubmit();
    expect(component.loading()).toBe(true);
    
    await fixture.whenStable();
    expect(component.loading()).toBe(false);
  });
});
```

### Service Testing
```typescript
// ✅ Test de servicio con signals
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should update user signal on successful login', async () => {
    const mockUser = { id: '1', username: 'test' };
    
    const loginPromise = service.login('test', 'password');
    
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ user: mockUser, token: 'test-token' });
    
    await loginPromise;
    
    expect(service.user()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });
});
```

---

## ✅ Checklist de Convenciones

### Components
- [ ] No incluir `standalone: true` (es default)
- [ ] Usar `input()` y `output()` en lugar de decoradores
- [ ] Usar `computed()` para estado derivado
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Host bindings en objeto `host`, no decoradores
- [ ] Templates con `@if`, `@for`, `@switch`
- [ ] Bindings de class/style directos, no `ngClass`/`ngStyle`

### Services
- [ ] `providedIn: 'root'` para singletons
- [ ] Usar `inject()` en lugar de constructor
- [ ] Estado con `signal()`
- [ ] Usar `set()` y `update()`, evitar `mutate()`
- [ ] Exponer readonly signals cuando sea posible

### Forms
- [ ] Preferir Reactive Forms
- [ ] Validación con Validators
- [ ] Estado de loading/error con signals

### Guards/Interceptors
- [ ] Usar functional guards/interceptors
- [ ] Usar `inject()` dentro de las funciones

### TypeScript
- [ ] Strict type checking
- [ ] Evitar `any`, usar `unknown`
- [ ] Type inference cuando sea obvio

---

## 📚 Referencias

- [Angular 20 Documentation](https://angular.dev/)
- [Signals Guide](https://angular.dev/guide/signals)
- [Standalone Components](https://angular.dev/guide/components)
- [New Control Flow](https://angular.dev/guide/templates/control-flow)

---

**Última actualización**: Octubre 16, 2025  
**Versión de Angular**: 20.3
