const { LoteAlimento, InventarioAlimento, Galpon, Bodega, StockLoteBodega } = require('../models');
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

    const lotes = await LoteAlimento.findAll({
      where,
      include: [
        {
          model: StockLoteBodega,
          as: 'stocks',
          include: [{ model: Bodega, as: 'bodega', attributes: ['id', 'nombre', 'ubicacion'] }]
        }
      ],
      order: [['fecha_ingreso', 'DESC']]
    });

    // Transformar: cada combinación lote + bodega es un “stock” independiente
    const lotesRespuesta = [];

    for (const lote of lotes) {
      const stocks = lote.stocks || [];

      // Si no hay stocks, se omite cuando se filtra por activo=true
      if (activo === 'true' && stocks.length === 0) continue;

      if (stocks.length === 0) {
        lotesRespuesta.push({
          ...lote.toJSON(),
          cantidad_actual: 0,
          bodega_id: null,
          bodega: null
        });
        continue;
      }

      stocks.forEach(stock => {
        // Si activo=true, solo mostrar los que tienen stock > 0
        if (activo === 'true' && parseFloat(stock.cantidad_actual) <= 0) return;

        lotesRespuesta.push({
          id: lote.id,
          tipo: lote.tipo,
          codigo_lote: lote.codigo_lote,
          cantidad_inicial: parseFloat(lote.cantidad_inicial),
          cantidad_actual: parseFloat(stock.cantidad_actual),
          fecha_ingreso: lote.fecha_ingreso,
          proveedor: lote.proveedor,
          bodega_id: stock.bodega_id,
          bodega: stock.bodega ? {
            id: stock.bodega.id,
            nombre: stock.bodega.nombre,
            ubicacion: stock.bodega.ubicacion
          } : null
        });
      });
    }

    res.json({
      total: lotesRespuesta.length,
      lotes: lotesRespuesta
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
        {
          model: StockLoteBodega,
          as: 'stocks',
          include: [{ model: Bodega, as: 'bodega', attributes: ['id', 'nombre', 'ubicacion'] }]
        },
        {
          model: InventarioAlimento,
          as: 'movimientos',
          include: [
            {
              model: Galpon,
              as: 'galpon',
              attributes: ['id', 'numero', 'nombre']
            },
            {
              model: Bodega,
              as: 'bodega',
              attributes: ['id', 'nombre']
            },
            {
              model: Bodega,
              as: 'bodega_origen',
              attributes: ['id', 'nombre']
            },
            {
              model: Bodega,
              as: 'bodega_destino',
              attributes: ['id', 'nombre']
            }
          ],
          order: [['fecha', 'DESC'], ['creado_en', 'DESC']],
          limit: 50
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
      bodega_id,
      distribuciones // [{ bodega_id, cantidad }]
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

    // Validar distribuciones si vienen
    let distribucionesValidas = [];
    if (Array.isArray(distribuciones) && distribuciones.length > 0) {
      distribucionesValidas = distribuciones
        .filter(d => d && d.bodega_id && d.cantidad)
        .map(d => ({
          bodega_id: parseInt(d.bodega_id),
          cantidad: parseFloat(d.cantidad)
        }))
        .filter(d => !isNaN(d.bodega_id) && d.bodega_id > 0 && !isNaN(d.cantidad) && d.cantidad > 0);

      if (distribucionesValidas.length === 0) {
        return res.status(400).json({
          error: 'Las distribuciones de bodegas no son válidas'
        });
      }

      const sumaDistribuida = distribucionesValidas.reduce((sum, d) => sum + d.cantidad, 0);
      if (Math.abs(sumaDistribuida - parseFloat(cantidad_inicial)) > 0.001) {
        return res.status(400).json({
          error: 'La suma de cantidades por bodega debe coincidir con la cantidad inicial del lote'
        });
      }
    }

    const t = await sequelize.transaction();

    try {
      // Crear lote (cantidad_actual se considera total, derivada de stock por bodegas)
      const nuevoLote = await LoteAlimento.create({
        tipo,
        codigo_lote,
        cantidad_inicial,
        cantidad_actual: cantidad_inicial,
        fecha_ingreso: fecha_ingreso || new Date(),
        proveedor,
        // bodega_id se mantiene solo para compatibilidad; si hay distribuciones se deja null
        bodega_id: distribucionesValidas.length > 0 ? null : (bodega_id || null)
      }, { transaction: t });

      // Crear registros de stock por bodega
      if (distribucionesValidas.length > 0) {
        for (const dist of distribucionesValidas) {
          await StockLoteBodega.create({
            lote_id: nuevoLote.id,
            bodega_id: dist.bodega_id,
            cantidad_actual: dist.cantidad
          }, { transaction: t });
        }
      } else if (bodega_id) {
        // Caso simple: todo el lote en una sola bodega
        await StockLoteBodega.create({
          lote_id: nuevoLote.id,
          bodega_id,
          cantidad_actual: cantidad_inicial
        }, { transaction: t });
      }

      await t.commit();

      res.status(201).json({
        mensaje: 'Lote creado exitosamente',
        lote: nuevoLote
      });
    } catch (e) {
      await t.rollback();
      throw e;
    }
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

    const lotes = await LoteAlimento.findAll({
      where,
      include: [
        {
          model: StockLoteBodega,
          as: 'stocks',
          include: [{ model: Bodega, as: 'bodega', attributes: ['id', 'nombre', 'ubicacion'] }]
        }
      ],
      order: [['tipo', 'ASC'], ['fecha_ingreso', 'DESC']]
    });

    // Agrupar por tipo, pero considerando cada stock (lote + bodega) como fila independiente
    const inventarioPorTipo = {};

    for (const lote of lotes) {
      const stocks = lote.stocks || [];
      if (!inventarioPorTipo[lote.tipo]) {
        inventarioPorTipo[lote.tipo] = {
          tipo: lote.tipo,
          cantidad_total: 0,
          lotes: []
        };
      }

      if (stocks.length === 0) {
        // Lote sin bodegas aún: se muestra con stock 0
        inventarioPorTipo[lote.tipo].lotes.push({
          id: lote.id,
          codigo_lote: lote.codigo_lote,
          cantidad_inicial: parseFloat(lote.cantidad_inicial),
          cantidad_actual: 0,
          porcentaje_disponible: '0.00',
          fecha_ingreso: lote.fecha_ingreso,
          proveedor: lote.proveedor,
          bodega_id: null,
          bodega: null
        });
        continue;
      }

      stocks.forEach(stock => {
        const cantidadActual = parseFloat(stock.cantidad_actual);
        inventarioPorTipo[lote.tipo].cantidad_total += cantidadActual;

        const porcentaje = lote.cantidad_inicial > 0
          ? ((cantidadActual / parseFloat(lote.cantidad_inicial)) * 100).toFixed(2)
          : '0.00';

        inventarioPorTipo[lote.tipo].lotes.push({
          id: lote.id,
          codigo_lote: lote.codigo_lote,
          cantidad_inicial: parseFloat(lote.cantidad_inicial),
          cantidad_actual: cantidadActual,
          porcentaje_disponible: porcentaje,
          fecha_ingreso: lote.fecha_ingreso,
          proveedor: lote.proveedor,
          bodega_id: stock.bodega_id,
          bodega: stock.bodega ? {
            id: stock.bodega.id,
            nombre: stock.bodega.nombre,
            ubicacion: stock.bodega.ubicacion
          } : null
        });
      });
    }

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
      bodega_id,
      bodega_origen_id,
      bodega_destino_id,
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
    if (!['entrada', 'consumo', 'traslado', 'ajuste'].includes(tipo_movimiento)) {
      return res.status(400).json({
        error: 'El tipo de movimiento debe ser "entrada", "consumo", "traslado" o "ajuste"'
      });
    }

    const t = await sequelize.transaction();

    try {
      let galpon = null;
      let bodegaConsumoId = bodega_id || null;

      // Si hay galpón, validar y, para consumo, obtener automáticamente su bodega asignada
      if (galpon_id) {
        galpon = await Galpon.findByPk(galpon_id, { transaction: t });
        if (!galpon) {
          await t.rollback();
          return res.status(404).json({
            error: 'El galpón especificado no existe'
          });
        }

        if (tipo_movimiento === 'consumo') {
          if (!galpon.bodega_id) {
            await t.rollback();
            return res.status(400).json({
              error: 'El galpón no tiene una bodega asignada para consumo de alimento'
            });
          }
          if (bodegaConsumoId && parseInt(bodegaConsumoId) !== galpon.bodega_id) {
            await t.rollback();
            return res.status(400).json({
              error: 'El consumo debe realizarse desde la bodega asignada al galpón'
            });
          }
          bodegaConsumoId = galpon.bodega_id;
        }
      }

      const cantidadNum = parseFloat(cantidad);

      const obtenerStock = async (loteId, bodegaId, tx) => {
        let stock = await StockLoteBodega.findOne({
          where: { lote_id: loteId, bodega_id: bodegaId },
          transaction: tx,
          lock: tx.LOCK.UPDATE
        });
        if (!stock) {
          stock = await StockLoteBodega.create({
            lote_id: loteId,
            bodega_id: bodegaId,
            cantidad_actual: 0
          }, { transaction: tx });
        }
        return stock;
      };

      let movimientoPayload = {
        lote_id,
        tipo_movimiento,
        cantidad: cantidadNum,
        galpon_id: galpon_id || null,
        fecha: fecha || new Date(),
        observaciones
      };

      if (tipo_movimiento === 'entrada') {
        if (!bodega_id) {
          await t.rollback();
          return res.status(400).json({
            error: 'Para una entrada se requiere bodega_id'
          });
        }

        const stock = await obtenerStock(lote_id, bodega_id, t);
        const nuevaCantidad = parseFloat(stock.cantidad_actual) + cantidadNum;
        await stock.update({ cantidad_actual: nuevaCantidad }, { transaction: t });

        movimientoPayload.bodega_id = bodega_id;
      } else if (tipo_movimiento === 'consumo') {
        if (!bodegaConsumoId) {
          await t.rollback();
          return res.status(400).json({
            error: 'No se pudo determinar la bodega desde la cual consumir'
          });
        }

        const stock = await obtenerStock(lote_id, bodegaConsumoId, t);
        if (parseFloat(stock.cantidad_actual) < cantidadNum) {
          await t.rollback();
          return res.status(400).json({
            error: `Stock insuficiente en la bodega asignada. Disponible: ${stock.cantidad_actual} kg`
          });
        }

        const nuevaCantidad = parseFloat(stock.cantidad_actual) - cantidadNum;
        await stock.update({ cantidad_actual: nuevaCantidad }, { transaction: t });

        movimientoPayload.bodega_id = bodegaConsumoId;
      } else if (tipo_movimiento === 'traslado') {
        if (!bodega_origen_id || !bodega_destino_id) {
          await t.rollback();
          return res.status(400).json({
            error: 'Para un traslado se requieren bodega_origen_id y bodega_destino_id'
          });
        }
        if (bodega_origen_id === bodega_destino_id) {
          await t.rollback();
          return res.status(400).json({
            error: 'La bodega de origen y destino no pueden ser la misma en un traslado'
          });
        }

        const stockOrigen = await obtenerStock(lote_id, bodega_origen_id, t);
        if (parseFloat(stockOrigen.cantidad_actual) < cantidadNum) {
          await t.rollback();
          return res.status(400).json({
            error: `Stock insuficiente en la bodega de origen. Disponible: ${stockOrigen.cantidad_actual} kg`
          });
        }

        const stockDestino = await obtenerStock(lote_id, bodega_destino_id, t);

        await stockOrigen.update(
          { cantidad_actual: parseFloat(stockOrigen.cantidad_actual) - cantidadNum },
          { transaction: t }
        );
        await stockDestino.update(
          { cantidad_actual: parseFloat(stockDestino.cantidad_actual) + cantidadNum },
          { transaction: t }
        );

        movimientoPayload.bodega_origen_id = bodega_origen_id;
        movimientoPayload.bodega_destino_id = bodega_destino_id;
      } else if (tipo_movimiento === 'ajuste') {
        if (!bodega_id) {
          await t.rollback();
          return res.status(400).json({
            error: 'Para un ajuste se requiere bodega_id'
          });
        }

        const stock = await obtenerStock(lote_id, bodega_id, t);
        const nuevaCantidad = cantidadNum; // En ajuste interpretamos cantidad como nuevo stock absoluto
        if (nuevaCantidad < 0) {
          await t.rollback();
          return res.status(400).json({
            error: 'El stock ajustado no puede ser negativo'
          });
        }

        await stock.update({ cantidad_actual: nuevaCantidad }, { transaction: t });

        movimientoPayload.bodega_id = bodega_id;
      }

      // Crear movimiento
      const movimiento = await InventarioAlimento.create(movimientoPayload, { transaction: t });

      // Actualizar cantidad_actual agregada en lotes_alimento para compatibilidad
      const stocksLote = await StockLoteBodega.findAll({
        where: { lote_id },
        transaction: t
      });
      const stockTotal = stocksLote.reduce(
        (sum, s) => sum + parseFloat(s.cantidad_actual),
        0
      );
      await lote.update({ cantidad_actual: stockTotal }, { transaction: t });

      await t.commit();

      // Detectar stock bajo (sin bloquear la respuesta)
      detectarStockBajo(lote_id).catch(err => {
        console.error('Error al detectar stock bajo:', err);
      });

      const movimientoConRelaciones = await InventarioAlimento.findByPk(movimiento.id, {
        include: [
          { model: LoteAlimento, as: 'lote' },
          { model: Galpon, as: 'galpon', attributes: ['id', 'numero', 'nombre'] },
          { model: Bodega, as: 'bodega', attributes: ['id', 'nombre'] },
          { model: Bodega, as: 'bodega_origen', attributes: ['id', 'nombre'] },
          { model: Bodega, as: 'bodega_destino', attributes: ['id', 'nombre'] }
        ]
      });

      res.status(201).json({
        mensaje: 'Movimiento registrado exitosamente',
        movimiento: movimientoConRelaciones
      });
    } catch (e) {
      await t.rollback();
      throw e;
    }
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
