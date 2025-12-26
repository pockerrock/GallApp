const express = require('express');
const router = express.Router();
const actividadesController = require('../controllers/actividadesController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas de actividades
router.get('/', actividadesController.listarActividades);
router.get('/proximas', actividadesController.actividadesProximas);
router.get('/:id', actividadesController.obtenerActividad);
router.post('/', actividadesController.crearActividad);
router.put('/:id', actividadesController.actualizarActividad);
router.put('/:id/completar', actividadesController.completarActividad);
router.delete('/:id', actividadesController.eliminarActividad);

module.exports = router;
