-- ============================================
-- Migration: Add Gas Consumption Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS consumo_gas (
  id SERIAL PRIMARY KEY,
  galpon_id INT NOT NULL REFERENCES galpones(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  edad_dias INT NOT NULL,
  lectura_medidor DECIMAL(10,2), -- lectura del medidor de gas
  consumo_m3 DECIMAL(10,2), -- consumo en metros cúbicos
  imagen_url TEXT, -- URL de la imagen del medidor
  observaciones TEXT,
  creado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(galpon_id, fecha, edad_dias)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consumo_gas_galpon ON consumo_gas(galpon_id);
CREATE INDEX IF NOT EXISTS idx_consumo_gas_fecha ON consumo_gas(fecha);
CREATE INDEX IF NOT EXISTS idx_consumo_gas_edad ON consumo_gas(edad_dias);

