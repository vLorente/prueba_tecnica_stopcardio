#!/bin/bash
# Script de inicialización del entorno para desarrollo y producción
# Instala uv y las dependencias del proyecto

set -e  # Salir si cualquier comando falla
set -u  # Tratar variables no definidas como error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detectar el entorno
ENVIRONMENT="${ENV:-development}"
log_info "Iniciando configuración del entorno: $ENVIRONMENT"

# Función para instalar uv
install_uv() {
    log_info "Verificando instalación de uv..."
    
    if command -v uv &> /dev/null; then
        UV_VERSION=$(uv --version)
        log_info "uv ya está instalado: $UV_VERSION"
    else
        log_info "Instalando uv..."
        
        # Instalar uv usando el instalador oficial
        curl -LsSf https://astral.sh/uv/install.sh | sh
        
        # Agregar uv al PATH para la sesión actual
        export PATH="$HOME/.cargo/bin:$PATH"
        
        if command -v uv &> /dev/null; then
            UV_VERSION=$(uv --version)
            log_info "✓ uv instalado correctamente: $UV_VERSION"
        else
            log_error "Error al instalar uv"
            exit 1
        fi
    fi
}

# Función para instalar dependencias del sistema
install_system_dependencies() {
    log_info "Verificando dependencias del sistema..."
    
    # Detectar el gestor de paquetes
    if command -v apt-get &> /dev/null; then
        log_info "Usando apt-get para instalar dependencias del sistema"
        
        # Actualizar repositorios
        apt-get update -qq
        
        # Instalar dependencias necesarias
        apt-get install -y --no-install-recommends \
            curl \
            ca-certificates \
            build-essential \
            libpq-dev \
            python3-dev \
            git
        
        # Limpiar cache
        apt-get clean
        rm -rf /var/lib/apt/lists/*
        
        log_info "✓ Dependencias del sistema instaladas"
    elif command -v apk &> /dev/null; then
        log_info "Usando apk para instalar dependencias del sistema"
        
        apk add --no-cache \
            curl \
            ca-certificates \
            build-base \
            postgresql-dev \
            python3-dev \
            git
        
        log_info "✓ Dependencias del sistema instaladas"
    else
        log_warn "No se pudo detectar el gestor de paquetes. Continuando..."
    fi
}

# Función para verificar Python
check_python() {
    log_info "Verificando Python..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        log_info "Python encontrado: $PYTHON_VERSION"
    else
        log_error "Python3 no está instalado"
        exit 1
    fi
}

# Función para sincronizar dependencias con uv
sync_dependencies() {
    log_info "Sincronizando dependencias del proyecto..."
    
    # Verificar si existe pyproject.toml
    if [ -f "pyproject.toml" ]; then
        log_info "Archivo pyproject.toml encontrado"
        
        # Sincronizar dependencias
        uv sync
        
        log_info "✓ Dependencias sincronizadas correctamente"
    else
        log_warn "No se encontró pyproject.toml. Creando proyecto base..."
        
        # Inicializar proyecto si no existe
        uv init --no-readme
        
        log_info "Proyecto inicializado. Por favor, configura pyproject.toml"
    fi
}

# Función para configurar variables de entorno
setup_environment() {
    log_info "Configurando variables de entorno..."
    
    # Verificar si existe .env
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_warn "Archivo .env no encontrado. Copiando desde .env.example"
            cp .env.example .env
            log_info "✓ Archivo .env creado desde .env.example"
        else
            log_warn "No se encontró .env ni .env.example"
        fi
    else
        log_info "✓ Archivo .env encontrado"
    fi
}

# Función para verificar la instalación
verify_installation() {
    log_info "Verificando instalación..."
    
    # Verificar uv
    if ! command -v uv &> /dev/null; then
        log_error "uv no está disponible en PATH"
        exit 1
    fi
    
    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 no está disponible"
        exit 1
    fi
    
    log_info "✓ Todas las verificaciones pasaron correctamente"
}

# Main execution
main() {
    log_info "==================================="
    log_info "  Configuración del Entorno HR"
    log_info "==================================="
    echo ""
    
    # Paso 1: Verificar Python
    check_python
    
    # Paso 2: Instalar dependencias del sistema (solo si tenemos permisos)
    if [ "$EUID" -eq 0 ] || [ "$ENVIRONMENT" = "production" ]; then
        install_system_dependencies
    else
        log_info "Saltando instalación de dependencias del sistema (no root)"
    fi
    
    # Paso 3: Instalar uv
    install_uv
    
    # Paso 4: Configurar entorno
    setup_environment
    
    # Paso 5: Sincronizar dependencias
    sync_dependencies
    
    # Paso 6: Verificar instalación
    verify_installation
    
    echo ""
    log_info "==================================="
    log_info "  ✓ Configuración completada"
    log_info "==================================="
    echo ""
    log_info "Comandos útiles:"
    log_info "  - Ejecutar servidor: uv run uvicorn app.main:app --reload"
    log_info "  - Ejecutar tests: uv run pytest -v"
    log_info "  - Agregar dependencia: uv add <package>"
    echo ""
}

# Ejecutar función principal
main "$@"
