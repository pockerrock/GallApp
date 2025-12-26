#!/bin/bash

# Script de migración para desplegar el schema en Render
# GallinaApp - Database Migration

echo "🐔 GallinaApp - Migración de Base de Datos"
echo "=========================================="
echo ""

# Credenciales de la base de datos
export PGPASSWORD="rirZJruhBjgIPzfPpiZncl6TlGFdy5YF"
DB_HOST="dpg-d4avpr6mcj7s739g7qbg-a.oregon-postgres.render.com"
DB_PORT="5432"
DB_NAME="basegallinapp"
DB_USER="basegallinapp_user"

# Verificar que existan los archivos SQL
if [ ! -f "database/schema.sql" ]; then
    echo "❌ Error: No se encuentra database/schema.sql"
    exit 1
fi

echo "📊 Ejecutando schema..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema ejecutado correctamente"
else
    echo "❌ Error al ejecutar el schema"
    exit 1
fi

echo ""
read -p "¿Deseas cargar los datos de prueba? (s/n): " respuesta

if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
    if [ -f "database/migrations/seed.sql" ]; then
        echo "📦 Cargando datos de prueba..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/seed.sql

        if [ $? -eq 0 ]; then
            echo "✅ Datos de prueba cargados correctamente"
        else
            echo "❌ Error al cargar datos de prueba"
        fi
    else
        echo "❌ Error: No se encuentra database/migrations/seed.sql"
    fi
fi

echo ""
echo "✅ Migración completada"
echo ""
echo "🔗 Usuarios de prueba:"
echo "  - dueno@elolimp.com / password123"
echo "  - supervisor@elolimp.com / password123"
echo "  - trabajador@elolimp.com / password123"
