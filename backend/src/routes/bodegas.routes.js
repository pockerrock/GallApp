const express = require('express');
const router = express.Router();
const bodegasController = require('../controllers/bodegasController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/bodegas - Listar bodegas
router.get('/', bodegasController.listarBodegas);

// GET /api/bodegas/:id - Obtener bodega por ID
router.get('/:id', bodegasController.obtenerBodega);

// POST /api/bodegas - Crear bodega (solo supervisor y dueño)
router.post('/',
  verificarRol('supervisor', 'dueno'),
  bodegasController.crearBodega
);

// PUT /api/bodegas/:id - Actualizar bodega (solo supervisor y dueño)
router.put('/:id',
  verificarRol('supervisor', 'dueno'),
  bodegasController.actualizarBodega
);

module.exports = router;

