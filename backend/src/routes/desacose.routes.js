const express = require('express');
const router = express.Router();
const desacoseController = require('../controllers/desacoseController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/desacose - Listar movimientos
router.get('/', desacoseController.listarMovimientos);

// GET /api/desacose/:id - Obtener movimiento por ID
router.get('/:id', desacoseController.obtenerMovimiento);

// POST /api/desacose - Crear movimiento (solo supervisor y dueño)
router.post('/',
  verificarRol('supervisor', 'dueno'),
  desacoseController.crearMovimiento
);

module.exports = router;

