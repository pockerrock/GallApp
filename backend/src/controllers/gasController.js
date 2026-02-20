const { ConsumoGas, Galpon, Usuario } = require('../models');
const { Op } = require('sequelize');

// GET /api/gas - Listar consumos de gas
const listarConsumos = async (req, res, next) => {
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

    const consumos = await ConsumoGas.findAll({
      where,
      include: [
        { model: Galpon, as: 'galpon', attributes: ['id', 'numero', 'nombre'] },
        { model: Usuario, as: 'creado_por_usuario', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha', 'DESC'], ['edad_dias', 'DESC']]
    });

    res.json({
      total: consumos.length,
      consumos
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/gas/:id - Obtener consumo por ID
const obtenerConsumo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const consumo = await ConsumoGas.findByPk(id, {
      include: [
        { model: Galpon, as: 'galpon' },
        { model: Usuario, as: 'creado_por_usuario' }
      ]
    });

    if (!consumo) {
      return res.status(404).json({
        error: 'Registro de consumo no encontrado'
      });
    }

    res.json(consumo);
  } catch (error) {
    next(error);
  }
};

// POST /api/gas - Crear registro de consumo
const crearConsumo = async (req, res, next) => {
  try {
    const {
      galpon_id,
      fecha,
      edad_dias,
      lectura_medidor,
      consumo_m3,
      observaciones
    } = req.body;

    let imagen_url = null;
    if (req.file) {
      imagen_url = `/uploads/${req.file.filename}`;
    } else if (req.body.imagen_url) {
      imagen_url = req.body.imagen_url;
    }

    if (!galpon_id || !fecha || edad_dias === undefined) {
      return res.status(400).json({
        error: 'Campos requeridos: galpon_id, fecha, edad_dias'
      });
    }

    const galpon = await Galpon.findByPk(galpon_id);
    if (!galpon) {
      return res.status(404).json({
        error: 'Galpón no encontrado'
      });
    }

    // Verificar si ya existe un registro para este galpón, fecha y edad
    const consumoExistente = await ConsumoGas.findOne({
      where: { galpon_id, fecha, edad_dias }
    });

    if (consumoExistente) {
      return res.status(409).json({
        error: 'Ya existe un registro de consumo para este galpón, fecha y edad'
      });
    }

    const nuevoConsumo = await ConsumoGas.create({
      galpon_id,
      fecha,
      edad_dias,
      lectura_medidor,
      consumo_m3,
      imagen_url,
      observaciones,
      creado_por: req.usuario.id
    });

    const consumoCompleto = await ConsumoGas.findByPk(nuevoConsumo.id, {
      include: [
        { model: Galpon, as: 'galpon' },
        { model: Usuario, as: 'creado_por_usuario' }
      ]
    });

    res.status(201).json({
      mensaje: 'Registro de consumo creado exitosamente',
      consumo: consumoCompleto
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/gas/:id - Actualizar consumo
const actualizarConsumo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lectura_medidor, consumo_m3, observaciones } = req.body;
    let imagen_url;

    if (req.file) {
      imagen_url = `/uploads/${req.file.filename}`;
    } else if (req.body.imagen_url !== undefined) {
      imagen_url = req.body.imagen_url;
    }

    const consumo = await ConsumoGas.findByPk(id);

    if (!consumo) {
      return res.status(404).json({
        error: 'Registro de consumo no encontrado'
      });
    }

    await consumo.update({
      ...(lectura_medidor !== undefined && { lectura_medidor }),
      ...(consumo_m3 !== undefined && { consumo_m3 }),
      ...(imagen_url !== undefined && { imagen_url }),
      ...(observaciones !== undefined && { observaciones })
    });

    const consumoActualizado = await ConsumoGas.findByPk(id, {
      include: [
        { model: Galpon, as: 'galpon' },
        { model: Usuario, as: 'creado_por_usuario' }
      ]
    });

    res.json({
      mensaje: 'Registro de consumo actualizado exitosamente',
      consumo: consumoActualizado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarConsumos,
  obtenerConsumo,
  crearConsumo,
  actualizarConsumo
};

