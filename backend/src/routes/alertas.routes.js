const express = require('express');
const router = express.Router();
const alertasController = require('../controllers/alertasController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/alertas - Listar alertas
router.get('/', alertasController.listarAlertas);

// GET /api/alertas/:id - Obtener alerta por ID
router.get('/:id', alertasController.obtenerAlerta);

// POST /api/alertas - Crear alerta (solo supervisor y dueño)
router.post('/',
  verificarRol('supervisor', 'dueno'),
  alertasController.crearAlerta
);

// PUT /api/alertas/:id/resolver - Resolver alerta
router.put('/:id/resolver', alertasController.resolverAlerta);

// DELETE /api/alertas/:id - Eliminar alerta (solo dueño)
router.delete('/:id',
  verificarRol('dueno'),
  alertasController.eliminarAlerta
);

module.exports = router;
