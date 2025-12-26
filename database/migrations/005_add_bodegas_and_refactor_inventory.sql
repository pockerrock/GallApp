-- ============================================
-- Migration: Add Bodegas (Warehouses) and refactor inventory
-- ============================================

-- Create bodegas table
CREATE TABLE IF NOT EXISTS bodegas (
  id SERIAL PRIMARY KEY,
  granja_id INT NOT NULL REFERENCES granjas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  ubicacion VARCHAR(200),
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(granja_id, nombre)
);

-- Add bodega_id to lotes_alimento
ALTER TABLE lotes_alimento 
ADD COLUMN IF NOT EXISTS bodega_id INT REFERENCES bodegas(id) ON DELETE SET NULL;

-- Add bodega_id to inventario_alimento
ALTER TABLE inventario_alimento 
ADD COLUMN IF NOT EXISTS bodega_id INT REFERENCES bodegas(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bodegas_granja ON bodegas(granja_id);
CREATE INDEX IF NOT EXISTS idx_lotes_bodega ON lotes_alimento(bodega_id);
CREATE INDEX IF NOT EXISTS idx_inventario_bodega ON inventario_alimento(bodega_id);

