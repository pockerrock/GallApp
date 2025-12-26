const { Desacose, Galpon, Usuario, RegistroDiario } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// GET /api/desacose - Listar movimientos de desacose
const listarMovimientos = async (req, res, next) => {
  try {
    const { galpon_id, fecha_inicio, fecha_fin } = req.query;

    const where = {};

    if (galpon_id) {
      where[Op.or] = [
        { galpon_origen_id: galpon_id },
        { galpon_destino_id: galpon_id }
      ];
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

    const movimientos = await Desacose.findAll({
      where,
      include: [
        { model: Galpon, as: 'galpon_origen', attributes: ['id', 'numero', 'nombre'] },
        { model: Galpon, as: 'galpon_destino', attributes: ['id', 'numero', 'nombre'] },
        { model: Usuario, as: 'realizado_por_usuario', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha', 'DESC'], ['creado_en', 'DESC']]
    });

    res.json({
      total: movimientos.length,
      movimientos
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/desacose/:id - Obtener movimiento por ID
const obtenerMovimiento = async (req, res, next) => {
  try {
    const { id } = req.params;

    const movimiento = await Desacose.findByPk(id, {
      include: [
        { model: Galpon, as: 'galpon_origen' },
        { model: Galpon, as: 'galpon_destino' },
        { model: Usuario, as: 'realizado_por_usuario' }
      ]
    });

    if (!movimiento) {
      return res.status(404).json({
        error: 'Movimiento no encontrado'
      });
    }

    res.json(movimiento);
  } catch (error) {
    next(error);
  }
};

// POST /api/desacose - Crear movimiento de desacose
const crearMovimiento = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      galpon_origen_id,
      galpon_destino_id,
      fecha,
      cantidad_aves,
      motivo,
      observaciones
    } = req.body;

    if (!galpon_origen_id || !galpon_destino_id || !cantidad_aves) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Campos requeridos: galpon_origen_id, galpon_destino_id, cantidad_aves'
      });
    }

    if (galpon_origen_id === galpon_destino_id) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'El galpón de origen y destino deben ser diferentes'
      });
    }

    const galponOrigen = await Galpon.findByPk(galpon_origen_id, { transaction });
    const galponDestino = await Galpon.findByPk(galpon_destino_id, { transaction });

    if (!galponOrigen || !galponDestino) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Uno o ambos galpones no encontrados'
      });
    }

    // Obtener saldo actual del galpón origen
    const ultimoRegistroOrigen = await RegistroDiario.findOne({
      where: { galpon_id: galpon_origen_id },
      order: [['fecha', 'DESC']],
      transaction
    });

    const saldoActualOrigen = ultimoRegistroOrigen 
      ? ultimoRegistroOrigen.saldo_aves 
      : galponOrigen.aves_iniciales;

    if (cantidad_aves > saldoActualOrigen) {
      await transaction.rollback();
      return res.status(400).json({
        error: `No hay suficientes aves en el galpón origen. Saldo actual: ${saldoActualOrigen}`
      });
    }

    // Crear el movimiento
    const movimiento = await Desacose.create({
      galpon_origen_id,
      galpon_destino_id,
      fecha: fecha || new Date().toISOString().split('T')[0],
      cantidad_aves,
      motivo,
      observaciones,
      realizado_por: req.usuario.id
    }, { transaction });

    // Obtener último registro del galpón destino
    const ultimoRegistroDestino = await RegistroDiario.findOne({
      where: { galpon_id: galpon_destino_id },
      order: [['fecha', 'DESC']],
      transaction
    });

    const fechaMovimiento = fecha || new Date().toISOString().split('T')[0];
    const edadDestino = ultimoRegistroDestino ? ultimoRegistroDestino.edad_dias : 0;

    // Actualizar saldo del galpón origen (crear nuevo registro)
    await RegistroDiario.create({
      galpon_id: galpon_origen_id,
      fecha: fechaMovimiento,
      edad_dias: ultimoRegistroOrigen ? ultimoRegistroOrigen.edad_dias : 0,
      consumo_kg: 0,
      saldo_aves: saldoActualOrigen - cantidad_aves,
      peso_promedio: ultimoRegistroOrigen ? ultimoRegistroOrigen.peso_promedio : null,
      acumulado_alimento: ultimoRegistroOrigen ? ultimoRegistroOrigen.acumulado_alimento : 0,
      observaciones: `Desacose: ${cantidad_aves} aves movidas a Galpón ${galponDestino.numero}`
    }, { transaction });

    // Actualizar saldo del galpón destino (crear nuevo registro)
    const saldoActualDestino = ultimoRegistroDestino 
      ? ultimoRegistroDestino.saldo_aves 
      : galponDestino.aves_iniciales;

    await RegistroDiario.create({
      galpon_id: galpon_destino_id,
      fecha: fechaMovimiento,
      edad_dias: edadDestino,
      consumo_kg: 0,
      saldo_aves: saldoActualDestino + cantidad_aves,
      peso_promedio: ultimoRegistroDestino ? ultimoRegistroDestino.peso_promedio : null,
      acumulado_alimento: ultimoRegistroDestino ? ultimoRegistroDestino.acumulado_alimento : 0,
      observaciones: `Desacose: ${cantidad_aves} aves recibidas de Galpón ${galponOrigen.numero}`
    }, { transaction });

    await transaction.commit();

    const movimientoCompleto = await Desacose.findByPk(movimiento.id, {
      include: [
        { model: Galpon, as: 'galpon_origen' },
        { model: Galpon, as: 'galpon_destino' },
        { model: Usuario, as: 'realizado_por_usuario' }
      ]
    });

    res.status(201).json({
      mensaje: 'Movimiento de desacose registrado exitosamente',
      movimiento: movimientoCompleto
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  listarMovimientos,
  obtenerMovimiento,
  crearMovimiento
};

