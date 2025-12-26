const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/dashboard/kpis - Obtener KPIs generales
router.get('/kpis', dashboardController.obtenerKPIs);

// GET /api/dashboard/graficas - Datos para gráficas
router.get('/graficas', dashboardController.obtenerDatosGraficas);

// GET /api/dashboard/resumen-granjas - Resumen de todas las granjas
router.get('/resumen-granjas', dashboardController.obtenerResumenGranjas);

// GET /api/dashboard/comparacion-galpones - Comparar métricas entre galpones
router.get('/comparacion-galpones', dashboardController.compararGalpones);

// GET /api/dashboard/comparacion-personalizada - Comparar 2 galpones con rangos de fecha
router.get('/comparacion-personalizada', dashboardController.comparacionPersonalizada);

module.exports = router;
