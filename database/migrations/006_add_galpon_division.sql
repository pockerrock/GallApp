-- ============================================
-- Migration: Add Galpon Division Support
-- ============================================

-- Add fields to track galpon division
ALTER TABLE galpones 
ADD COLUMN IF NOT EXISTS galpon_padre_id INT REFERENCES galpones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS division_sufijo VARCHAR(10), -- 'A', 'B', etc.
ADD COLUMN IF NOT EXISTS es_division BOOLEAN DEFAULT FALSE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_galpones_padre ON galpones(galpon_padre_id);

-- Update unique constraint to allow divisions (granja_id, numero, division_sufijo)
ALTER TABLE galpones DROP CONSTRAINT IF EXISTS galpones_granja_id_numero_key;
CREATE UNIQUE INDEX IF NOT EXISTS galpones_granja_numero_sufijo_unique 
ON galpones(granja_id, numero, COALESCE(division_sufijo, ''));

