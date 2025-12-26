
const express = require('express');
const router = express.Router();
const registrosController = require('../controllers/registrosController');
const { verificarToken, verificarRol } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/registros - Listar registros
router.get('/', registrosController.listarRegistros);

// GET /api/registros/:id - Obtener registro por ID
router.get('/:id', registrosController.obtenerRegistro);

// POST /api/registros - Crear registro
router.post('/', upload.fields([
  { name: 'foto_factura', maxCount: 1 },
  { name: 'foto_medidor', maxCount: 1 }
]), registrosController.crearRegistro);

// POST /api/registros/sincronizar - Sincronizar registros offline
router.post('/sincronizar', registrosController.sincronizarRegistros);

// PUT /api/registros/:id - Actualizar registro
router.put('/:id', upload.fields([
  { name: 'foto_factura', maxCount: 1 },
  { name: 'foto_medidor', maxCount: 1 }
]), registrosController.actualizarRegistro);

// DELETE /api/registros/:id - Eliminar registro (solo supervisor y dueño)
router.delete('/:id',
  verificarRol('supervisor', 'dueno'),
  registrosController.eliminarRegistro
);

module.exports = router;
