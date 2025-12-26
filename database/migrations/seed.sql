-- ============================================
-- GallinaApp - Datos de Prueba (Seed)
-- ============================================

-- Limpiar datos existentes
TRUNCATE TABLE alertas, registros_diarios, inventario_alimento, lotes_alimento, usuarios, galpones, granjas RESTART IDENTITY CASCADE;

-- ============================================
-- GRANJAS
-- ============================================
INSERT INTO granjas (nombre, ubicacion) VALUES
('El Olimpo', 'Vereda La Esperanza, Cundinamarca'),
('La Pradera', 'Municipio de Fusagasugá');

-- ============================================
-- GALPONES
-- ============================================
INSERT INTO galpones (granja_id, numero, nombre, sexo, lote, capacidad, aves_iniciales, fecha_inicio, activo) VALUES
(1, 7, 'Galpón 7', 'M', '63', 5000, 5000, '2024-10-26', TRUE),
(1, 8, 'Galpón 8', 'H', '64', 4500, 4500, '2024-11-01', TRUE),
(1, 9, 'Galpón 9', 'M', '65', 5200, 5200, '2024-11-05', TRUE),
(2, 1, 'Galpón 1', 'M', '20', 3000, 3000, '2024-11-08', TRUE),
(2, 2, 'Galpón 2', 'H', '21', 3500, 3500, '2024-11-10', TRUE);

-- ============================================
-- USUARIOS
-- Contraseña para todos: "password123" (hash bcrypt)
-- ============================================
INSERT INTO usuarios (nombre, email, password_hash, rol, granja_id, activo) VALUES
('Carlos Mendoza', 'dueno@elolimp.com', '$2b$10$3an1hQCJ8DVadswKajtWJeJOjVJWBLipHeY3Y.RZpOztFjDSWVSqm', 'dueno', 1, TRUE),
('María González', 'supervisor@elolimp.com', '$2b$10$3an1hQCJ8DVadswKajtWJeJOjVJWBLipHeY3Y.RZpOztFjDSWVSqm', 'supervisor', 1, TRUE),
('Pedro Ramírez', 'trabajador@elolimp.com', '$2b$10$3an1hQCJ8DVadswKajtWJeJOjVJWBLipHeY3Y.RZpOztFjDSWVSqm', 'trabajador', 1, TRUE),
('Ana López', 'ana@lapradera.com', '$2b$10$3an1hQCJ8DVadswKajtWJeJOjVJWBLipHeY3Y.RZpOztFjDSWVSqm', 'dueno', 2, TRUE);

-- ============================================
-- LOTES DE ALIMENTO
-- ============================================
INSERT INTO lotes_alimento (tipo, codigo_lote, cantidad_inicial, cantidad_actual, fecha_ingreso, proveedor) VALUES
('preiniciador', 'PRE-2024-001', 2000.00, 1500.00, '2024-10-20', 'Alimentos Concentrados S.A.'),
('iniciador', 'INI-2024-002', 3000.00, 2200.00, '2024-10-25', 'Alimentos Concentrados S.A.'),
('pollito', 'POL-2024-003', 5000.00, 4100.00, '2024-11-01', 'Nutri Aves Ltda'),
('engorde', 'ENG-2024-004', 4500.00, 4500.00, '2024-11-10', 'Nutri Aves Ltda'),
('finalizador', 'FIN-2024-005', 3500.00, 3500.00, '2024-11-12', 'Alimentos Concentrados S.A.');

-- ============================================
-- REGISTROS DIARIOS - Galpón 7 (últimos 17 días desde 26/Oct)
-- ============================================
INSERT INTO registros_diarios (galpon_id, fecha, edad_dias, consumo_kg, tipo_alimento, lote_alimento, mortalidad, seleccion, saldo_aves, peso_promedio, acumulado_alimento) VALUES
-- Día 1-7 (Preiniciador)
(1, '2024-10-26', 1, 50.00, 'preiniciador', 'PRE-2024-001', 5, 0, 4995, 45.0, 50.00),
(1, '2024-10-27', 2, 65.00, 'preiniciador', 'PRE-2024-001', 3, 0, 4992, 52.0, 115.00),
(1, '2024-10-28', 3, 80.00, 'preiniciador', 'PRE-2024-001', 4, 2, 4986, 61.0, 195.00),
(1, '2024-10-29', 4, 95.00, 'preiniciador', 'PRE-2024-001', 2, 1, 4983, 70.0, 290.00),
(1, '2024-10-30', 5, 110.00, 'preiniciador', 'PRE-2024-001', 3, 0, 4980, 82.0, 400.00),
(1, '2024-10-31', 6, 125.00, 'preiniciador', 'PRE-2024-001', 2, 1, 4977, 95.0, 525.00),
(1, '2024-11-01', 7, 140.00, 'preiniciador', 'PRE-2024-001', 4, 0, 4973, 108.0, 665.00),
-- Día 8-14 (Iniciador)
(1, '2024-11-02', 8, 160.00, 'iniciador', 'INI-2024-002', 3, 2, 4968, 125.0, 825.00),
(1, '2024-11-03', 9, 180.00, 'iniciador', 'INI-2024-002', 2, 0, 4966, 142.0, 1005.00),
(1, '2024-11-04', 10, 200.00, 'iniciador', 'INI-2024-002', 3, 1, 4962, 160.0, 1205.00),
(1, '2024-11-05', 11, 220.00, 'iniciador', 'INI-2024-002', 2, 0, 4960, 180.0, 1425.00),
(1, '2024-11-06', 12, 240.00, 'iniciador', 'INI-2024-002', 4, 1, 4955, 201.0, 1665.00),
(1, '2024-11-07', 13, 260.00, 'iniciador', 'INI-2024-002', 3, 0, 4952, 224.0, 1925.00),
(1, '2024-11-08', 14, 280.00, 'iniciador', 'INI-2024-002', 2, 2, 4948, 248.0, 2205.00),
-- Día 15-17 (Pollito)
(1, '2024-11-09', 15, 300.00, 'pollito', 'POL-2024-003', 3, 0, 4945, 274.0, 2505.00),
(1, '2024-11-10', 16, 320.00, 'pollito', 'POL-2024-003', 2, 1, 4942, 301.0, 2825.00),
(1, '2024-11-11', 17, 340.00, 'pollito', 'POL-2024-003', 4, 0, 4938, 329.0, 3165.00);

-- ============================================
-- REGISTROS DIARIOS - Galpón 8 (últimos 11 días desde 01/Nov)
-- ============================================
INSERT INTO registros_diarios (galpon_id, fecha, edad_dias, consumo_kg, tipo_alimento, lote_alimento, mortalidad, seleccion, saldo_aves, peso_promedio, acumulado_alimento) VALUES
(2, '2024-11-01', 1, 45.00, 'preiniciador', 'PRE-2024-001', 3, 0, 4497, 43.0, 45.00),
(2, '2024-11-02', 2, 60.00, 'preiniciador', 'PRE-2024-001', 2, 1, 4494, 50.0, 105.00),
(2, '2024-11-03', 3, 75.00, 'preiniciador', 'PRE-2024-001', 4, 0, 4490, 59.0, 180.00),
(2, '2024-11-04', 4, 90.00, 'preiniciador', 'PRE-2024-001', 2, 2, 4486, 68.0, 270.00),
(2, '2024-11-05', 5, 105.00, 'preiniciador', 'PRE-2024-001', 3, 0, 4483, 80.0, 375.00),
(2, '2024-11-06', 6, 120.00, 'preiniciador', 'PRE-2024-001', 2, 1, 4480, 92.0, 495.00),
(2, '2024-11-07', 7, 135.00, 'preiniciador', 'PRE-2024-001', 3, 0, 4477, 105.0, 630.00),
(2, '2024-11-08', 8, 155.00, 'iniciador', 'INI-2024-002', 2, 0, 4475, 122.0, 785.00),
(2, '2024-11-09', 9, 175.00, 'iniciador', 'INI-2024-002', 3, 1, 4471, 139.0, 960.00),
(2, '2024-11-10', 10, 195.00, 'iniciador', 'INI-2024-002', 2, 0, 4469, 157.0, 1155.00),
(2, '2024-11-11', 11, 215.00, 'iniciador', 'INI-2024-002', 4, 2, 4463, 176.0, 1370.00);

-- ============================================
-- MOVIMIENTOS DE INVENTARIO
-- ============================================
-- Salidas de alimento correspondientes a los consumos registrados
INSERT INTO inventario_alimento (lote_id, tipo_movimiento, cantidad, galpon_id, fecha, observaciones) VALUES
-- Galpón 7 - Preiniciador
(1, 'salida', 665.00, 1, '2024-11-01', 'Consumo días 1-7'),
-- Galpón 7 - Iniciador
(2, 'salida', 1540.00, 1, '2024-11-08', 'Consumo días 8-14'),
-- Galpón 7 - Pollito
(3, 'salida', 960.00, 1, '2024-11-11', 'Consumo días 15-17'),
-- Galpón 8 - Preiniciador
(1, 'salida', 630.00, 2, '2024-11-07', 'Consumo días 1-7'),
-- Galpón 8 - Iniciador
(2, 'salida', 785.00, 2, '2024-11-11', 'Consumo días 8-11');

-- ============================================
-- ALERTAS
-- ============================================
INSERT INTO alertas (tipo, mensaje, severidad, galpon_id, fecha, atendida) VALUES
('mortalidad_alta', 'Mortalidad superior al 5% en los últimos 3 días', 'media', 1, '2024-11-11 08:30:00', FALSE),
('stock_bajo', 'Stock de alimento iniciador por debajo del 30%', 'alta', NULL, '2024-11-11 10:00:00', FALSE),
('peso_bajo', 'Peso promedio 8% por debajo de la curva esperada', 'baja', 2, '2024-11-10 14:20:00', FALSE);

-- Actualizar inventario con las salidas
UPDATE lotes_alimento SET cantidad_actual = cantidad_inicial - 1295.00 WHERE codigo_lote = 'PRE-2024-001';
UPDATE lotes_alimento SET cantidad_actual = cantidad_inicial - 2325.00 WHERE codigo_lote = 'INI-2024-002';
UPDATE lotes_alimento SET cantidad_actual = cantidad_inicial - 960.00 WHERE codigo_lote = 'POL-2024-003';

-- ============================================
-- Verificación de datos
-- ============================================
SELECT 'Datos insertados correctamente' as status;
SELECT 'Granjas:', COUNT(*) FROM granjas;
SELECT 'Galpones:', COUNT(*) FROM galpones;
SELECT 'Usuarios:', COUNT(*) FROM usuarios;
SELECT 'Lotes de alimento:', COUNT(*) FROM lotes_alimento;
SELECT 'Registros diarios:', COUNT(*) FROM registros_diarios;
SELECT 'Alertas:', COUNT(*) FROM alertas;
