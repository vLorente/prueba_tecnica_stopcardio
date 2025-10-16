.PHONY: help setup install start build test test-once test-watch clean lint format dev

# Variables
SCRIPTS_DIR = scripts
NODE_MODULES = node_modules

# Colores para output
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[0;33m
NC = \033[0m # No Color

## help: Muestra esta ayuda
help:
	@echo "$(BLUE)Comandos disponibles:$(NC)"
	@echo ""
	@echo "  $(GREEN)make setup$(NC)        - Configura el entorno de desarrollo (instala Chrome y dependencias)"
	@echo "  $(GREEN)make install$(NC)      - Instala solo las dependencias de npm"
	@echo "  $(GREEN)make start$(NC)        - Inicia el servidor de desarrollo"
	@echo "  $(GREEN)make build$(NC)        - Compila el proyecto para producción"
	@echo "  $(GREEN)make test$(NC)         - Ejecuta los tests en modo watch"
	@echo "  $(GREEN)make test-once$(NC)    - Ejecuta los tests una sola vez"
	@echo "  $(GREEN)make test-watch$(NC)   - Ejecuta los tests en modo watch (alias de test)"
	@echo "  $(GREEN)make dev$(NC)          - Compila en modo desarrollo con watch"
	@echo "  $(GREEN)make clean$(NC)        - Limpia archivos generados y node_modules"
	@echo "  $(GREEN)make lint$(NC)         - Ejecuta el linter (cuando esté configurado)"
	@echo "  $(GREEN)make format$(NC)       - Formatea el código con Prettier"
	@echo ""

## setup: Configura el entorno completo de desarrollo
setup:
	@echo "$(BLUE)Configurando entorno de desarrollo...$(NC)"
	@bash $(SCRIPTS_DIR)/setup-dev-env.sh

## install: Instala las dependencias de npm
install:
	@echo "$(BLUE)Instalando dependencias...$(NC)"
	@npm install
	@echo "$(GREEN)✓ Dependencias instaladas$(NC)"

## start: Inicia el servidor de desarrollo
start:
	@echo "$(BLUE)Iniciando servidor de desarrollo...$(NC)"
	@npm start

## build: Compila el proyecto para producción
build:
	@echo "$(BLUE)Compilando proyecto...$(NC)"
	@npm run build
	@echo "$(GREEN)✓ Proyecto compilado$(NC)"

## test: Ejecuta los tests en modo watch
test:
	@echo "$(BLUE)Ejecutando tests en modo watch...$(NC)"
	@npm test

## test-once: Ejecuta los tests una sola vez
test-once:
	@echo "$(BLUE)Ejecutando tests una vez...$(NC)"
	@npm test -- --no-watch --browsers=ChromeHeadlessCI
	@echo "$(GREEN)✓ Tests completados$(NC)"

## test-watch: Ejecuta los tests en modo watch (alias de test)
test-watch:
	@echo "$(BLUE)Ejecutando tests en modo watch...$(NC)"
	@npm test -- --watch

## dev: Compila en modo desarrollo con watch
dev:
	@echo "$(BLUE)Compilando en modo desarrollo...$(NC)"
	@npm run watch

## clean: Limpia archivos generados
clean:
	@echo "$(YELLOW)Limpiando archivos generados...$(NC)"
	@rm -rf dist/
	@rm -rf .angular/
	@rm -rf coverage/
	@echo "$(GREEN)✓ Archivos de compilación eliminados$(NC)"

## clean-all: Limpia todo incluyendo node_modules
clean-all: clean
	@echo "$(YELLOW)Eliminando node_modules...$(NC)"
	@rm -rf $(NODE_MODULES)
	@rm -f package-lock.json
	@echo "$(GREEN)✓ Limpieza completa realizada$(NC)"

## lint: Ejecuta el linter
lint:
	@echo "$(BLUE)Ejecutando linter...$(NC)"
	@npx ng lint || echo "$(YELLOW)⚠ Linter no configurado todavía$(NC)"

## format: Formatea el código con Prettier
format:
	@echo "$(BLUE)Formateando código...$(NC)"
	@npx prettier --write "src/**/*.{ts,html,css,scss,json}"
	@echo "$(GREEN)✓ Código formateado$(NC)"

## check-format: Verifica el formato del código
check-format:
	@echo "$(BLUE)Verificando formato...$(NC)"
	@npx prettier --check "src/**/*.{ts,html,css,scss,json}"

## ng: Ejecuta comandos de Angular CLI (uso: make ng cmd="generate component my-component")
ng:
	@npx ng $(cmd)

# Comando por defecto
.DEFAULT_GOAL := help
