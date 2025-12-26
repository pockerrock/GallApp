-- Migración: Agregar campo cantidad_bultos a registros_diarios
-- Fecha: 2025-01-25
-- Descripción: Agrega el campo cantidad_bultos (número de bultos/bolsas de alimento) a la tabla registros_diarios

-- Agregar columna cantidad_bultos
ALTER TABLE registros_diarios
ADD COLUMN IF NOT EXISTS cantidad_bultos INTEGER DEFAULT 0;

-- Agregar constraint para validar que no sea negativo
ALTER TABLE registros_diarios
ADD CONSTRAINT check_cantidad_bultos_positive
CHECK (cantidad_bultos >= 0);

-- Comentario
COMMENT ON COLUMN registros_diarios.cantidad_bultos IS 'Cantidad de bultos o bolsas de alimento consumidos en el día';
