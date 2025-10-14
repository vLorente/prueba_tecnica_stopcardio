# Actualización: FastAPI CLI

## 🔄 Cambio Realizado

### Antes (uvicorn)
```bash
make dev
# Ejecutaba: uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Ahora (fastapi dev)
```bash
make dev
# Ejecuta: uv run fastapi dev app/main.py --host 0.0.0.0 --port 8000
```

## 🎯 Beneficios

### 1. **Experiencia de Desarrollo Mejorada**
- ✅ Auto-reload más rápido y eficiente
- ✅ Mejor detección de cambios en el código
- ✅ Mensajes más claros en la consola

### 2. **Detección Automática**
- ✅ Detecta automáticamente el objeto FastAPI (`app`)
- ✅ Configura el PYTHONPATH correctamente
- ✅ Busca en ubicaciones estándar (`app/main.py`, `main.py`, etc.)

### 3. **Moderno y Oficial**
- ✅ Comando oficial de FastAPI (desde v0.111.0)
- ✅ Mejor integración con el ecosistema FastAPI
- ✅ Preparado para funciones futuras

## 📦 Archivos Modificados

### 1. `Makefile`
```makefile
# Variable agregada
FASTAPI := uv run fastapi

# Comando actualizado
dev: ## Ejecutar servidor de desarrollo
	@echo "🚀 Iniciando servidor de desarrollo..."
	@echo "📝 Usando: fastapi dev (con auto-reload)"
	$(FASTAPI) dev app/main.py --host 0.0.0.0 --port 8000
```

### 2. `app/__init__.py` (Creado)
```python
"""
Sistema de Gestión de RRHH - Backend.

Aplicación FastAPI para gestión de fichajes y recursos humanos.
"""

__version__ = "1.0.0"
```

Este archivo hace que `app` sea un paquete Python válido, necesario para que `fastapi dev` funcione correctamente.

## 🚀 Uso

### Desarrollo Local
```bash
# Comando simplificado
make dev

# O directamente
uv run fastapi dev app/main.py --host 0.0.0.0 --port 8000
```

### Opciones Disponibles
```bash
# Ver todas las opciones
uv run fastapi dev --help

# Cambiar puerto
uv run fastapi dev app/main.py --port 3000

# Deshabilitar auto-reload
uv run fastapi dev app/main.py --no-reload
```

## 🔍 Diferencias Clave

| Aspecto          | uvicorn                | fastapi dev               |
| ---------------- | ---------------------- | ------------------------- |
| **Comando**      | `uvicorn app.main:app` | `fastapi dev app/main.py` |
| **Sintaxis**     | Módulo Python          | Ruta de archivo           |
| **Auto-reload**  | `--reload` (manual)    | Por defecto               |
| **Detección**    | Manual                 | Automática                |
| **Host default** | 127.0.0.1              | 127.0.0.1                 |
| **Mensajes**     | Básicos                | Mejorados con emojis      |

## ✅ Verificación

Para verificar que todo funciona:

```bash
# 1. Ver que el paquete app es importable
uv run python -c "import app; print(f'App v{app.__version__}')"

# 2. Verificar que fastapi está disponible
uv run fastapi --version

# 3. Iniciar servidor
make dev
```

## 📚 Referencias

- [FastAPI CLI Documentation](https://fastapi.tiangolo.com/fastapi-cli/)
- [FastAPI Dev Command](https://fastapi.tiangolo.com/reference/cli/#fastapi-dev)
- [Release Notes v0.111.0](https://github.com/tiangolo/fastapi/releases/tag/0.111.0)

## 🔄 Rollback (si es necesario)

Si por alguna razón necesitas volver a uvicorn:

```makefile
dev: ## Ejecutar servidor de desarrollo
	@echo "🚀 Iniciando servidor de desarrollo..."
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Pero esto no debería ser necesario, `fastapi dev` es la forma moderna y recomendada.

---

**Actualizado**: Octubre 14, 2025  
**Versión**: 2.0.1
