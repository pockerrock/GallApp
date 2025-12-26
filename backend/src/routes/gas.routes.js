const express = require('express');
const router = express.Router();
const gasController = require('../controllers/gasController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/gas - Listar consumos de gas
router.get('/', gasController.listarConsumos);

// GET /api/gas/:id - Obtener consumo por ID
router.get('/:id', gasController.obtenerConsumo);

// POST /api/gas - Crear registro de consumo
router.post('/', gasController.crearConsumo);

// PUT /api/gas/:id - Actualizar consumo
router.put('/:id', gasController.actualizarConsumo);

module.exports = router;

