const { RegistroDiario, Galpon, Granja } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { ejecutarDetecciones } = require('../services/alertaAutomatica');

// GET /api/registros - Listar registros diarios
const listarRegistros = async (req, res, next) => {
  try {
    const {
      galpon_id,
      fecha_inicio,
      fecha_fin,
      limit = 50,
      offset = 0
    } = req.query;

    const where = {};

    if (galpon_id) {
      where.galpon_id = galpon_id;
    }

    if (fecha_inicio || fecha_fin) {
      where.fecha = {};
      if (fecha_inicio) where.fecha[Op.gte] = fecha_inicio;
      if (fecha_fin) where.fecha[Op.lte] = fecha_fin;
    }

    const { count, rows: registros } = await RegistroDiario.findAndCountAll({
      where,
      include: [{
        model: Galpon,
        as: 'galpon',
        attributes: ['id', 'numero', 'nombre', 'lote'],
        include: [{
          model: Granja,
          as: 'granja',
          attributes: ['id', 'nombre']
        }]
      }],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      total: count,
      registros
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/registros/:id - Obtener registro por ID
const obtenerRegistro = async (req, res, next) => {
  try {
    const { id } = req.params;

    const registro = await RegistroDiario.findByPk(id, {
      include: [{
        model: Galpon,
        as: 'galpon',
        include: [{ model: Granja, as: 'granja' }]
      }]
    });

    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado'
      });
    }

    res.json(registro);
  } catch (error) {
    next(error);
  }
};

// POST /api/registros - Crear nuevo registro diario
const crearRegistro = async (req, res, next) => {
  try {
    const {
      galpon_id,
      fecha,
      edad_dias,
      consumo_kg,
      tipo_alimento,
      lote_alimento,
      cantidad_bultos = 0,
      mortalidad = 0,
      seleccion = 0,
      saldo_aves,
      peso_promedio,
      acumulado_alimento,
      temperatura,
      humedad,
      observaciones
    } = req.body;

    // Validar campos requeridos
    if (!galpon_id || !fecha || !edad_dias || consumo_kg === undefined) {
      return res.status(400).json({
        error: 'Campos requeridos: galpon_id, fecha, edad_dias, consumo_kg'
      });
    }

    // Validaciones de Fotos condicionales
    const files = req.files || {};
    if (parseInt(edad_dias) === 1 && !files.foto_factura) {
      return res.status(400).json({
        error: 'Para el día 1 (edad) es obligatoria la foto de la factura de gas.'
      });
    }

    if (parseInt(edad_dias) === 22 && !files.foto_medidor) {
      return res.status(400).json({
        error: 'Para el día 22 (edad) es obligatoria la foto del medidor de gas.'
      });
    }

    // Verificar que el galpón existe
    const galpon = await Galpon.findByPk(galpon_id);
    if (!galpon) {
      return res.status(404).json({
        error: 'El galpón especificado no existe'
      });
    }

    // Verificar que no exista un registro para esta fecha en este galpón
    const registroExistente = await RegistroDiario.findOne({
      where: { galpon_id, fecha }
    });

    if (registroExistente) {
      return res.status(409).json({
        error: `Ya existe un registro para la fecha ${fecha} en este galpón`,
        registro_existente: registroExistente
      });
    }

    // Obtener registro anterior para calcular valores
    const registroAnterior = await RegistroDiario.findOne({
      where: {
        galpon_id,
        fecha: { [Op.lt]: fecha }
      },
      order: [['fecha', 'DESC']],
      limit: 1
    });

    // Si no se proporciona saldo_aves, calcularlo basado en el registro anterior
    let saldoAvesCalculado = saldo_aves;
    if (saldoAvesCalculado === undefined || saldoAvesCalculado === null) {
      if (registroAnterior) {
        // Restar la mortalidad del día anterior para obtener el saldo actual
        saldoAvesCalculado = registroAnterior.saldo_aves - (mortalidad || 0);
      } else {
        // Si es el primer registro, usar la capacidad del galpón o un valor por defecto
        saldoAvesCalculado = galpon.capacidad_maxima || 0;
        // Si hay mortalidad, restarla
        saldoAvesCalculado = saldoAvesCalculado - (mortalidad || 0);
      }
    }

    // Si no se proporciona acumulado, calcularlo
    let acumulado = acumulado_alimento;
    if (!acumulado) {
      acumulado = registroAnterior
        ? parseFloat(registroAnterior.acumulado_alimento || 0) + parseFloat(consumo_kg)
        : parseFloat(consumo_kg);
    }

    // Crear registro
    const nuevoRegistro = await RegistroDiario.create({
      galpon_id,
      fecha,
      edad_dias,
      consumo_kg,
      tipo_alimento,
      lote_alimento,
      cantidad_bultos,
      mortalidad,
      seleccion,
      saldo_aves: saldoAvesCalculado,
      peso_promedio,
      acumulado_alimento: acumulado,
      temperatura,
      humedad,
      temperatura,
      humedad,
      observaciones,
      foto_factura: files.foto_factura ? `/uploads/${files.foto_factura[0].filename}` : null,
      foto_medidor: files.foto_medidor ? `/uploads/${files.foto_medidor[0].filename}` : null,
      sincronizado: true
    });

    const registroConGalpon = await RegistroDiario.findByPk(nuevoRegistro.id, {
      include: [{
        model: Galpon,
        as: 'galpon',
        include: [{ model: Granja, as: 'granja' }]
      }]
    });

    // Ejecutar detecciones de alertas automáticas (sin bloquear la respuesta)
    ejecutarDetecciones(galpon_id, nuevoRegistro).catch(err => {
      console.error('Error al ejecutar detecciones de alertas:', err);
    });

    res.status(201).json({
      mensaje: 'Registro creado exitosamente',
      registro: registroConGalpon
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/registros/:id - Actualizar registro
const actualizarRegistro = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      edad_dias,
      consumo_kg,
      tipo_alimento,
      lote_alimento,
      cantidad_bultos,
      mortalidad,
      seleccion,
      saldo_aves,
      peso_promedio,
      acumulado_alimento,
      temperatura,
      humedad,
      observaciones
    } = req.body;

    const registro = await RegistroDiario.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado'
      });
    }

    // Actualizar campos
    await registro.update({
      ...(edad_dias && { edad_dias }),
      ...(consumo_kg !== undefined && { consumo_kg }),
      ...(tipo_alimento !== undefined && { tipo_alimento }),
      ...(lote_alimento !== undefined && { lote_alimento }),
      ...(cantidad_bultos !== undefined && { cantidad_bultos }),
      ...(mortalidad !== undefined && { mortalidad }),
      ...(seleccion !== undefined && { seleccion }),
      ...(saldo_aves !== undefined && { saldo_aves }),
      ...(peso_promedio !== undefined && { peso_promedio }),
      ...(acumulado_alimento !== undefined && { acumulado_alimento }),
      ...(temperatura !== undefined && { temperatura }),
      ...(humedad !== undefined && { humedad }),
      ...(observaciones !== undefined && { observaciones })
    });

    const registroActualizado = await RegistroDiario.findByPk(id, {
      include: [{
        model: Galpon,
        as: 'galpon',
        include: [{ model: Granja, as: 'granja' }]
      }]
    });

    res.json({
      mensaje: 'Registro actualizado exitosamente',
      registro: registroActualizado
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/registros/:id - Eliminar registro
const eliminarRegistro = async (req, res, next) => {
  try {
    const { id } = req.params;

    const registro = await RegistroDiario.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado'
      });
    }

    await registro.destroy();

    res.json({
      mensaje: 'Registro eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/registros/sincronizar - Sincronizar registros offline
const sincronizarRegistros = async (req, res, next) => {
  try {
    const { registros } = req.body;

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({
        error: 'Se requiere un array de registros'
      });
    }

    const resultados = {
      exitosos: [],
      fallidos: []
    };

    for (const registro of registros) {
      try {
        // Verificar si ya existe
        const existente = await RegistroDiario.findOne({
          where: {
            galpon_id: registro.galpon_id,
            fecha: registro.fecha
          }
        });

        if (existente) {
          // Actualizar
          await existente.update({
            ...registro,
            sincronizado: true
          });
          resultados.exitosos.push({ tipo: 'actualizado', id: existente.id });
        } else {
          // Crear
          const nuevo = await RegistroDiario.create({
            ...registro,
            sincronizado: true
          });
          resultados.exitosos.push({ tipo: 'creado', id: nuevo.id });
        }
      } catch (error) {
        resultados.fallidos.push({
          registro,
          error: error.message
        });
      }
    }

    res.json({
      mensaje: 'Sincronización completada',
      total: registros.length,
      exitosos: resultados.exitosos.length,
      fallidos: resultados.fallidos.length,
      detalles: resultados
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarRegistros,
  obtenerRegistro,
  crearRegistro,
  actualizarRegistro,
  eliminarRegistro,
  sincronizarRegistros
};
