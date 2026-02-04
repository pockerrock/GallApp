-- ============================================
-- GallinaApp - Datos de Prueba (Seed)
-- ============================================

-- Limpiar datos existentes
TRUNCATE TABLE alertas, registros_diarios, inventario_alimento, lotes_alimento, usuarios, galpones, granjas RESTART IDENTITY CASCADE;

-- ============================================
-- GRANJAS
-- ============================================
INSERT INTO granjas (nombre, ubicacion) VALUES
('El Olimpo', 'Vereda La Esperanza, Cundinamarca');
-- ============================================
-- USUARIOS
-- Contraseña para todos: "password123" (hash bcrypt)
-- ============================================
INSERT INTO usuarios (nombre, email, password_hash, rol, granja_id, activo) VALUES
('Prueba', 'pruebas@elolimpo.com', '$2b$10$3an1hQCJ8DVadswKajtWJeJOjVJWBLipHeY3Y.RZpOztFjDSWVSqm', 'dueno', 1, TRUE);


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
