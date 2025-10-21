# 🔐 Sistema de Protección de Rutas en FastAPI

## 📋 Resumen del Flujo

```
Cliente → Request + Token → FastAPI → Dependency → Validación → Endpoint
```

---

## 🎯 1. Rutas Públicas vs Protegidas

### **Ruta PÚBLICA** (sin protección):
```python
@router.post("/login")
async def login(
    credentials: UserLogin,
    session: SessionDep  # ⬅️ Sin dependencia de autenticación
) -> dict:
    # Cualquiera puede llamar esta ruta
    pass
```

### **Ruta PROTEGIDA** (requiere autenticación):
```python
@router.get("/me")
async def get_current_user_profile(
    current_user: CurrentUser  # ⬅️ Dependencia de autenticación
) -> UserResponse:
    # Solo usuarios autenticados pueden llamar esta ruta
    pass
```

### **Ruta con ROL específico** (HR):
```python
@router.post("/")
async def create_user(
    user_data: UserCreate,
    session: SessionDep,
    current_hr: CurrentHR  # ⬅️ Requiere rol HR
) -> UserResponse:
    # Solo usuarios HR pueden llamar esta ruta
    pass
```

---

## 🔑 2. Cómo FastAPI Sabe Que Una Ruta Está Protegida

FastAPI usa el **sistema de Dependency Injection** (Inyección de Dependencias). Cuando defines un parámetro con `Depends()`, FastAPI:

1. **Ejecuta la función de dependencia ANTES del endpoint**
2. **Si la dependencia falla** → retorna error HTTP inmediatamente
3. **Si la dependencia tiene éxito** → pasa el resultado al endpoint

### Ejemplo visual:

```python
# Tipo personalizado con Depends
CurrentUser = Annotated[User, Depends(get_current_active_user)]

@router.get("/protected")
async def protected_route(current_user: CurrentUser):
    #                       ↑
    #                       FastAPI ve el Depends() y ejecuta
    #                       get_current_active_user() PRIMERO
    return {"user": current_user.email}
```

---

## 🛡️ 3. La Cadena de Validación

El sistema tiene **3 niveles de dependencias en cadena**:

### **Nivel 1: `security` (HTTPBearer)**
```python
security = HTTPBearer()  # Extrae el token del header Authorization
```
- Busca el header `Authorization: Bearer <token>`
- Si **NO hay header** → HTTP 401
- Si **hay header** → devuelve el token

**Ubicación:** `app/api/dependencies/auth.py`

### **Nivel 2: `get_current_user()`**
```python
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: SessionDep
) -> User:
```
**Depende de:** `security` (debe ejecutarse primero)

**Hace:**
1. Recibe el token de `security`
2. Decodifica el token JWT → obtiene `user_id`
3. Busca el usuario en la base de datos
4. **Valida que el usuario esté activo**
5. Si todo OK → devuelve el `User`
6. Si falla → HTTP 401

**Errores manejados:**
- `jwt.ExpiredSignatureError` → "Token expirado"
- `jwt.InvalidTokenError` → "Token inválido"
- Usuario no encontrado → "Token inválido"
- Usuario inactivo → "Usuario inactivo"

### **Nivel 3a: `get_current_active_user()`**
```python
async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
```
**Depende de:** `get_current_user()` (cadena)

**Hace:**
- Verifica que el usuario esté activo
- Si está inactivo → HTTP 403
- Si está activo → devuelve el `User`

**Uso:**
```python
CurrentUser = Annotated[User, Depends(get_current_active_user)]
```

### **Nivel 3b: `require_hr()`**
```python
async def require_hr(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
```
**Depende de:** `get_current_active_user()` (cadena)

**Hace:**
- Verifica que el usuario sea HR
- Si **NO es HR** → HTTP 403 "Se requiere rol de HR para esta operación"
- Si **es HR** → devuelve el `User`

**Uso:**
```python
CurrentHR = Annotated[User, Depends(require_hr)]
```

---

## 📊 4. Flujo Completo con Ejemplo

### Escenario: Usuario llama a `GET /users/`

```python
@router.get("/")
async def list_users(
    session: SessionDep,
    _current_hr: CurrentHR,  # ⬅️ Aquí está la magia
    skip: int = 0,
    limit: int = 10,
) -> UserListResponse:
    pass
```

### Paso a paso:

```
1. Cliente envía:
   GET /users/
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

2. FastAPI detecta el parámetro _current_hr: CurrentHR

3. FastAPI resuelve las dependencias EN ORDEN:
   
   ┌─────────────────────────────────────┐
   │ security = HTTPBearer()             │
   │ ↓ Extrae token del header           │
   │ ✓ Token encontrado                  │
   └─────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────┐
   │ get_current_user()                  │
   │ ↓ Decodifica token JWT              │
   │ ✓ user_id = 5                       │
   │ ↓ Busca en DB                       │
   │ ✓ User encontrado                   │
   │ ↓ Verifica is_active                │
   │ ✓ Usuario activo                    │
   └─────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────┐
   │ get_current_active_user()           │
   │ ↓ Verifica is_active (redundante)   │
   │ ✓ Usuario activo                    │
   └─────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────┐
   │ require_hr()                        │
   │ ↓ Verifica role == HR               │
   │ ✓ Usuario es HR                     │
   └─────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────┐
   │ list_users() ejecutado              │
   │ ↓ Lógica del endpoint               │
   │ ✓ Retorna lista de usuarios         │
   └─────────────────────────────────────┘

4. FastAPI retorna HTTP 200 con los usuarios
```

### Si falla en cualquier punto:

```
❌ No hay token → HTTP 401 (security)
❌ Token inválido → HTTP 401 (get_current_user)
❌ Token expirado → HTTP 401 (get_current_user)
❌ Usuario no existe → HTTP 401 (get_current_user)
❌ Usuario inactivo → HTTP 401 (get_current_user)
❌ No es HR → HTTP 403 (require_hr)
```

---

## 🎨 5. Tipos de Protección Disponibles

### **Sin protección** (público):
```python
@router.post("/login")
async def login(credentials: UserLogin, session: SessionDep):
    pass
```
✅ Cualquiera puede acceder  
📍 **Ejemplo:** Login, registro, health check

### **Requiere autenticación** (cualquier usuario):
```python
@router.get("/me")
async def get_me(current_user: CurrentUser):
    pass
```
✅ Requiere: Token válido + Usuario activo  
📍 **Ejemplo:** Ver perfil propio, cambiar contraseña

### **Requiere rol HR**:
```python
@router.post("/users/")
async def create_user(user_data: UserCreate, current_hr: CurrentHR):
    pass
```
✅ Requiere: Token válido + Usuario activo + Rol HR  
📍 **Ejemplo:** Crear usuarios, aprobar solicitudes, ver todos los fichajes

### **Lógica condicional** (flexible):
```python
@router.get("/users/{user_id}")
async def get_user(user_id: int, current_user: CurrentUser):
    # HR puede ver a cualquiera
    if current_user.is_hr:
        return get_any_user(user_id)
    
    # Empleado solo puede verse a sí mismo
    if current_user.id == user_id:
        return get_own_profile()
    
    raise HTTPException(403, "Sin permisos")
```
✅ Requiere: Token válido + Lógica personalizada  
📍 **Ejemplo:** Ver usuario específico, editar perfil

---

## 🔍 6. Detalles Técnicos Importantes

### **`Annotated` Type Hint**
```python
CurrentUser = Annotated[User, Depends(get_current_active_user)]
#             ↑                ↑
#             Tipo resultante  Metadata de FastAPI
```

Es equivalente a escribir:
```python
async def endpoint(current_user: User = Depends(get_current_active_user)):
    pass
```

Pero más limpio y reutilizable.

### **Orden de resolución de dependencias**

FastAPI resuelve dependencias de **dentro hacia fuera**:
```python
require_hr()
  → depende de get_current_active_user()
      → depende de get_current_user()
          → depende de security (HTTPBearer)
```

Esto significa que se ejecutan en orden:
1. `security` (HTTPBearer)
2. `get_current_user()`
3. `get_current_active_user()`
4. `require_hr()`
5. **Endpoint final**

### **Custom HTTPBearer**

El código personaliza `HTTPBearer` para devolver **401** en lugar de **403**:

```python
class HTTPBearer(FastAPIHTTPBearer):
    def _raise_unauthorized(self) -> None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,  # ⬅️ 401, no 403
            detail="No se proporcionaron credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

**Razón:**
- **401 Unauthorized** = "No estás autenticado" (no has probado quién eres)
- **403 Forbidden** = "Estás autenticado pero no autorizado" (sabemos quién eres pero no puedes)

Esto sigue las convenciones estándar de HTTP.

---

## 🧪 7. Ejemplos de Uso en el Proyecto

### **Rutas públicas** (`/auth/login`):
```python
# app/api/routers/auth.py
@router.post("/login")
async def login(credentials: UserLogin, session: SessionDep) -> dict:
    # Sin dependencia de autenticación
    user_service = UserService(session)
    user = await user_service.authenticate_user(
        email=credentials.email,
        password=credentials.password
    )
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
```

### **Rutas protegidas para cualquier usuario** (`/users/me`):
```python
# app/api/routers/users.py
@router.get("/me")
async def get_current_user_profile(
    current_user: CurrentUser  # ⬅️ Solo requiere autenticación
) -> UserResponse:
    return UserResponse.model_validate(current_user)
```

### **Rutas solo para HR** (`POST /users/`):
```python
# app/api/routers/users.py
@router.post("/")
async def create_user(
    user_data: UserCreate,
    session: SessionDep,
    current_hr: CurrentHR  # ⬅️ Requiere rol HR
) -> UserResponse:
    user_service = UserService(session)
    user = await user_service.create_user_by_hr(user_data)
    return UserResponse.model_validate(user)
```

### **Rutas con lógica condicional** (`GET /users/{user_id}`):
```python
# app/api/routers/users.py
@router.get("/{user_id}")
async def get_user(
    user_id: int,
    session: SessionDep,
    current_user: CurrentUser  # ⬅️ Autenticación básica
) -> UserResponse:
    user_service = UserService(session)
    user = await user_service.get_user_by_id(user_id)
    
    # Lógica de autorización personalizada
    if not current_user.is_hr and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver este usuario",
        )
    
    return UserResponse.model_validate(user)
```

---

## 🔐 8. Seguridad del Token JWT

### **Creación del token** (`app/core/security.py`):
```python
def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
```

**Payload del token:**
```json
{
  "sub": "5",           // user_id
  "exp": 1729584000     // timestamp de expiración
}
```

### **Decodificación del token**:
```python
def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
```

**Validaciones automáticas de PyJWT:**
- ✅ Verifica firma del token
- ✅ Verifica que no haya expirado (`exp`)
- ✅ Verifica algoritmo correcto

---

## 📝 9. Buenas Prácticas Implementadas

### ✅ **Separación de responsabilidades**
- `HTTPBearer` → Extrae token
- `get_current_user()` → Valida token y obtiene usuario
- `get_current_active_user()` → Verifica estado activo
- `require_hr()` → Verifica rol

### ✅ **Reutilización con Type Hints**
```python
CurrentUser = Annotated[User, Depends(get_current_active_user)]
CurrentHR = Annotated[User, Depends(require_hr)]
```

### ✅ **Manejo de errores detallado**
- Diferentes mensajes para token expirado vs inválido
- Headers `WWW-Authenticate` correctos
- Códigos HTTP apropiados (401 vs 403)

### ✅ **Validación de usuario activo**
- Se verifica en `get_current_user()` (primera validación)
- Se verifica en `get_current_active_user()` (redundancia defensiva)

### ✅ **Documentación automática**
FastAPI genera documentación con:
- 🔒 Candado en rutas protegidas
- Botón "Authorize" en Swagger UI
- Esquemas de seguridad claros

---

## 📚 10. Referencias

- **Código fuente:**
  - `app/api/dependencies/auth.py` - Dependencias de autenticación
  - `app/core/security.py` - Creación y validación de tokens JWT
  - `app/api/routers/users.py` - Ejemplos de rutas protegidas
  - `app/api/routers/auth.py` - Login y rutas públicas

- **Documentación oficial:**
  - [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
  - [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)
  - [PyJWT Documentation](https://pyjwt.readthedocs.io/)

---

## ✅ Resumen Ejecutivo

**FastAPI sabe que una ruta está protegida porque:**

1. **Detecta parámetros con `Depends()`** en la firma de la función
2. **Ejecuta las dependencias ANTES del endpoint**
3. **Si alguna dependencia falla** → retorna error HTTP
4. **Si todas pasan** → ejecuta el endpoint

**El sistema usa:**
- `CurrentUser` → Usuario autenticado y activo
- `CurrentHR` → Usuario autenticado, activo y con rol HR
- Sin dependencia → Ruta pública

**El token se valida en cada request:**
1. `HTTPBearer` extrae el token del header `Authorization`
2. `get_current_user()` decodifica el JWT y verifica el usuario
3. Las dependencias adicionales verifican roles y permisos
4. Si todo pasa, el endpoint se ejecuta con el usuario inyectado

**Códigos HTTP usados:**
- `401 Unauthorized` → No autenticado (sin token o token inválido)
- `403 Forbidden` → Autenticado pero sin permisos (rol incorrecto)
- `200 OK` → Operación exitosa

---

*Última actualización: 21 de octubre de 2025*
