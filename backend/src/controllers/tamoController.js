const { Tamo, Galpon, Usuario } = require('../models');
const { Op } = require('sequelize');

// GET /api/tamo - Listar registros de tamo
const listarTamos = async (req, res, next) => {
  try {
    const { galpon_id, fecha_inicio, fecha_fin } = req.query;

    const where = {};

    if (galpon_id) {
      where.galpon_id = galpon_id;
    }

    if (fecha_inicio && fecha_fin) {
      where.fecha = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      where.fecha = { [Op.gte]: fecha_inicio };
    } else if (fecha_fin) {
      where.fecha = { [Op.lte]: fecha_fin };
    }

    const tamos = await Tamo.findAll({
      where,
      include: [
        { model: Galpon, as: 'galpon', attributes: ['id', 'numero', 'nombre'] },
        { model: Usuario, as: 'aplicado_por_usuario', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json({
      total: tamos.length,
      tamos
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tamo/:id - Obtener registro de tamo por ID
const obtenerTamo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tamo = await Tamo.findByPk(id, {
      include: [
        { model: Galpon, as: 'galpon' },
        { model: Usuario, as: 'aplicado_por_usuario' }
      ]
    });

    if (!tamo) {
      return res.status(404).json({
        error: 'Registro de tamo no encontrado'
      });
    }

    res.json(tamo);
  } catch (error) {
    next(error);
  }
};

// POST /api/tamo - Crear registro de tamo
const crearTamo = async (req, res, next) => {
  try {
    const {
      galpon_id,
      fecha,
      tipo_material,
      cantidad_kg,
      espanol_cm,
      calidad,
      humedad_percent,
      observaciones
    } = req.body;

    if (!galpon_id || !fecha || !tipo_material || cantidad_kg === undefined) {
      return res.status(400).json({
        error: 'Campos requeridos: galpon_id, fecha, tipo_material, cantidad_kg'
      });
    }

    const galpon = await Galpon.findByPk(galpon_id);
    if (!galpon) {
      return res.status(404).json({
        error: 'Galpón no encontrado'
      });
    }

    const nuevoTamo = await Tamo.create({
      galpon_id,
      fecha,
      tipo_material,
      cantidad_kg,
      espanol_cm,
      calidad: calidad || 'buena',
      humedad_percent,
      observaciones,
      aplicado_por: req.usuario.id
    });

    const tamoCompleto = await Tamo.findByPk(nuevoTamo.id, {
      include: [
        { model: Galpon, as: 'galpon' },
        { model: Usuario, as: 'aplicado_por_usuario' }
      ]
    });

    res.status(201).json({
      mensaje: 'Registro de tamo creado exitosamente',
      tamo: tamoCompleto
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tamo/:id - Actualizar registro de tamo
const actualizarTamo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo_material, cantidad_kg, espanol_cm, calidad, humedad_percent, observaciones } = req.body;

    const tamo = await Tamo.findByPk(id);

    if (!tamo) {
      return res.status(404).json({
        error: 'Registro de tamo no encontrado'
      });
    }

    await tamo.update({
      ...(tipo_material && { tipo_material }),
      ...(cantidad_kg !== undefined && { cantidad_kg }),
      ...(espanol_cm !== undefined && { espanol_cm }),
      ...(calidad && { calidad }),
      ...(humedad_percent !== undefined && { humedad_percent }),
      ...(observaciones !== undefined && { observaciones })
    });

    const tamoActualizado = await Tamo.findByPk(id, {
      include: [
        { model: Galpon, as: 'galpon' },
        { model: Usuario, as: 'aplicado_por_usuario' }
      ]
    });

    res.json({
      mensaje: 'Registro de tamo actualizado exitosamente',
      tamo: tamoActualizado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarTamos,
  obtenerTamo,
  crearTamo,
  actualizarTamo
};

