const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// === LOTES ===
// GET /api/lotes - Listar lotes
router.get('/lotes', inventarioController.listarLotes);

// GET /api/lotes/:id - Obtener lote por ID
router.get('/lotes/:id', inventarioController.obtenerLote);

// POST /api/lotes - Crear lote (solo supervisor y dueño)
router.post('/lotes',
  verificarRol('supervisor', 'dueno'),
  inventarioController.crearLote
);

// === INVENTARIO ===
// GET /api/inventario - Estado del inventario
router.get('/', inventarioController.obtenerInventario);

// GET /api/inventario/movimientos - Historial de movimientos
router.get('/movimientos', inventarioController.listarMovimientos);

// POST /api/inventario/movimiento - Registrar movimiento
router.post('/movimiento', inventarioController.registrarMovimiento);

module.exports = router;
