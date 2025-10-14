.PHONY: help install dev test lint format clean migration migrate shell check all status

# Variables
PYTHON := uv run python
FASTAPI := uv run fastapi
PYTEST := uv run pytest
RUFF := uv run ruff
BLACK := uv run black
ALEMBIC := uv run alembic

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instalar dependencias con uv
	@echo "📦 Instalando dependencias..."
	./scripts/start_enviroment.sh

dev: ## Ejecutar servidor de desarrollo
	@echo "🚀 Iniciando servidor de desarrollo..."
	@echo "📝 Usando: fastapi dev (con auto-reload)"
	$(FASTAPI) dev app/main.py --host 0.0.0.0 --port 8000

test: ## Ejecutar tests
	@echo "🧪 Ejecutando tests..."
	$(PYTEST) -v

test-cov: ## Ejecutar tests con cobertura
	@echo "🧪 Ejecutando tests con cobertura..."
	$(PYTEST) --cov=app --cov-report=html --cov-report=term

lint: ## Ejecutar linting
	@echo "🔍 Ejecutando linting..."
	$(RUFF) check .

lint-fix: ## Ejecutar linting y arreglar automáticamente
	@echo "🔧 Ejecutando linting con auto-fix..."
	$(RUFF) check . --fix

format: ## Formatear código con black
	@echo "✨ Formateando código..."
	$(BLACK) .

format-check: ## Verificar formato sin modificar
	@echo "✨ Verificando formato..."
	$(BLACK) . --check

migration: ## Crear nueva migración
	@read -p "Nombre de la migración: " name; \
	echo "📝 Creando migración: $$name"; \
	$(ALEMBIC) revision --autogenerate -m "$$name"

migrate: ## Aplicar migraciones
	@echo "⬆️  Aplicando migraciones..."
	$(ALEMBIC) upgrade head

migrate-down: ## Revertir última migración
	@echo "⬇️  Revirtiendo migración..."
	$(ALEMBIC) downgrade -1

seed: ## Ejecutar seed de datos
	@echo "🌱 Ejecutando seed..."
	$(PYTHON) -m app.scripts.seed_data

clean: ## Limpiar archivos temporales
	@echo "🧹 Limpiando archivos temporales..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	rm -f hr_dev.db
	@echo "✅ Limpieza completada"

status: ## Verificar estado del entorno
	@echo "� Verificando estado del entorno..."
	./scripts/check_environment.sh

shell: ## Abrir shell de Python con contexto de la app
	@echo "🐚 Abriendo shell..."
	$(PYTHON) -i -c "from app.database import *; from app.models import *"

check: lint format-check test ## Ejecutar todas las verificaciones

all: install migrate dev ## Instalar, migrar y ejecutar

.DEFAULT_GOAL := help
