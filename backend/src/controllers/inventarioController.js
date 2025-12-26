const { LoteAlimento, InventarioAlimento, Galpon, Bodega } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { detectarStockBajo } = require('../services/alertaAutomatica');

// GET /api/lotes - Listar lotes de alimento
const listarLotes = async (req, res, next) => {
  try {
    const { tipo, activo } = req.query;

    const where = {};

    if (tipo) {
      where.tipo = tipo;
    }

    // Filtrar por stock disponible
    if (activo === 'true') {
      where.cantidad_actual = { [Op.gt]: 0 };
    }

    const lotes = await LoteAlimento.findAll({
      where,
      include: [
        { model: Bodega, as: 'bodega', attributes: ['id', 'nombre', 'ubicacion'] }
      ],
      order: [['fecha_ingreso', 'DESC']]
    });

    res.json({
      total: lotes.length,
      lotes
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/lotes/:id - Obtener lote por ID
const obtenerLote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lote = await LoteAlimento.findByPk(id, {
      include: [
        { model: Bodega, as: 'bodega', attributes: ['id', 'nombre', 'ubicacion'] },
        {
          model: InventarioAlimento,
          as: 'movimientos',
          include: [{
            model: Galpon,
            as: 'galpon',
            attributes: ['id', 'numero', 'nombre']
          }],
          order: [['fecha', 'DESC']],
          limit: 20
        }
      ]
    });

    if (!lote) {
      return res.status(404).json({
        error: 'Lote no encontrado'
      });
    }

    res.json(lote);
  } catch (error) {
    next(error);
  }
};

// POST /api/lotes - Crear nuevo lote de alimento
const crearLote = async (req, res, next) => {
  try {
    const {
      tipo,
      codigo_lote,
      cantidad_inicial,
      fecha_ingreso,
      proveedor,
      bodega_id
    } = req.body;

    // Validar campos requeridos
    if (!tipo || !codigo_lote || !cantidad_inicial) {
      return res.status(400).json({
        error: 'Campos requeridos: tipo, codigo_lote, cantidad_inicial'
      });
    }

    // Verificar que el código no exista
    const loteExistente = await LoteAlimento.findOne({
      where: { codigo_lote }
    });

    if (loteExistente) {
      return res.status(409).json({
        error: `Ya existe un lote con el código ${codigo_lote}`
      });
    }

    // Crear lote
    const nuevoLote = await LoteAlimento.create({
      tipo,
      codigo_lote,
      cantidad_inicial,
      cantidad_actual: cantidad_inicial,
      fecha_ingreso: fecha_ingreso || new Date(),
      proveedor,
      bodega_id: bodega_id || null
    });

    res.status(201).json({
      mensaje: 'Lote creado exitosamente',
      lote: nuevoLote
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/inventario - Estado del inventario
const obtenerInventario = async (req, res, next) => {
  try {
    const { tipo } = req.query;

    const where = {};

    if (tipo) {
      where.tipo = tipo;
    }

    // Obtener todos los lotes con stock
    const lotes = await LoteAlimento.findAll({
      where,
      include: [
        { model: Bodega, as: 'bodega', attributes: ['id', 'nombre', 'ubicacion'] }
      ],
      order: [['tipo', 'ASC'], ['fecha_ingreso', 'DESC']]
    });

    // Agrupar por tipo
    const inventarioPorTipo = lotes.reduce((acc, lote) => {
      if (!acc[lote.tipo]) {
        acc[lote.tipo] = {
          tipo: lote.tipo,
          cantidad_total: 0,
          lotes: []
        };
      }
      acc[lote.tipo].cantidad_total += parseFloat(lote.cantidad_actual);
      acc[lote.tipo].lotes.push({
        id: lote.id,
        codigo_lote: lote.codigo_lote,
        cantidad_inicial: parseFloat(lote.cantidad_inicial),
        cantidad_actual: parseFloat(lote.cantidad_actual),
        porcentaje_disponible: ((parseFloat(lote.cantidad_actual) / parseFloat(lote.cantidad_inicial)) * 100).toFixed(2),
        fecha_ingreso: lote.fecha_ingreso,
        proveedor: lote.proveedor,
        bodega_id: lote.bodega_id,
        bodega: lote.bodega ? {
          id: lote.bodega.id,
          nombre: lote.bodega.nombre,
          ubicacion: lote.bodega.ubicacion
        } : null
      });
      return acc;
    }, {});

    const inventario = Object.values(inventarioPorTipo);

    res.json({
      total_tipos: inventario.length,
      inventario
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/inventario/movimiento - Registrar entrada/salida
const registrarMovimiento = async (req, res, next) => {
  try {
    const {
      lote_id,
      tipo_movimiento,
      cantidad,
      galpon_id,
      fecha,
      observaciones
    } = req.body;

    // Validar campos requeridos
    if (!lote_id || !tipo_movimiento || !cantidad) {
      return res.status(400).json({
        error: 'Campos requeridos: lote_id, tipo_movimiento, cantidad'
      });
    }

    // Verificar que el lote existe
    const lote = await LoteAlimento.findByPk(lote_id);
    if (!lote) {
      return res.status(404).json({
        error: 'El lote especificado no existe'
      });
    }

    // Validar tipo de movimiento
    if (!['entrada', 'salida'].includes(tipo_movimiento)) {
      return res.status(400).json({
        error: 'El tipo de movimiento debe ser "entrada" o "salida"'
      });
    }

    // Para salida, verificar que hay suficiente stock
    if (tipo_movimiento === 'salida') {
      if (parseFloat(lote.cantidad_actual) < parseFloat(cantidad)) {
        return res.status(400).json({
          error: `Stock insuficiente. Disponible: ${lote.cantidad_actual} kg`
        });
      }
    }

    // Si hay galpon_id, verificar que existe
    if (galpon_id) {
      const galpon = await Galpon.findByPk(galpon_id);
      if (!galpon) {
        return res.status(404).json({
          error: 'El galpón especificado no existe'
        });
      }
    }

    // Crear movimiento
    const movimiento = await InventarioAlimento.create({
      lote_id,
      tipo_movimiento,
      cantidad,
      galpon_id: galpon_id || null,
      fecha: fecha || new Date(),
      observaciones
    });

    // Actualizar cantidad actual del lote
    const nuevaCantidad = tipo_movimiento === 'entrada'
      ? parseFloat(lote.cantidad_actual) + parseFloat(cantidad)
      : parseFloat(lote.cantidad_actual) - parseFloat(cantidad);

    await lote.update({ cantidad_actual: nuevaCantidad });

    // Detectar stock bajo (sin bloquear la respuesta)
    detectarStockBajo(lote_id).catch(err => {
      console.error('Error al detectar stock bajo:', err);
    });

    const movimientoConRelaciones = await InventarioAlimento.findByPk(movimiento.id, {
      include: [
        { model: LoteAlimento, as: 'lote' },
        { model: Galpon, as: 'galpon', attributes: ['id', 'numero', 'nombre'] }
      ]
    });

    res.status(201).json({
      mensaje: 'Movimiento registrado exitosamente',
      movimiento: movimientoConRelaciones,
      nuevo_stock: nuevaCantidad
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/inventario/movimientos - Historial de movimientos
const listarMovimientos = async (req, res, next) => {
  try {
    const {
      lote_id,
      galpon_id,
      tipo_movimiento,
      fecha_inicio,
      fecha_fin,
      limit = 50,
      offset = 0
    } = req.query;

    const where = {};

    if (lote_id) where.lote_id = lote_id;
    if (galpon_id) where.galpon_id = galpon_id;
    if (tipo_movimiento) where.tipo_movimiento = tipo_movimiento;

    if (fecha_inicio || fecha_fin) {
      where.fecha = {};
      if (fecha_inicio) where.fecha[Op.gte] = fecha_inicio;
      if (fecha_fin) where.fecha[Op.lte] = fecha_fin;
    }

    const { count, rows: movimientos } = await InventarioAlimento.findAndCountAll({
      where,
      include: [
        { model: LoteAlimento, as: 'lote' },
        { model: Galpon, as: 'galpon', attributes: ['id', 'numero', 'nombre'] }
      ],
      order: [['fecha', 'DESC'], ['creado_en', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      total: count,
      movimientos
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarLotes,
  obtenerLote,
  crearLote,
  obtenerInventario,
  registrarMovimiento,
  listarMovimientos
};
