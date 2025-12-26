-- ============================================
-- Migration: Add Tamo (Bedding) Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS tamo (
  id SERIAL PRIMARY KEY,
  galpon_id INT NOT NULL REFERENCES galpones(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tipo_material VARCHAR(50) NOT NULL, -- viruta, cascarilla, paja, etc.
  cantidad_kg DECIMAL(10,2) NOT NULL, -- cantidad aplicada en kg
  espanol_cm DECIMAL(5,2), -- espesor del tamo en cm
  calidad VARCHAR(20) CHECK (calidad IN ('excelente', 'buena', 'regular', 'mala')) DEFAULT 'buena',
  humedad_percent DECIMAL(5,2), -- porcentaje de humedad
  observaciones TEXT,
  aplicado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tamo_galpon ON tamo(galpon_id);
CREATE INDEX IF NOT EXISTS idx_tamo_fecha ON tamo(fecha);

