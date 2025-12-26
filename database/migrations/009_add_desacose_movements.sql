-- ============================================
-- Migration: Add Desacose (Animal Movement) Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS desacose (
  id SERIAL PRIMARY KEY,
  galpon_origen_id INT NOT NULL REFERENCES galpones(id) ON DELETE CASCADE,
  galpon_destino_id INT NOT NULL REFERENCES galpones(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  cantidad_aves INT NOT NULL,
  motivo VARCHAR(100), -- razon del movimiento
  observaciones TEXT,
  realizado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (galpon_origen_id != galpon_destino_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_desacose_origen ON desacose(galpon_origen_id);
CREATE INDEX IF NOT EXISTS idx_desacose_destino ON desacose(galpon_destino_id);
CREATE INDEX IF NOT EXISTS idx_desacose_fecha ON desacose(fecha);

