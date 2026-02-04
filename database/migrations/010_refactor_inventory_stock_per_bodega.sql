-- ============================================
-- Migration 010: Refactor inventario para stock por bodega
-- ============================================

-- 1) Crear tabla stock_lote_bodega
CREATE TABLE IF NOT EXISTS stock_lote_bodega (
  id SERIAL PRIMARY KEY,
  lote_id INT NOT NULL REFERENCES lotes_alimento(id) ON DELETE CASCADE,
  bodega_id INT NOT NULL REFERENCES bodegas(id) ON DELETE CASCADE,
  cantidad_actual DECIMAL(10,2) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT stock_lote_bodega_lote_bodega_unique UNIQUE (lote_id, bodega_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_stock_lote_bodega_lote ON stock_lote_bodega(lote_id);
CREATE INDEX IF NOT EXISTS idx_stock_lote_bodega_bodega ON stock_lote_bodega(bodega_id);

-- 2) Extender inventario_alimento para nuevos tipos y traslados
DO $$
BEGIN
  -- Eliminar constraint de tipo_movimiento si existe y recrearlo
  IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'inventario_alimento'
      AND constraint_name = 'inventario_alimento_tipo_movimiento_check'
  ) THEN
    ALTER TABLE inventario_alimento
      DROP CONSTRAINT inventario_alimento_tipo_movimiento_check;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Tabla no existe en este entorno, continuar
    NULL;
END $$;

ALTER TABLE inventario_alimento
  ADD CONSTRAINT inventario_alimento_tipo_movimiento_check
  CHECK (tipo_movimiento IN ('entrada', 'consumo', 'traslado', 'ajuste'));

-- Renombrar movimientos antiguos 'salida' a 'consumo'
UPDATE inventario_alimento
SET tipo_movimiento = 'consumo'
WHERE tipo_movimiento = 'salida';

-- Columnas para traslados entre bodegas
ALTER TABLE inventario_alimento
  ADD COLUMN IF NOT EXISTS bodega_origen_id INT REFERENCES bodegas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bodega_destino_id INT REFERENCES bodegas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventario_bodega_origen ON inventario_alimento(bodega_origen_id);
CREATE INDEX IF NOT EXISTS idx_inventario_bodega_destino ON inventario_alimento(bodega_destino_id);

-- 3) Vincular galpones con bodegas (bodega desde donde consumen)
ALTER TABLE galpones
  ADD COLUMN IF NOT EXISTS bodega_id INT REFERENCES bodegas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_galpones_bodega ON galpones(bodega_id);

-- 4) Migrar stock existente: por ahora, un registro por lote y su bodega actual (si existe)
--    Si el lote no tiene bodega asignada, mantiene su stock global en la columna cantidad_actual
INSERT INTO stock_lote_bodega (lote_id, bodega_id, cantidad_actual)
SELECT
  l.id AS lote_id,
  l.bodega_id AS bodega_id,
  l.cantidad_actual AS cantidad_actual
FROM lotes_alimento l
WHERE l.bodega_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM stock_lote_bodega s
    WHERE s.lote_id = l.id
      AND s.bodega_id = l.bodega_id
  );

-- Nota:
--  - A partir de ahora, el stock "real" se maneja en stock_lote_bodega.
--  - La columna lotes_alimento.cantidad_actual se puede considerar derivada
--    (suma de todos los registros de stock_lote_bodega para ese lote) y
--    se mantiene solo por compatibilidad histórica.

