const express = require('express');
const router = express.Router();
const tamoController = require('../controllers/tamoController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/tamo - Listar registros de tamo
router.get('/', tamoController.listarTamos);

// GET /api/tamo/:id - Obtener registro por ID
router.get('/:id', tamoController.obtenerTamo);

// POST /api/tamo - Crear registro de tamo
router.post('/', tamoController.crearTamo);

// PUT /api/tamo/:id - Actualizar registro
router.put('/:id', tamoController.actualizarTamo);

module.exports = router;

