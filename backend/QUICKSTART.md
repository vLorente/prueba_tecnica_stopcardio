# 🚀 Quick Start Guide - Backend HR Management

## ✅ Estado Actual: Entorno de Desarrollo Configurado

### 📦 Lo que ya tienes instalado:

```bash
✓ DevContainer configurado (Python 3.13)
✓ Script de instalación automática (uv)
✓ Makefile con comandos útiles
✓ Variables de entorno (.env.example)
✓ Documentación completa
```

## 🎯 Inicio Rápido (3 pasos)

### 1️⃣ Verificar el Entorno

```bash
make status
# o
./scripts/check_environment.sh
```

**Deberías ver**:
- ✅ Python 3.13 instalado
- ✅ uv instalado
- ✅ Archivos de configuración presentes

### 2️⃣ Crear Archivo .env

```bash
cp .env.example .env
```

### 3️⃣ ¡Listo para Desarrollar!

```bash
# Ver todos los comandos disponibles
make help

# Cuando tengas código, inicia el servidor
make dev
```

## 📚 Comandos Más Usados

```bash
make help           # Ver todos los comandos
make status         # Verificar entorno
make install        # Reinstalar dependencias
make dev            # Iniciar servidor (cuando esté el código)
make test           # Ejecutar tests
make lint           # Verificar código
make clean          # Limpiar archivos temporales
```

## 🔧 Gestión de Dependencias con uv

```bash
# Agregar nueva dependencia
uv add nombre-paquete

# Agregar dependencia de desarrollo
uv add --dev nombre-paquete

# Sincronizar dependencias
uv sync

# Ejecutar un comando con uv
uv run python script.py

# Iniciar servidor de desarrollo (moderno)
uv run fastapi dev app/main.py --host 0.0.0.0 --port 8000
# O simplemente: make dev
```

## 📁 Próximos Pasos

1. **Crear estructura del proyecto**:
   ```bash
   mkdir -p app/{api/{routers,dependencies},core,models,schemas,services,repositories,scripts}
   touch app/__init__.py
   ```

2. **Instalar dependencias principales**:
   ```bash
   uv add fastapi sqlmodel uvicorn[standard] alembic python-jose[cryptography] passlib[bcrypt] python-multipart
   ```

3. **Instalar dependencias de desarrollo**:
   ```bash
   uv add --dev pytest pytest-asyncio httpx pytest-cov ruff black pylint
   ```

4. **Crear `app/main.py`** con FastAPI básico

5. **Iniciar servidor**:
   ```bash
   make dev
   ```

## 📖 Documentación

- **Configuración completa**: `docs/setup-environment.md`
- **Scripts**: `scripts/README.md`
- **Iteración completada**: `docs/Iteracion1-COMPLETADA.md`
- **Instrucciones Copilot**: `.github/copilot-instructions.md`

## 🆘 Problemas Comunes

### Script no se ejecuta
```bash
chmod +x scripts/*.sh
./scripts/start_enviroment.sh
```

### uv no encontrado
```bash
export PATH="$HOME/.cargo/bin:$PATH"
source ~/.bashrc
```

### Reinstalar desde cero
```bash
make clean
./scripts/start_enviroment.sh
```

## 💡 Tips

- ✅ El script de instalación es **idempotente** (puedes ejecutarlo múltiples veces)
- ✅ Usa `make help` para ver todos los comandos disponibles
- ✅ El devcontainer se configura automáticamente al crearse
- ✅ SQLite se usa para desarrollo (sin necesidad de PostgreSQL)
- ✅ Todas las extensiones de VS Code ya están instaladas

## 🎓 Recursos

- [uv docs](https://docs.astral.sh/uv/) - Documentación oficial de uv
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web
- [SQLModel](https://sqlmodel.tiangolo.com/) - ORM
- [Ruff](https://docs.astral.sh/ruff/) - Linter rápido

---

**¿Todo listo?** → Ejecuta `make status` para verificar ✅
