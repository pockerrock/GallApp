const { Galpon, Granja, RegistroDiario } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// GET /api/galpones - Listar galpones
const listarGalpones = async (req, res, next) => {
  try {
    const { granja_id, activo } = req.query;
    const usuario = req.usuario;

    // Construir filtros
    const where = {};

    // Filtrar por granja del usuario si no es dueño
    if (usuario.rol !== 'dueno' && usuario.granja_id) {
      where.granja_id = usuario.granja_id;
    } else if (granja_id) {
      where.granja_id = granja_id;
    }

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const galpones = await Galpon.findAll({
      where,
      include: [
        {
          model: Granja,
          as: 'granja',
          attributes: ['id', 'nombre', 'ubicacion']
        },
        {
          model: Galpon,
          as: 'divisiones',
          attributes: ['id', 'numero', 'division_sufijo']
        }
      ],
      order: [['granja_id', 'ASC'], ['numero', 'ASC'], ['division_sufijo', 'ASC']]
    });

    res.json({
      total: galpones.length,
      galpones
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/galpones/:id - Obtener galpón por ID
const obtenerGalpon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const galpon = await Galpon.findByPk(id, {
      include: [{
        model: Granja,
        as: 'granja',
        attributes: ['id', 'nombre', 'ubicacion']
      }]
    });

    if (!galpon) {
      return res.status(404).json({
        error: 'Galpón no encontrado'
      });
    }

    res.json(galpon);
  } catch (error) {
    next(error);
  }
};

// GET /api/galpones/:id/resumen - Resumen del galpón con estadísticas
const obtenerResumenGalpon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const galpon = await Galpon.findByPk(id, {
      include: [{
        model: Granja,
        as: 'granja',
        attributes: ['id', 'nombre']
      }]
    });

    if (!galpon) {
      return res.status(404).json({
        error: 'Galpón no encontrado'
      });
    }

    // Obtener estadísticas de los registros
    const estadisticas = await RegistroDiario.findAll({
      where: { galpon_id: id },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('mortalidad')), 'mortalidad_total'],
        [sequelize.fn('SUM', sequelize.col('seleccion')), 'seleccion_total'],
        [sequelize.fn('SUM', sequelize.col('consumo_kg')), 'consumo_total'],
        [sequelize.fn('MAX', sequelize.col('saldo_aves')), 'ultimo_saldo'],
        [sequelize.fn('MAX', sequelize.col('peso_promedio')), 'ultimo_peso'],
        [sequelize.fn('MAX', sequelize.col('edad_dias')), 'edad_actual'],
        [sequelize.fn('MAX', sequelize.col('acumulado_alimento')), 'acumulado_total']
      ],
      raw: true
    });

    const stats = estadisticas[0];

    // Calcular días transcurridos
    const fechaInicio = new Date(galpon.fecha_inicio);
    const hoy = new Date();
    const diasTranscurridos = Math.floor((hoy - fechaInicio) / (1000 * 60 * 60 * 24));

    // Calcular porcentaje de mortalidad
    const mortalidadTotal = parseInt(stats.mortalidad_total) || 0;
    const porcentajeMortalidad = galpon.aves_iniciales > 0
      ? ((mortalidadTotal / galpon.aves_iniciales) * 100).toFixed(2)
      : 0;

    // Calcular Conversion (Conversión Alimenticia)
    const consumoTotal = parseFloat(stats.consumo_total) || 0;
    const pesoPromedio = parseFloat(stats.ultimo_peso) || 0;
    const saldoActual = parseInt(stats.ultimo_saldo) || galpon.aves_iniciales;
    const pesoTotalGanado = (pesoPromedio * saldoActual) / 1000; // kg
    const conversion = pesoTotalGanado > 0 ? (consumoTotal / pesoTotalGanado).toFixed(2) : 0;

    res.json({
      galpon: {
        id: galpon.id,
        numero: galpon.numero,
        nombre: galpon.nombre,
        lote: galpon.lote,
        sexo: galpon.sexo,
        capacidad: galpon.capacidad,
        aves_iniciales: galpon.aves_iniciales,
        fecha_inicio: galpon.fecha_inicio,
        activo: galpon.activo,
        granja: galpon.granja
      },
      estadisticas: {
        dias_transcurridos: diasTranscurridos,
        edad_actual: parseInt(stats.edad_actual) || 0,
        saldo_actual: saldoActual,
        mortalidad_total: mortalidadTotal,
        seleccion_total: parseInt(stats.seleccion_total) || 0,
        porcentaje_mortalidad: parseFloat(porcentajeMortalidad),
        consumo_total_kg: parseFloat(consumoTotal).toFixed(2),
        acumulado_alimento_kg: parseFloat(stats.acumulado_total || 0).toFixed(2),
        peso_promedio_actual_g: parseFloat(pesoPromedio).toFixed(2),
        conversion: parseFloat(conversion)
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/galpones - Crear nuevo galpón
const crearGalpon = async (req, res, next) => {
  try {
    const {
      granja_id,
      numero,
      nombre,
      sexo,
      lote,
      capacidad,
      aves_iniciales,
      fecha_inicio
    } = req.body;

    // Validar campos requeridos
    if (!granja_id || !numero || !capacidad || !aves_iniciales || !fecha_inicio) {
      return res.status(400).json({
        error: 'Campos requeridos: granja_id, numero, capacidad, aves_iniciales, fecha_inicio'
      });
    }

    // Verificar que la granja existe
    const granja = await Granja.findByPk(granja_id);
    if (!granja) {
      return res.status(404).json({
        error: 'La granja especificada no existe'
      });
    }

    // Verificar que no exista un galpón con el mismo número en la granja
    const galponExistente = await Galpon.findOne({
      where: { granja_id, numero }
    });

    if (galponExistente) {
      return res.status(409).json({
        error: `Ya existe un galpón con el número ${numero} en esta granja`
      });
    }

    // Crear galpón
    const nuevoGalpon = await Galpon.create({
      granja_id,
      numero,
      nombre,
      sexo,
      lote,
      capacidad,
      aves_iniciales,
      fecha_inicio,
      activo: true
    });

    const galponConGranja = await Galpon.findByPk(nuevoGalpon.id, {
      include: [{ model: Granja, as: 'granja' }]
    });

    res.status(201).json({
      mensaje: 'Galpón creado exitosamente',
      galpon: galponConGranja
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/galpones/:id - Actualizar galpón
const actualizarGalpon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      numero,
      nombre,
      sexo,
      lote,
      capacidad,
      aves_iniciales,
      fecha_inicio,
      activo
    } = req.body;

    const galpon = await Galpon.findByPk(id);

    if (!galpon) {
      return res.status(404).json({
        error: 'Galpón no encontrado'
      });
    }

    // Si se cambia el número, verificar que no exista otro con ese número
    if (numero && numero !== galpon.numero) {
      const galponExistente = await Galpon.findOne({
        where: {
          granja_id: galpon.granja_id,
          numero,
          id: { [Op.ne]: id }
        }
      });

      if (galponExistente) {
        return res.status(409).json({
          error: `Ya existe un galpón con el número ${numero} en esta granja`
        });
      }
    }

    // Actualizar campos
    await galpon.update({
      ...(numero && { numero }),
      ...(nombre !== undefined && { nombre }),
      ...(sexo && { sexo }),
      ...(lote !== undefined && { lote }),
      ...(capacidad && { capacidad }),
      ...(aves_iniciales && { aves_iniciales }),
      ...(fecha_inicio && { fecha_inicio }),
      ...(activo !== undefined && { activo })
    });

    const galponActualizado = await Galpon.findByPk(id, {
      include: [{ model: Granja, as: 'granja' }]
    });

    res.json({
      mensaje: 'Galpón actualizado exitosamente',
      galpon: galponActualizado
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/galpones/:id - Eliminar (desactivar) galpón
const eliminarGalpon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const galpon = await Galpon.findByPk(id);

    if (!galpon) {
      return res.status(404).json({
        error: 'Galpón no encontrado'
      });
    }

    // Desactivar en lugar de eliminar
    await galpon.update({ activo: false });

    res.json({
      mensaje: 'Galpón desactivado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/galpones/:id/dividir - Dividir galpón en dos mitades
const dividirGalpon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await sequelize.transaction();

    try {
      const galponOriginal = await Galpon.findByPk(id, {
        include: [{ model: RegistroDiario, as: 'registros', order: [['fecha', 'DESC']], limit: 1 }],
        transaction
      });

      if (!galponOriginal) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Galpón no encontrado'
        });
      }

      // Verificar que no esté ya dividido
      if (galponOriginal.es_division) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'No se puede dividir un galpón que ya es una división'
        });
      }

      // Verificar que no tenga divisiones existentes
      const divisionesExistentes = await Galpon.findAll({
        where: { galpon_padre_id: id },
        transaction
      });

      if (divisionesExistentes.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Este galpón ya tiene divisiones'
        });
      }

      // Obtener el último registro para obtener el saldo actual
      const ultimoRegistro = galponOriginal.registros && galponOriginal.registros[0];
      const saldoActual = ultimoRegistro ? ultimoRegistro.saldo_aves : galponOriginal.aves_iniciales;

      const { aves_division_a } = req.body;
      const avesA = aves_division_a ? parseInt(aves_division_a) : Math.floor(saldoActual / 2);
      const avesB = saldoActual - avesA;

      if (avesA < 1 || avesB < 1) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'La cantidad de aves para cada división debe ser al menos 1'
        });
      }

      // Marcar el galpón original como padre
      await galponOriginal.update({
        es_division: false,
        galpon_padre_id: null
      }, { transaction });

      // Crear Galpón 7-A
      const galponA = await Galpon.create({
        granja_id: galponOriginal.granja_id,
        numero: galponOriginal.numero,
        nombre: galponOriginal.nombre ? `${galponOriginal.nombre} - A` : null,
        sexo: galponOriginal.sexo,
        lote: galponOriginal.lote,
        capacidad: Math.floor(galponOriginal.capacidad / 2), // Capacidad se divide equitativamente por defecto
        aves_iniciales: avesA,
        fecha_inicio: galponOriginal.fecha_inicio,
        activo: true,
        galpon_padre_id: id,
        division_sufijo: 'A',
        es_division: true
      }, { transaction });

      // Crear Galpón 7-B
      const galponB = await Galpon.create({
        granja_id: galponOriginal.granja_id,
        numero: galponOriginal.numero,
        nombre: galponOriginal.nombre ? `${galponOriginal.nombre} - B` : null,
        sexo: galponOriginal.sexo,
        lote: galponOriginal.lote,
        capacidad: Math.ceil(galponOriginal.capacidad / 2),
        aves_iniciales: avesB,
        fecha_inicio: galponOriginal.fecha_inicio,
        activo: true,
        galpon_padre_id: id,
        division_sufijo: 'B',
        es_division: true
      }, { transaction });

      // Si hay un último registro, crear registros iniciales para las divisiones
      if (ultimoRegistro) {
        const fechaDivision = new Date().toISOString().split('T')[0];

        await RegistroDiario.create({
          galpon_id: galponA.id,
          fecha: fechaDivision,
          edad_dias: ultimoRegistro.edad_dias,
          consumo_kg: 0,
          saldo_aves: avesA,
          peso_promedio: ultimoRegistro.peso_promedio,
          acumulado_alimento: 0
        }, { transaction });

        await RegistroDiario.create({
          galpon_id: galponB.id,
          fecha: fechaDivision,
          edad_dias: ultimoRegistro.edad_dias,
          consumo_kg: 0,
          saldo_aves: avesB,
          peso_promedio: ultimoRegistro.peso_promedio,
          acumulado_alimento: 0
        }, { transaction });
      }

      await transaction.commit();

      const galponesCreados = await Galpon.findAll({
        where: { id: [galponA.id, galponB.id] },
        include: [{ model: Granja, as: 'granja' }],
        order: [['division_sufijo', 'ASC']]
      });

      res.status(201).json({
        mensaje: 'Galpón dividido exitosamente',
        galpon_original: galponOriginal,
        divisiones: galponesCreados
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarGalpones,
  obtenerGalpon,
  obtenerResumenGalpon,
  crearGalpon,
  actualizarGalpon,
  eliminarGalpon,
  dividirGalpon
};
