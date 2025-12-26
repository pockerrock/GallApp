const { Bodega, Granja, LoteAlimento } = require('../models');
const { Op } = require('sequelize');

// GET /api/bodegas - Listar bodegas
const listarBodegas = async (req, res, next) => {
  try {
    const { granja_id, activo } = req.query;
    const usuario = req.usuario;

    const where = {};

    if (usuario.rol !== 'dueno' && usuario.granja_id) {
      where.granja_id = usuario.granja_id;
    } else if (granja_id) {
      where.granja_id = granja_id;
    }

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const bodegas = await Bodega.findAll({
      where,
      include: [
        { model: Granja, as: 'granja', attributes: ['id', 'nombre'] },
        { model: LoteAlimento, as: 'lotes', attributes: ['id', 'codigo_lote', 'tipo', 'cantidad_actual'] }
      ],
      order: [['granja_id', 'ASC'], ['nombre', 'ASC']]
    });

    res.json({
      total: bodegas.length,
      bodegas
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bodegas/:id - Obtener bodega por ID
const obtenerBodega = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bodega = await Bodega.findByPk(id, {
      include: [
        { model: Granja, as: 'granja' },
        { model: LoteAlimento, as: 'lotes' }
      ]
    });

    if (!bodega) {
      return res.status(404).json({
        error: 'Bodega no encontrada'
      });
    }

    res.json(bodega);
  } catch (error) {
    next(error);
  }
};

// POST /api/bodegas - Crear nueva bodega
const crearBodega = async (req, res, next) => {
  try {
    const { granja_id, nombre, ubicacion } = req.body;

    if (!granja_id || !nombre) {
      return res.status(400).json({
        error: 'Campos requeridos: granja_id, nombre'
      });
    }

    const granja = await Granja.findByPk(granja_id);
    if (!granja) {
      return res.status(404).json({
        error: 'La granja especificada no existe'
      });
    }

    const bodegaExistente = await Bodega.findOne({
      where: { granja_id, nombre }
    });

    if (bodegaExistente) {
      return res.status(409).json({
        error: `Ya existe una bodega con el nombre "${nombre}" en esta granja`
      });
    }

    const nuevaBodega = await Bodega.create({
      granja_id,
      nombre,
      ubicacion,
      activo: true
    });

    const bodegaConGranja = await Bodega.findByPk(nuevaBodega.id, {
      include: [{ model: Granja, as: 'granja' }]
    });

    res.status(201).json({
      mensaje: 'Bodega creada exitosamente',
      bodega: bodegaConGranja
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bodegas/:id - Actualizar bodega
const actualizarBodega = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, ubicacion, activo } = req.body;

    const bodega = await Bodega.findByPk(id);

    if (!bodega) {
      return res.status(404).json({
        error: 'Bodega no encontrada'
      });
    }

    if (nombre && nombre !== bodega.nombre) {
      const bodegaExistente = await Bodega.findOne({
        where: {
          granja_id: bodega.granja_id,
          nombre,
          id: { [Op.ne]: id }
        }
      });

      if (bodegaExistente) {
        return res.status(409).json({
          error: `Ya existe una bodega con el nombre "${nombre}" en esta granja`
        });
      }
    }

    await bodega.update({
      ...(nombre && { nombre }),
      ...(ubicacion !== undefined && { ubicacion }),
      ...(activo !== undefined && { activo })
    });

    const bodegaActualizada = await Bodega.findByPk(id, {
      include: [{ model: Granja, as: 'granja' }]
    });

    res.json({
      mensaje: 'Bodega actualizada exitosamente',
      bodega: bodegaActualizada
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarBodegas,
  obtenerBodega,
  crearBodega,
  actualizarBodega
};

