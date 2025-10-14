#!/bin/bash
# Script para verificar el estado del entorno de desarrollo

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  Estado del Entorno HR Backend${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Función para verificar comando
check_command() {
    local cmd=$1
    local name=$2
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        echo -e "${GREEN}✓${NC} $name: ${GREEN}instalado${NC} - $version"
        return 0
    else
        echo -e "${RED}✗${NC} $name: ${RED}no instalado${NC}"
        return 1
    fi
}

# Verificar Python
echo -e "${YELLOW}[Python]${NC}"
check_command "python3" "Python"
echo ""

# Verificar uv
echo -e "${YELLOW}[Gestor de Paquetes]${NC}"
check_command "uv" "uv"
echo ""

# Verificar Git
echo -e "${YELLOW}[Control de Versiones]${NC}"
check_command "git" "Git"
echo ""

# Verificar herramientas de desarrollo
echo -e "${YELLOW}[Herramientas de Desarrollo]${NC}"
check_command "curl" "curl"
check_command "make" "make"
echo ""

# Verificar estructura del proyecto
echo -e "${YELLOW}[Estructura del Proyecto]${NC}"
if [ -f "pyproject.toml" ]; then
    echo -e "${GREEN}✓${NC} pyproject.toml: ${GREEN}encontrado${NC}"
else
    echo -e "${RED}✗${NC} pyproject.toml: ${RED}no encontrado${NC}"
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env: ${GREEN}encontrado${NC}"
else
    echo -e "${YELLOW}!${NC} .env: ${YELLOW}no encontrado${NC} (usa .env.example como plantilla)"
fi

if [ -d ".venv" ]; then
    echo -e "${GREEN}✓${NC} .venv: ${GREEN}encontrado${NC}"
else
    echo -e "${YELLOW}!${NC} .venv: ${YELLOW}no encontrado${NC} (ejecuta 'uv sync')"
fi
echo ""

# Verificar dependencias si existe .venv
if [ -d ".venv" ] || command -v uv &> /dev/null; then
    echo -e "${YELLOW}[Dependencias Python]${NC}"
    if command -v uv &> /dev/null; then
        PACKAGES=$(uv pip list 2>/dev/null | tail -n +3 | wc -l)
        if [ "$PACKAGES" -gt 0 ]; then
            echo -e "${GREEN}✓${NC} Paquetes instalados: ${GREEN}$PACKAGES${NC}"
            
            # Verificar paquetes críticos
            CRITICAL_PACKAGES=("fastapi" "sqlmodel" "uvicorn" "alembic" "pytest")
            for pkg in "${CRITICAL_PACKAGES[@]}"; do
                if uv pip show "$pkg" &> /dev/null; then
                    VERSION=$(uv pip show "$pkg" 2>/dev/null | grep "Version:" | cut -d' ' -f2)
                    echo -e "  ${GREEN}✓${NC} $pkg: $VERSION"
                else
                    echo -e "  ${YELLOW}!${NC} $pkg: ${YELLOW}no instalado${NC} (ejecuta 'uv add $pkg')"
                fi
            done
        else
            echo -e "${YELLOW}!${NC} No hay paquetes instalados (ejecuta 'uv sync')"
        fi
    else
        echo -e "${RED}✗${NC} uv no está disponible"
    fi
    echo ""
fi

# Verificar base de datos
echo -e "${YELLOW}[Base de Datos]${NC}"
if [ -f "hr_dev.db" ]; then
    SIZE=$(du -h hr_dev.db | cut -f1)
    echo -e "${GREEN}✓${NC} SQLite (hr_dev.db): ${GREEN}$SIZE${NC}"
else
    echo -e "${YELLOW}!${NC} SQLite: ${YELLOW}no inicializada${NC}"
fi
echo ""

# Resumen final
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  Comandos Útiles${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""
echo "  Instalación:"
echo "    make install         - Instalar/actualizar dependencias"
echo "    uv add <paquete>     - Agregar nueva dependencia"
echo ""
echo "  Desarrollo:"
echo "    make dev             - Iniciar servidor de desarrollo"
echo "    make test            - Ejecutar tests"
echo "    make lint            - Verificar código"
echo "    make format          - Formatear código"
echo ""
echo "  Base de Datos:"
echo "    make migration       - Crear nueva migración"
echo "    make migrate         - Aplicar migraciones"
echo ""
echo "  Ayuda:"
echo "    make help            - Ver todos los comandos"
echo ""
