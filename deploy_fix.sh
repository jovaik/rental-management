#!/bin/bash

echo "🚀 Script de Deployment - Fix Tenant Error"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "middleware.ts" ]; then
    echo -e "${RED}❌ Error: No se encuentra middleware.ts${NC}"
    echo "Por favor ejecuta este script desde /home/ubuntu/rental_management/"
    exit 1
fi

echo -e "${YELLOW}📝 Verificando commits...${NC}"
git log --oneline -1
echo ""

echo -e "${YELLOW}🔄 Intentando hacer push a GitHub...${NC}"
if git push origin main; then
    echo -e "${GREEN}✅ Push exitoso!${NC}"
else
    echo -e "${RED}❌ Push falló - Token de GitHub puede estar caducado${NC}"
    echo -e "${YELLOW}Opciones alternativas:${NC}"
    echo "  1. Sube los archivos manualmente a: https://github.com/jovaik/rental-management"
    echo "  2. Usa GitHub Desktop o CLI autenticado"
    echo "  3. Configura un nuevo token en: https://github.com/settings/tokens"
    echo ""
    read -p "¿Quieres continuar con el deploy local? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}📦 Verificando Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Instalando Vercel CLI...${NC}"
    npm install -g vercel
fi

echo ""
echo -e "${YELLOW}🔐 Login a Vercel (si es necesario)...${NC}"
echo "Por favor completa la autenticación en el navegador"
vercel login

echo ""
echo -e "${YELLOW}⚙️  IMPORTANTE: Configurar Variable de Entorno${NC}"
echo ""
echo "Antes de continuar, necesitas configurar la variable de entorno en Vercel:"
echo ""
echo -e "${GREEN}DEFAULT_TENANT_SUBDOMAIN=demo${NC}"
echo ""
echo "Opciones:"
echo "  1. Usar el comando: vercel env add DEFAULT_TENANT_SUBDOMAIN"
echo "  2. Ir a: https://vercel.com/jovaiks-projects/rental-management/settings/environment-variables"
echo ""
read -p "¿Ya configuraste la variable de entorno? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Configurando variable de entorno...${NC}"
    echo "demo" | vercel env add DEFAULT_TENANT_SUBDOMAIN production preview development
fi

echo ""
echo -e "${YELLOW}🚀 Desplegando a Vercel...${NC}"
echo ""
vercel --prod

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Deploy Completado!"
echo "==========================================${NC}"
echo ""
echo "📱 Prueba la aplicación en:"
echo "   https://rental-management-pkjgwm09m-jovaiks-projects.vercel.app"
echo ""
echo "🔍 Acceso con diferentes tenants:"
echo "   ?tenant=demo          (por defecto)"
echo "   ?tenant=test"
echo "   ?tenant=scooters-madrid"
echo "   ?tenant=boats-marbella"
echo ""
echo "📚 Documentación completa en:"
echo "   SOLUCION_TENANT_ERROR.md"
echo ""
