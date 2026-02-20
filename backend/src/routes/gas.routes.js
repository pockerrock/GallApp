const express = require('express');
const router = express.Router();
const gasController = require('../controllers/gasController');
const { verificarToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/gas - Listar consumos de gas
router.get('/', gasController.listarConsumos);

// GET /api/gas/:id - Obtener consumo por ID
router.get('/:id', gasController.obtenerConsumo);

// POST /api/gas - Crear registro de consumo
router.post('/', upload.single('imagen'), gasController.crearConsumo);

// PUT /api/gas/:id - Actualizar consumo
router.put('/:id', upload.single('imagen'), gasController.actualizarConsumo);

module.exports = router;

