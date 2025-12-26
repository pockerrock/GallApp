const express = require('express');
const router = express.Router();
const galponesController = require('../controllers/galponesController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/galpones - Listar galpones
router.get('/', galponesController.listarGalpones);

// GET /api/galpones/:id - Obtener galpón por ID
router.get('/:id', galponesController.obtenerGalpon);

// GET /api/galpones/:id/resumen - Resumen del galpón
router.get('/:id/resumen', galponesController.obtenerResumenGalpon);

// POST /api/galpones - Crear galpón (solo supervisor y dueño)
router.post('/',
  verificarRol('supervisor', 'dueno'),
  galponesController.crearGalpon
);

// PUT /api/galpones/:id - Actualizar galpón (solo supervisor y dueño)
router.put('/:id',
  verificarRol('supervisor', 'dueno'),
  galponesController.actualizarGalpon
);

// DELETE /api/galpones/:id - Eliminar galpón (solo dueño)
router.delete('/:id',
  verificarRol('dueno'),
  galponesController.eliminarGalpon
);

// POST /api/galpones/:id/dividir - Dividir galpón (solo supervisor y dueño)
router.post('/:id/dividir',
  verificarRol('supervisor', 'dueno'),
  galponesController.dividirGalpon
);

module.exports = router;
