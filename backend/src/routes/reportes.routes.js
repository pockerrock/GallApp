const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Reportes PDF
router.get('/registros-pdf', reportesController.descargarRegistrosPDF);
router.get('/kpis-mensual-pdf', reportesController.descargarKPIsMensualPDF);
router.get('/comparacion-pdf', reportesController.descargarComparacionPDF);

// Reportes Excel
router.get('/registros-excel', reportesController.descargarRegistrosExcel);
router.get('/inventario-excel', reportesController.descargarInventarioExcel);
router.get('/kpis-mensual-excel', reportesController.descargarKPIsMensualExcel);

module.exports = router;
