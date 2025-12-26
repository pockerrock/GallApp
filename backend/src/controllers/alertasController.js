const { Alerta, Galpon, Granja, LoteAlimento, Usuario } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// GET /api/alertas - Listar alertas
const listarAlertas = async (req, res, next) => {
  try {
    const {
      atendida,
      severidad,
      tipo,
      galpon_id,
      limit = 50,
      offset = 0
    } = req.query;

    const where = {};

    if (atendida !== undefined) {
      where.atendida = atendida === 'true';
    }

    if (severidad) {
      where.severidad = severidad;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (galpon_id) {
      where.galpon_id = galpon_id;
    }

    const { count, rows: alertas } = await Alerta.findAndCountAll({
      where,
      include: [
        {
          model: Galpon,
          as: 'galpon',
          attributes: ['id', 'numero', 'nombre'],
          include: [{
            model: Granja,
            as: 'granja',
            attributes: ['id', 'nombre']
          }]
        },
        {
          model: LoteAlimento,
          as: 'lote',
          attributes: ['id', 'codigo_lote', 'tipo']
        },
        {
          model: Usuario,
          as: 'atendido_por_usuario',
          attributes: ['id', 'nombre', 'email']
        }
      ],
      order: [
        ['atendida', 'ASC'],
        [sequelize.literal(`CASE severidad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 WHEN 'baja' THEN 3 END`)],
        ['fecha', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      total: count,
      alertas
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/alertas/:id - Obtener alerta por ID
const obtenerAlerta = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alerta = await Alerta.findByPk(id, {
      include: [
        {
          model: Galpon,
          as: 'galpon',
          include: [{ model: Granja, as: 'granja' }]
        },
        {
          model: LoteAlimento,
          as: 'lote'
        },
        {
          model: Usuario,
          as: 'atendido_por_usuario',
          attributes: ['id', 'nombre', 'email']
        }
      ]
    });

    if (!alerta) {
      return res.status(404).json({
        error: 'Alerta no encontrada'
      });
    }

    res.json(alerta);
  } catch (error) {
    next(error);
  }
};

// POST /api/alertas - Crear nueva alerta
const crearAlerta = async (req, res, next) => {
  try {
    const {
      tipo,
      mensaje,
      severidad = 'media',
      galpon_id,
      lote_id
    } = req.body;

    // Validar campos requeridos
    if (!tipo || !mensaje) {
      return res.status(400).json({
        error: 'Campos requeridos: tipo, mensaje'
      });
    }

    // Verificar que al menos uno de galpon_id o lote_id está presente
    if (!galpon_id && !lote_id) {
      return res.status(400).json({
        error: 'Debe proporcionar al menos galpon_id o lote_id'
      });
    }

    // Verificar que las referencias existan
    if (galpon_id) {
      const galpon = await Galpon.findByPk(galpon_id);
      if (!galpon) {
        return res.status(404).json({
          error: 'El galpón especificado no existe'
        });
      }
    }

    if (lote_id) {
      const lote = await LoteAlimento.findByPk(lote_id);
      if (!lote) {
        return res.status(404).json({
          error: 'El lote especificado no existe'
        });
      }
    }

    // Crear alerta
    const nuevaAlerta = await Alerta.create({
      tipo,
      mensaje,
      severidad,
      galpon_id: galpon_id || null,
      lote_id: lote_id || null,
      atendida: false
    });

    const alertaConRelaciones = await Alerta.findByPk(nuevaAlerta.id, {
      include: [
        { model: Galpon, as: 'galpon', attributes: ['id', 'numero', 'nombre'] },
        { model: LoteAlimento, as: 'lote', attributes: ['id', 'codigo_lote', 'tipo'] }
      ]
    });

    res.status(201).json({
      mensaje: 'Alerta creada exitosamente',
      alerta: alertaConRelaciones
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/alertas/:id/resolver - Resolver alerta
const resolverAlerta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    const alerta = await Alerta.findByPk(id);

    if (!alerta) {
      return res.status(404).json({
        error: 'Alerta no encontrada'
      });
    }

    if (alerta.atendida) {
      return res.status(400).json({
        error: 'La alerta ya ha sido resuelta'
      });
    }

    await alerta.update({
      atendida: true,
      atendida_por: usuario.id,
      fecha_atencion: new Date()
    });

    const alertaActualizada = await Alerta.findByPk(id, {
      include: [
        { model: Galpon, as: 'galpon' },
        { model: LoteAlimento, as: 'lote' },
        { model: Usuario, as: 'atendido_por_usuario', attributes: ['id', 'nombre', 'email'] }
      ]
    });

    res.json({
      mensaje: 'Alerta resuelta exitosamente',
      alerta: alertaActualizada
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/alertas/:id - Eliminar alerta
const eliminarAlerta = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alerta = await Alerta.findByPk(id);

    if (!alerta) {
      return res.status(404).json({
        error: 'Alerta no encontrada'
      });
    }

    await alerta.destroy();

    res.json({
      mensaje: 'Alerta eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarAlertas,
  obtenerAlerta,
  crearAlerta,
  resolverAlerta,
  eliminarAlerta
};
