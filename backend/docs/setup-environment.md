# Configuración del Entorno de Desarrollo

## 📦 Resumen de Archivos Creados

Esta iteración configura el entorno de desarrollo completo para el backend del sistema HR:

### Scripts de Configuración
- ✅ **`scripts/start_enviroment.sh`** - Script principal de instalación automática
- ✅ **`scripts/check_environment.sh`** - Script de verificación del entorno
- ✅ **`scripts/README.md`** - Documentación detallada de los scripts

### 2. DevContainer Configurado ✅
- **Archivo**: `.devcontainer/devcontainer.json`
- **Configuración**:
  - Base: Python 3.13 (mcr.microsoft.com/devcontainers/python:1-3.13-bullseye)
  - Ejecución automática del script en `postCreateCommand`
  - Extensiones VS Code preconfiguradas:
    - Python, Pylance, Black, Ruff, Pylint
    - GitHub Copilot
    - TOML support
    - SQLTools con driver SQLite
  - Puerto expuesto: 8000 (FastAPI)
  - Variable `ENV=development` configurada
  - Base de datos: SQLite (hr_dev.db)
  
- ✅ **`.env.example`** - Plantilla de variables de entorno para desarrollo

- ✅ **`Makefile`** - Comandos útiles para desarrollo:
  - `make install` - Instalar dependencias
  - `make dev` - Ejecutar servidor
  - `make test` - Ejecutar tests
  - `make lint` - Verificar código
  - `make status` - Verificar estado del entorno
  - `make help` - Ver todos los comandos

## 🚀 Características del Script de Instalación

El script `start_enviroment.sh` realiza automáticamente:

1. **Verificación de Python** - Confirma que Python 3 está disponible
2. **Instalación de dependencias del sistema** - curl, build-essential, libpq-dev, etc.
3. **Instalación de uv** - Gestor de paquetes Python moderno y rápido
4. **Configuración de entorno** - Copia `.env.example` a `.env` si no existe
5. **Sincronización de dependencias** - Ejecuta `uv sync` para instalar paquetes
6. **Verificación final** - Confirma que todo está correctamente instalado

### Ventajas de usar `uv`
- 🚀 **10-100x más rápido** que pip
- 📦 **Gestión automática** de entornos virtuales
- 🔒 **Lock file** para reproducibilidad
- 🎯 **Compatible** con pip y requirements.txt
- 🛠️ **Todo en uno**: instalar, ejecutar, gestionar dependencias

## 🔄 Flujo de Trabajo

### Primera vez en el DevContainer

```bash
# El script se ejecuta automáticamente en postCreateCommand
# Una vez completado, verifica el estado:
make status

# Crear el archivo .env desde .env.example si no se creó automáticamente
cp .env.example .env

# Listo para desarrollar
make dev
```

### Comandos Comunes

```bash
# Desarrollo
make dev              # Iniciar servidor con hot-reload
make test             # Ejecutar tests
make lint             # Verificar código
make format           # Formatear código

# Dependencias
make install          # Reinstalar/actualizar dependencias
uv add fastapi        # Agregar nueva dependencia
uv add --dev pytest   # Agregar dependencia de desarrollo

# Base de datos
make migration        # Crear nueva migración
make migrate          # Aplicar migraciones

# Utilidades
make status           # Ver estado del entorno
make clean            # Limpiar archivos temporales
make help             # Ver todos los comandos
```

## 📋 Checklist de Configuración

- [x] Script de instalación automática (`start_enviroment.sh`)
- [x] Script de verificación (`check_environment.sh`)
- [x] DevContainer configurado con Python 3.13
- [x] Extensiones VS Code preconfiguradas
- [x] Variables de entorno (.env.example)
- [x] Makefile con comandos útiles
- [x] Documentación completa

## 🎯 Próximos Pasos

Una vez completada esta iteración, podrás:

1. **Crear la estructura del proyecto**:
   ```bash
   mkdir -p app/{api/{routers,dependencies},core,models,schemas,services,repositories,scripts}
   touch app/__init__.py app/main.py app/database.py
   ```

2. **Definir dependencias en `pyproject.toml`**:
   ```bash
   uv add fastapi sqlmodel uvicorn alembic
   uv add --dev pytest httpx ruff black pylint
   ```

3. **Iniciar desarrollo** siguiendo los principios SOLID y Clean Architecture

## 🔍 Verificación

Ejecuta el script de verificación para confirmar que todo está correcto:

```bash
./scripts/check_environment.sh
```

Deberías ver:
- ✅ Python 3.13 instalado
- ✅ uv instalado
- ✅ Git disponible
- ✅ Archivos de configuración presentes
- ✅ Entorno virtual creado (si ya ejecutaste `uv sync`)

## 📚 Recursos

- **uv Documentation**: https://docs.astral.sh/uv/
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLModel**: https://sqlmodel.tiangolo.com/
- **VS Code DevContainers**: https://code.visualstudio.com/docs/devcontainers/containers

## 🆘 Troubleshooting

### El script no se ejecuta automáticamente
```bash
# Ejecutar manualmente
./scripts/start_enviroment.sh
```

### Permisos denegados
```bash
# Dar permisos de ejecución
chmod +x scripts/*.sh
```

### uv no se encuentra después de instalación
```bash
# Agregar al PATH
export PATH="$HOME/.cargo/bin:$PATH"

# O reinstalar
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Error con .env
```bash
# Crear desde plantilla
cp .env.example .env
```

---

**Nota**: Esta configuración está optimizada para desarrollo. La configuración de producción (Docker, PostgreSQL, etc.) se implementará en iteraciones posteriores.
