#!/bin/bash

# Script de configuración del entorno de desarrollo Angular
# Instala todas las dependencias necesarias para desarrollo y testing

set -e  # Salir si hay algún error

echo "==================================="
echo "Configurando entorno de desarrollo"
echo "==================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_step() {
    echo -e "${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Verificar Node.js y npm
print_step "Verificando Node.js y npm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    print_success "Node.js $NODE_VERSION y npm $NPM_VERSION detectados"
else
    print_error "Node.js no está instalado. Por favor, instálalo primero."
    exit 1
fi
echo ""

# 2. Instalar dependencias de npm
print_step "Instalando dependencias de npm..."
npm install
print_success "Dependencias de npm instaladas"
echo ""

# 3. Instalar Google Chrome
print_step "Verificando Google Chrome para tests..."
if command -v google-chrome &> /dev/null || command -v google-chrome-stable &> /dev/null; then
    CHROME_VERSION=$(google-chrome --version 2>/dev/null || google-chrome-stable --version 2>/dev/null)
    print_success "Chrome ya está instalado: $CHROME_VERSION"
else
    print_step "Instalando Google Chrome..."

    # Descargar e instalar Chrome
    wget -q -O /tmp/google-chrome-stable_current_amd64.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

    # Instalar Chrome (requiere sudo)
    if command -v sudo &> /dev/null; then
        sudo apt-get update -qq
        sudo apt-get install -y /tmp/google-chrome-stable_current_amd64.deb
        sudo apt-get install -f -y  # Resolver dependencias
    else
        apt-get update -qq
        apt-get install -y /tmp/google-chrome-stable_current_amd64.deb
        apt-get install -f -y
    fi

    # Limpiar archivo temporal
    rm /tmp/google-chrome-stable_current_amd64.deb

    CHROME_VERSION=$(google-chrome --version 2>/dev/null || google-chrome-stable --version 2>/dev/null)
    print_success "Chrome instalado: $CHROME_VERSION"
fi

# Configurar variable de entorno CHROME_BIN
if command -v google-chrome-stable &> /dev/null; then
    CHROME_PATH=$(which google-chrome-stable)
elif command -v google-chrome &> /dev/null; then
    CHROME_PATH=$(which google-chrome)
else
    print_error "No se pudo encontrar el binario de Chrome"
    exit 1
fi

print_step "Configurando variable de entorno CHROME_BIN..."
export CHROME_BIN="$CHROME_PATH"

# Agregar a .bashrc si no existe
if ! grep -q "export CHROME_BIN=" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Chrome binary para Karma tests" >> ~/.bashrc
    echo "export CHROME_BIN=\"$CHROME_PATH\"" >> ~/.bashrc
    print_success "Variable CHROME_BIN agregada a ~/.bashrc"
else
    print_success "Variable CHROME_BIN ya existe en ~/.bashrc"
fi

print_success "CHROME_BIN configurado: $CHROME_BIN"
echo ""

# 4. Verificar Angular CLI
print_step "Verificando Angular CLI..."
if npx ng version &> /dev/null; then
    print_success "Angular CLI disponible"
else
    print_error "Angular CLI no está disponible"
    exit 1
fi
echo ""

# 5. Verificar configuración de Karma
print_step "Verificando configuración de Karma..."
if [ -f "karma.conf.js" ]; then
    print_success "karma.conf.js encontrado"
else
    print_error "karma.conf.js no encontrado"
fi
echo ""

# Resumen final
echo "==================================="
echo -e "${GREEN}Entorno configurado correctamente${NC}"
echo "==================================="
echo ""
echo "Variables de entorno configuradas:"
echo "  CHROME_BIN=$CHROME_BIN"
echo ""
echo "Comandos disponibles:"
echo "  npm start          - Iniciar servidor de desarrollo"
echo "  npm test           - Ejecutar tests con Karma"
echo "  npm run build      - Compilar para producción"
echo "  npm run watch      - Compilar en modo watch"
echo ""
echo "El servidor de desarrollo estará disponible en:"
echo "  http://localhost:4200"
echo ""
echo -e "${YELLOW}Nota: Recarga tu terminal o ejecuta 'source ~/.bashrc' para aplicar las variables de entorno${NC}"
echo ""
