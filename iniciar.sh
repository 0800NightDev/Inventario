#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Inventario Radiografía — Script de Inicio Local
#  Instala dependencias y arranca el servidor de desarrollo
# ═══════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════"
echo "  🏥 Inventario Radiografía — Servidor Local"
echo "═══════════════════════════════════════════════════════"
echo ""

# Verificar que existe .env
if [ ! -f .env ]; then
    echo "⚠️  No se encontró archivo .env"
    echo "   Copiando .env.example → .env"
    echo "   ¡IMPORTANTE! Edita .env con tus credenciales de Supabase"
    cp .env.example .env
    echo ""
fi

# Instalar dependencias si no existen
if [ ! -d node_modules ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

echo "🚀 Arrancando servidor de desarrollo..."
echo "   URL Local: http://localhost:8888"
echo "   Funciones: http://localhost:8888/api/"
echo ""
echo "   Credenciales por defecto:"
echo "   └─ Superusuario: admin / admin123"
echo "   └─ Administrador: administrador / admin123"
echo "   └─ Trabajador: trabajador / trabajador123"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

node scripts/dev-server.js
