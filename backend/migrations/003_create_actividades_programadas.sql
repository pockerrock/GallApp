-- Migración: Crear tabla actividades_programadas
-- Fecha: 2025-01-21
-- Descripción: Tabla para el sistema de calendario de actividades programadas

CREATE TABLE IF NOT EXISTS actividades_programadas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('vacunacion', 'limpieza', 'mantenimiento', 'revision_veterinaria', 'pesaje', 'cambio_alimento', 'otro')),
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP,
  todo_el_dia BOOLEAN NOT NULL DEFAULT FALSE,
  galpon_id INTEGER REFERENCES galpones(id) ON DELETE SET NULL,
  completada BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_completada TIMESTAMP,
  prioridad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  recordatorio BOOLEAN NOT NULL DEFAULT FALSE,
  minutos_antes INTEGER DEFAULT 60,
  notas TEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_actividades_fecha_inicio ON actividades_programadas(fecha_inicio);
CREATE INDEX idx_actividades_galpon ON actividades_programadas(galpon_id);
CREATE INDEX idx_actividades_completada ON actividades_programadas(completada);
CREATE INDEX idx_actividades_tipo ON actividades_programadas(tipo);

-- Comentarios
COMMENT ON TABLE actividades_programadas IS 'Registro de actividades programadas para el calendario';
COMMENT ON COLUMN actividades_programadas.tipo IS 'Tipo de actividad: vacunacion, limpieza, mantenimiento, revision_veterinaria, pesaje, cambio_alimento, otro';
COMMENT ON COLUMN actividades_programadas.prioridad IS 'Prioridad de la actividad: baja, media, alta, urgente';
COMMENT ON COLUMN actividades_programadas.todo_el_dia IS 'Indica si la actividad dura todo el día';
COMMENT ON COLUMN actividades_programadas.completada IS 'Indica si la actividad fue completada';
COMMENT ON COLUMN actividades_programadas.recordatorio IS 'Indica si debe mostrar recordatorio';
COMMENT ON COLUMN actividades_programadas.minutos_antes IS 'Minutos antes de la actividad para mostrar recordatorio';
