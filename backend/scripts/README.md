# Script de Configuración del Entorno de Desarrollo

Este script (`start_enviroment.sh`) automatiza la instalación de `uv` y las dependencias del proyecto para el entorno de desarrollo en DevContainer.

## 🚀 Características

- ✅ Instalación automática de `uv` (gestor de paquetes Python)
- ✅ Instalación de dependencias del sistema (PostgreSQL dev libs, build tools, etc.)
- ✅ Sincronización de dependencias Python con `uv sync`
- ✅ Configuración automática de variables de entorno
- ✅ Verificación de la instalación
- ✅ Mensajes informativos con colores
- ✅ Manejo robusto de errores
- ✅ Ejecución automática en `postCreateCommand` del devcontainer

## 📋 Uso

### En Desarrollo (DevContainer)

El script se ejecuta **automáticamente** cuando se crea el devcontainer gracias a la configuración en `.devcontainer/devcontainer.json`.

También puedes ejecutarlo manualmente:

```bash
# Ejecutar el script
./scripts/start_enviroment.sh

# O desde cualquier ubicación
bash /workspaces/backend/scripts/start_enviroment.sh
```

### Verificar el Estado del Entorno

```bash
# Verificar instalación y configuración
./scripts/check_environment.sh
```

## 🔧 Requisitos Previos

- Python 3.13+ (incluido en el devcontainer)
- curl (incluido en el devcontainer)
- bash
- DevContainer configurado

## 📁 Archivos Relacionados

```
backend/
├── .devcontainer/
│   └── devcontainer.json          # Configuración del devcontainer
├── scripts/
│   ├── start_enviroment.sh        # Script principal de instalación
│   ├── check_environment.sh       # Script de verificación
│   └── README.md                  # Esta documentación
├── .env.example                   # Template de variables de entorno
├── pyproject.toml                 # Dependencias del proyecto (uv)
└── Makefile                       # Comandos útiles
```

## 🛠️ Funcionalidades del Script

### 1. Verificación de Python
Verifica que Python 3 esté instalado y disponible.

### 2. Instalación de Dependencias del Sistema
Instala (si tiene permisos de root):
- curl y ca-certificates
- build-essential / build-base
- libpq-dev / postgresql-dev (para PostgreSQL)
- python3-dev
- git

### 3. Instalación de uv
- Verifica si `uv` ya está instalado
- Si no, lo instala usando el instalador oficial de Astral
- Agrega `uv` al PATH

### 4. Configuración del Entorno
- Busca archivo `.env`
- Si no existe, lo crea desde `.env.example`

### 5. Sincronización de Dependencias
- Lee `pyproject.toml`
- Ejecuta `uv sync` para instalar todas las dependencias
- Si no existe `pyproject.toml`, inicializa un proyecto base

### 6. Verificación Final
Verifica que todas las herramientas estén disponibles correctamente.

## 🎨 Output del Script

El script proporciona feedback visual con colores:
- 🟢 **Verde**: Mensajes informativos y éxitos
- 🟡 **Amarillo**: Advertencias
- 🔴 **Rojo**: Errores

Ejemplo:
```
===================================
  Configuración del Entorno HR
===================================

[INFO] Iniciando configuración del entorno: development
[INFO] Verificando Python...
[INFO] Python encontrado: Python 3.13.0
[INFO] Verificando instalación de uv...
[INFO] ✓ uv instalado correctamente: uv 0.4.0
[INFO] Configurando variables de entorno...
[INFO] ✓ Archivo .env encontrado
[INFO] Sincronizando dependencias del proyecto...
[INFO] ✓ Dependencias sincronizadas correctamente
[INFO] ✓ Todas las verificaciones pasaron correctamente

===================================
  ✓ Configuración completada
===================================

Comandos útiles:
  - Ejecutar servidor: uv run uvicorn app.main:app --reload
  - Ejecutar tests: uv run pytest -v
  - Agregar dependencia: uv add <package>
```

## � DevContainer

El devcontainer está configurado para:
- Base image: `mcr.microsoft.com/devcontainers/python:1-3.13-bullseye`
- Ejecución automática del script en `postCreateCommand`
- Extensiones de VS Code preconfiguradas (Python, Ruff, Black, etc.)
- Puertos 8000 (FastAPI) y 5432 (PostgreSQL) expuestos
- Variable de entorno `ENV=development` configurada

## 🔒 Seguridad

- ✅ Variables de entorno para secretos
- ✅ `.env` no incluido en Git (usar `.env.example` como plantilla)
- ✅ Dependencias verificadas con `uv.lock`
- ✅ SQLite para desarrollo (sin credenciales expuestas)

## 🧪 Testing

Para probar el script localmente:

```bash
# Test en modo dry-run (sin modificar nada)
ENV=development bash -x ./scripts/start_enviroment.sh

# Test completo
./scripts/start_enviroment.sh
```

## 📚 Comandos Útiles Post-Instalación

```bash
# Agregar una dependencia
uv add fastapi sqlmodel

# Agregar dependencia de desarrollo
uv add --dev pytest httpx

# Actualizar dependencias
uv sync --upgrade

# Ejecutar servidor de desarrollo
uv run uvicorn app.main:app --reload --port 8000

# Ejecutar tests
uv run pytest -v

# Ejecutar linting
uv run ruff check . --fix

# Crear migración
uv run alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
uv run alembic upgrade head
```

## 🆘 Troubleshooting

### Error: "uv: command not found"
```bash
# Asegúrate de que uv esté en el PATH
export PATH="$HOME/.cargo/bin:$PATH"

# O reinstala uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Error: "Permission denied"
```bash
# Dar permisos de ejecución al script
chmod +x ./scripts/start_enviroment.sh
```

### Error de dependencias del sistema
```bash
# Ejecutar con sudo (solo desarrollo local)
sudo ./scripts/start_enviroment.sh
```

## 📝 Notas

- El script es idempotente: puede ejecutarse múltiples veces sin problemas
- En producción, se recomienda usar variables de entorno en lugar de `.env`
- Para PostgreSQL en producción, actualiza `DATABASE_URL` en `.env`
- El script detecta automáticamente el gestor de paquetes (apt/apk)

## 🤝 Contribución

Si encuentras algún problema o mejora, por favor reporta un issue o crea un PR.
