-- ============================================
-- GallinaApp - Esquema de Base de Datos
-- Sistema de Gestión Avícola
-- ============================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS registros_diarios CASCADE;
DROP TABLE IF EXISTS inventario_alimento CASCADE;
DROP TABLE IF EXISTS lotes_alimento CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS galpones CASCADE;
DROP TABLE IF EXISTS granjas CASCADE;

-- ============================================
-- TABLA: granjas
-- Almacena información de las granjas avícolas
-- ============================================
CREATE TABLE granjas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ubicacion VARCHAR(200),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: galpones
-- Almacena información de los galpones por granja
-- ============================================
CREATE TABLE galpones (
  id SERIAL PRIMARY KEY,
  granja_id INT NOT NULL REFERENCES granjas(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  nombre VARCHAR(100),
  sexo CHAR(1) CHECK (sexo IN ('M', 'H')), -- M=Macho, H=Hembra
  lote VARCHAR(20),
  capacidad INT NOT NULL,
  aves_iniciales INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(granja_id, numero)
);

-- ============================================
-- TABLA: usuarios
-- Almacena usuarios del sistema con roles
-- ============================================
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('trabajador', 'supervisor', 'dueno')),
  granja_id INT REFERENCES granjas(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: lotes_alimento
-- Almacena información de lotes de alimento
-- ============================================
CREATE TABLE lotes_alimento (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- preiniciador, iniciador, pollito, engorde, etc.
  codigo_lote VARCHAR(50) NOT NULL UNIQUE,
  cantidad_inicial DECIMAL(10,2) NOT NULL, -- en kg
  cantidad_actual DECIMAL(10,2) NOT NULL, -- en kg
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  proveedor VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: inventario_alimento
-- Almacena movimientos de entrada/salida de alimento
-- ============================================
CREATE TABLE inventario_alimento (
  id SERIAL PRIMARY KEY,
  lote_id INT NOT NULL REFERENCES lotes_alimento(id) ON DELETE CASCADE,
  tipo_movimiento VARCHAR(10) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida')),
  cantidad DECIMAL(10,2) NOT NULL, -- en kg
  galpon_id INT REFERENCES galpones(id) ON DELETE SET NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  observaciones TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: registros_diarios
-- Almacena registros diarios de cada galpón
-- ============================================
CREATE TABLE registros_diarios (
  id SERIAL PRIMARY KEY,
  galpon_id INT NOT NULL REFERENCES galpones(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  edad_dias INT NOT NULL,
  consumo_kg DECIMAL(10,2) NOT NULL,
  tipo_alimento VARCHAR(50),
  lote_alimento VARCHAR(50),
  cantidad_bultos INT DEFAULT 0, -- número de bultos/bolsas de alimento
  mortalidad INT DEFAULT 0,
  seleccion INT DEFAULT 0,
  saldo_aves INT NOT NULL,
  peso_promedio DECIMAL(10,2), -- en gramos
  acumulado_alimento DECIMAL(10,2), -- kg acumulados
  temperatura DECIMAL(5,2), -- temperatura del galpón (opcional)
  humedad DECIMAL(5,2), -- humedad del galpón (opcional)
  observaciones TEXT,
  sincronizado BOOLEAN DEFAULT TRUE, -- para modo offline
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(galpon_id, fecha)
);

-- ============================================
-- TABLA: alertas
-- Almacena alertas del sistema
-- ============================================
CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- mortalidad_alta, stock_bajo, peso_bajo, etc.
  mensaje TEXT NOT NULL,
  severidad VARCHAR(20) CHECK (severidad IN ('baja', 'media', 'alta')) DEFAULT 'media',
  galpon_id INT REFERENCES galpones(id) ON DELETE CASCADE,
  lote_id INT REFERENCES lotes_alimento(id) ON DELETE CASCADE,
  fecha TIMESTAMP DEFAULT NOW(),
  atendida BOOLEAN DEFAULT FALSE,
  atendida_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_atencion TIMESTAMP,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES para optimizar consultas
-- ============================================
CREATE INDEX idx_galpones_granja ON galpones(granja_id);
CREATE INDEX idx_galpones_activo ON galpones(activo);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_granja ON usuarios(granja_id);
CREATE INDEX idx_registros_galpon ON registros_diarios(galpon_id);
CREATE INDEX idx_registros_fecha ON registros_diarios(fecha);
CREATE INDEX idx_registros_galpon_fecha ON registros_diarios(galpon_id, fecha);
CREATE INDEX idx_inventario_lote ON inventario_alimento(lote_id);
CREATE INDEX idx_inventario_fecha ON inventario_alimento(fecha);
CREATE INDEX idx_alertas_atendida ON alertas(atendida);
CREATE INDEX idx_alertas_galpon ON alertas(galpon_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar el campo actualizado_en automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar timestamp
CREATE TRIGGER trigger_granjas_actualizado
  BEFORE UPDATE ON granjas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_galpones_actualizado
  BEFORE UPDATE ON galpones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_usuarios_actualizado
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_lotes_actualizado
  BEFORE UPDATE ON lotes_alimento
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_registros_actualizado
  BEFORE UPDATE ON registros_diarios
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

-- ============================================
-- VISTAS útiles para reportes
-- ============================================

-- Vista: Resumen actual de galpones
CREATE OR REPLACE VIEW vista_resumen_galpones AS
WITH ultimos AS (
  SELECT
    galpon_id,
    MAX(fecha) AS ultima_fecha
  FROM registros_diarios
  GROUP BY galpon_id
),
resumen AS (
  SELECT
    r.galpon_id,
    r.mortalidad_total,
    r.consumo_total,
    rd.saldo_aves AS ultimo_saldo,
    rd.peso_promedio AS ultimo_peso
  FROM (
    SELECT
      galpon_id,
      SUM(mortalidad) AS mortalidad_total,
      SUM(consumo_kg) AS consumo_total
    FROM registros_diarios
    GROUP BY galpon_id
  ) r
  LEFT JOIN ultimos u ON r.galpon_id = u.galpon_id
  LEFT JOIN registros_diarios rd
    ON rd.galpon_id = u.galpon_id
   AND rd.fecha = u.ultima_fecha
)
SELECT
  g.id,
  g.numero,
  g.nombre,
  g.sexo,
  g.lote,
  gr.nombre AS granja,
  g.aves_iniciales,
  g.fecha_inicio,
  CURRENT_DATE - g.fecha_inicio AS dias_transcurridos,
  COALESCE(res.ultimo_saldo, g.aves_iniciales) AS saldo_actual,
  COALESCE(res.mortalidad_total, 0) AS mortalidad_total,
  COALESCE(res.consumo_total, 0) AS consumo_total,
  COALESCE(res.ultimo_peso, 0) AS peso_promedio_actual,
  CASE
    WHEN g.aves_iniciales > 0 THEN
      ROUND((COALESCE(res.mortalidad_total, 0)::DECIMAL / g.aves_iniciales * 100), 2)
    ELSE 0
  END AS porcentaje_mortalidad
FROM galpones g
LEFT JOIN granjas gr ON g.granja_id = gr.id
LEFT JOIN resumen res ON g.id = res.galpon_id
WHERE g.activo = TRUE;


-- Vista: Alertas activas con detalles
CREATE OR REPLACE VIEW vista_alertas_activas AS
SELECT
  a.id,
  a.tipo,
  a.mensaje,
  a.severidad,
  a.fecha,
  g.numero as galpon_numero,
  g.nombre as galpon_nombre,
  gr.nombre as granja_nombre,
  l.codigo_lote,
  l.tipo as tipo_alimento
FROM alertas a
LEFT JOIN galpones g ON a.galpon_id = g.id
LEFT JOIN granjas gr ON g.granja_id = gr.id
LEFT JOIN lotes_alimento l ON a.lote_id = l.id
WHERE a.atendida = FALSE
ORDER BY
  CASE a.severidad
    WHEN 'alta' THEN 1
    WHEN 'media' THEN 2
    WHEN 'baja' THEN 3
  END,
  a.fecha DESC;

-- ============================================
-- TABLA: actividades_programadas
-- Almacena actividades del calendario
-- ============================================
CREATE TABLE actividades_programadas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'otro',
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  todo_el_dia BOOLEAN DEFAULT FALSE,
  galpon_id INTEGER REFERENCES galpones(id) ON DELETE SET NULL,
  completada BOOLEAN DEFAULT FALSE,
  fecha_completada TIMESTAMP WITH TIME ZONE,
  prioridad VARCHAR(20) DEFAULT 'media',
  recordatorio BOOLEAN DEFAULT FALSE,
  minutos_antes INTEGER DEFAULT 60,
  notas TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actividades_fecha_inicio ON actividades_programadas(fecha_inicio);
CREATE INDEX idx_actividades_galpon_id ON actividades_programadas(galpon_id);
CREATE TRIGGER trigger_actividades_actualizado
  BEFORE UPDATE ON actividades_programadas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

-- ============================================
-- COMENTARIOS en tablas
-- ============================================
COMMENT ON TABLE granjas IS 'Almacena información de las granjas avícolas';
COMMENT ON TABLE galpones IS 'Almacena información de los galpones de cada granja';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles (trabajador, supervisor, dueño)';
COMMENT ON TABLE lotes_alimento IS 'Lotes de alimento disponibles en inventario';
COMMENT ON TABLE inventario_alimento IS 'Movimientos de entrada y salida de alimento';
COMMENT ON TABLE registros_diarios IS 'Registros diarios de cada galpón';
COMMENT ON TABLE actividades_programadas IS 'Actividades programadas en el calendario';
COMMENT ON TABLE alertas IS 'Alertas generadas por el sistema';

-- ============================================
-- Fin del schema
-- ============================================
