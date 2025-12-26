const { Galpon, RegistroDiario, Granja, Alerta, LoteAlimento } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// GET /api/dashboard/kpis - Obtener KPIs generales
const obtenerKPIs = async (req, res, next) => {
  try {
    const { granja_id, galpon_id } = req.query;

    const whereGalpon = { activo: true };

    if (granja_id) {
      whereGalpon.granja_id = granja_id;
    }

    if (galpon_id) {
      whereGalpon.id = galpon_id;
    }

    // Obtener todos los galpones activos
    const galpones = await Galpon.findAll({
      where: whereGalpon
    });

    if (galpones.length === 0) {
      return res.json({
        mensaje: 'No hay galpones activos',
        kpis: null
      });
    }

    const galponIds = galpones.map(g => g.id);

    // Obtener estadísticas agregadas de registros
    const estadisticas = await RegistroDiario.findAll({
      where: { galpon_id: { [Op.in]: galponIds } },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('mortalidad')), 'mortalidad_total'],
        [sequelize.fn('SUM', sequelize.col('seleccion')), 'seleccion_total'],
        [sequelize.fn('SUM', sequelize.col('consumo_kg')), 'consumo_total'],
        [sequelize.fn('AVG', sequelize.col('peso_promedio')), 'peso_promedio_global']
      ],
      raw: true
    });

    const stats = estadisticas[0];

    // Calcular totales
    const avesInicialesTotales = galpones.reduce((sum, g) => sum + g.aves_iniciales, 0);
    const mortalidadTotal = parseInt(stats.mortalidad_total) || 0;
    const seleccionTotal = parseInt(stats.seleccion_total) || 0;
    const consumoTotal = parseFloat(stats.consumo_total) || 0;
    const pesoPromedioGlobal = parseFloat(stats.peso_promedio_global) || 0;

    // Calcular porcentajes
    const porcentajeMortalidad = avesInicialesTotales > 0
      ? ((mortalidadTotal / avesInicialesTotales) * 100).toFixed(2)
      : 0;

    // Obtener último saldo total
    const ultimosRegistros = await Promise.all(
      galpones.map(async (galpon) => {
        const ultimo = await RegistroDiario.findOne({
          where: { galpon_id: galpon.id },
          order: [['fecha', 'DESC']],
          limit: 1,
          attributes: ['saldo_aves', 'peso_promedio']
        });
        return {
          saldo: ultimo ? ultimo.saldo_aves : galpon.aves_iniciales,
          peso: ultimo ? parseFloat(ultimo.peso_promedio || 0) : 0
        };
      })
    );

    const saldoTotalActual = ultimosRegistros.reduce((sum, r) => sum + r.saldo, 0);
    const pesoTotalGanado = ultimosRegistros.reduce((sum, r) => sum + (r.peso * r.saldo), 0) / 1000; // kg

    // Calcular Conversion (Conversión Alimenticia)
    const conversion = pesoTotalGanado > 0
      ? (consumoTotal / pesoTotalGanado).toFixed(2)
      : 0;

    // Contar alertas activas
    const alertasActivas = await Alerta.count({
      where: {
        atendida: false,
        ...(galpon_id && { galpon_id })
      }
    });

    // Inventario total
    const inventarioTotal = await LoteAlimento.sum('cantidad_actual') || 0;

    // Stock bajo (menos del 30% de la cantidad inicial)
    const lotesStockBajo = await LoteAlimento.count({
      where: sequelize.where(
        sequelize.col('cantidad_actual'),
        Op.lt,
        sequelize.literal('cantidad_inicial * 0.3')
      )
    });

    res.json({
      kpis: {
        galpones_activos: galpones.length,
        aves_iniciales_totales: avesInicialesTotales,
        saldo_actual_total: saldoTotalActual,
        mortalidad_total: mortalidadTotal,
        seleccion_total: seleccionTotal,
        porcentaje_mortalidad: parseFloat(porcentajeMortalidad),
        consumo_total_kg: parseFloat(consumoTotal).toFixed(2),
        peso_promedio_global_g: parseFloat(pesoPromedioGlobal).toFixed(2),
        conversion: parseFloat(conversion),
        alertas_activas: alertasActivas,
        inventario_total_kg: parseFloat(inventarioTotal).toFixed(2),
        lotes_stock_bajo: lotesStockBajo
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/graficas - Datos para gráficas
const obtenerDatosGraficas = async (req, res, next) => {
  try {
    const { galpon_id } = req.query;

    if (!galpon_id) {
      return res.status(400).json({
        error: 'El parámetro galpon_id es requerido'
      });
    }

    // Verificar que el galpón existe
    const galpon = await Galpon.findByPk(galpon_id);
    if (!galpon) {
      return res.status(404).json({
        error: 'Galpón no encontrado'
      });
    }

    // Obtener todos los registros del galpón ordenados por fecha
    const registros = await RegistroDiario.findAll({
      where: { galpon_id },
      order: [['fecha', 'ASC']],
      attributes: [
        'fecha',
        'edad_dias',
        'mortalidad',
        'saldo_aves',
        'peso_promedio',
        'consumo_kg',
        'acumulado_alimento'
      ]
    });

    // Preparar datos para gráficas
    const datosGraficas = {
      mortalidad_vs_edad: registros.map(r => ({
        edad_dias: r.edad_dias,
        fecha: r.fecha,
        mortalidad: r.mortalidad,
        mortalidad_acumulada: galpon.aves_iniciales - r.saldo_aves
      })),
      peso_vs_edad: registros.map(r => ({
        edad_dias: r.edad_dias,
        fecha: r.fecha,
        peso_promedio: parseFloat(r.peso_promedio || 0)
      })),
      consumo_vs_edad: registros.map(r => ({
        edad_dias: r.edad_dias,
        fecha: r.fecha,
        consumo_diario: parseFloat(r.consumo_kg),
        consumo_acumulado: parseFloat(r.acumulado_alimento || 0)
      })),
      saldo_aves: registros.map(r => ({
        edad_dias: r.edad_dias,
        fecha: r.fecha,
        saldo: r.saldo_aves
      }))
    };

    res.json({
      galpon: {
        id: galpon.id,
        numero: galpon.numero,
        nombre: galpon.nombre,
        lote: galpon.lote,
        aves_iniciales: galpon.aves_iniciales
      },
      graficas: datosGraficas,
      total_registros: registros.length
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/resumen-granjas - Resumen de todas las granjas
const obtenerResumenGranjas = async (req, res, next) => {
  try {
    const granjas = await Granja.findAll({
      include: [{
        model: Galpon,
        as: 'galpones',
        where: { activo: true },
        required: false
      }]
    });

    const resumen = await Promise.all(
      granjas.map(async (granja) => {
        const galpones = granja.galpones;
        const galponIds = galpones.map(g => g.id);

        if (galponIds.length === 0) {
          return {
            granja: {
              id: granja.id,
              nombre: granja.nombre,
              ubicacion: granja.ubicacion
            },
            estadisticas: {
              galpones_activos: 0,
              aves_totales: 0,
              mortalidad_total: 0,
              consumo_total: 0
            }
          };
        }

        const stats = await RegistroDiario.findAll({
          where: { galpon_id: { [Op.in]: galponIds } },
          attributes: [
            [sequelize.fn('SUM', sequelize.col('mortalidad')), 'mortalidad_total'],
            [sequelize.fn('SUM', sequelize.col('consumo_kg')), 'consumo_total']
          ],
          raw: true
        });

        const avesTotales = galpones.reduce((sum, g) => sum + g.aves_iniciales, 0);

        return {
          granja: {
            id: granja.id,
            nombre: granja.nombre,
            ubicacion: granja.ubicacion
          },
          estadisticas: {
            galpones_activos: galpones.length,
            aves_totales: avesTotales,
            mortalidad_total: parseInt(stats[0].mortalidad_total) || 0,
            consumo_total: parseFloat(stats[0].consumo_total || 0).toFixed(2)
          }
        };
      })
    );

    res.json({
      total_granjas: granjas.length,
      resumen
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/comparacion-galpones - Comparar métricas entre galpones
const compararGalpones = async (req, res, next) => {
  try {
    const { granja_id } = req.query;

    const whereGalpon = { activo: true };
    if (granja_id) {
      whereGalpon.granja_id = granja_id;
    }

    // Obtener todos los galpones activos
    const galpones = await Galpon.findAll({
      where: whereGalpon,
      order: [['numero', 'ASC']]
    });

    if (galpones.length === 0) {
      return res.json({
        mensaje: 'No hay galpones activos para comparar',
        galpones: []
      });
    }

    // Calcular métricas para cada galpón
    const comparacion = await Promise.all(
      galpones.map(async (galpon) => {
        // Obtener estadísticas del galpón
        const stats = await RegistroDiario.findAll({
          where: { galpon_id: galpon.id },
          attributes: [
            [sequelize.fn('SUM', sequelize.col('mortalidad')), 'mortalidad_total'],
            [sequelize.fn('SUM', sequelize.col('seleccion')), 'seleccion_total'],
            [sequelize.fn('SUM', sequelize.col('consumo_kg')), 'consumo_total'],
            [sequelize.fn('AVG', sequelize.col('peso_promedio')), 'peso_promedio']
          ],
          raw: true
        });

        const stat = stats[0];

        // Obtener último registro para saldo actual
        const ultimoRegistro = await RegistroDiario.findOne({
          where: { galpon_id: galpon.id },
          order: [['fecha', 'DESC']],
          attributes: ['saldo_aves', 'peso_promedio', 'edad_dias']
        });

        const mortalidadTotal = parseInt(stat.mortalidad_total) || 0;
        const seleccionTotal = parseInt(stat.seleccion_total) || 0;
        const consumoTotal = parseFloat(stat.consumo_total) || 0;
        const pesoPromedio = parseFloat(stat.peso_promedio) || 0;
        const saldoActual = ultimoRegistro ? ultimoRegistro.saldo_aves : galpon.aves_iniciales;
        const edadActual = ultimoRegistro ? ultimoRegistro.edad_dias : 0;

        // Calcular porcentaje de mortalidad
        const porcentajeMortalidad = galpon.aves_iniciales > 0
          ? ((mortalidadTotal / galpon.aves_iniciales) * 100).toFixed(2)
          : 0;

        // Calcular Conversion (Feed Conversion Ratio)
        const pesoTotalGanado = saldoActual * (pesoPromedio / 1000); // kg
        const conversion = pesoTotalGanado > 0
          ? (consumoTotal / pesoTotalGanado).toFixed(2)
          : 0;

        // Calcular tasa de supervivencia
        const supervivencia = galpon.aves_iniciales > 0
          ? ((saldoActual / galpon.aves_iniciales) * 100).toFixed(2)
          : 0;

        return {
          galpon: {
            id: galpon.id,
            numero: galpon.numero,
            nombre: galpon.nombre,
            lote: galpon.lote,
            sexo: galpon.sexo,
            aves_iniciales: galpon.aves_iniciales
          },
          metricas: {
            edad_actual_dias: edadActual,
            saldo_actual: saldoActual,
            mortalidad_total: mortalidadTotal,
            porcentaje_mortalidad: parseFloat(porcentajeMortalidad),
            tasa_supervivencia: parseFloat(supervivencia),
            consumo_total_kg: parseFloat(consumoTotal).toFixed(2),
            consumo_por_ave: saldoActual > 0 ? (consumoTotal / saldoActual).toFixed(2) : 0,
            peso_promedio_g: parseFloat(pesoPromedio).toFixed(2),
            conversion: parseFloat(conversion),
            eficiencia: conversion > 0 && conversion <= 2.5 ? 'Excelente' :
                       conversion > 2.5 && conversion <= 3.0 ? 'Buena' :
                       conversion > 3.0 && conversion <= 3.5 ? 'Regular' : 'Baja'
          }
        };
      })
    );

    res.json({
      total_galpones: galpones.length,
      comparacion
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/comparacion-personalizada - Comparar 2 galpones con rangos de fecha
const comparacionPersonalizada = async (req, res, next) => {
  try {
    const {
      galpon1_id,
      galpon2_id,
      fecha_inicio_1,
      fecha_fin_1,
      fecha_inicio_2,
      fecha_fin_2
    } = req.query;

    // Validar parámetros requeridos
    if (!galpon1_id || !fecha_inicio_1 || !fecha_fin_1) {
      return res.status(400).json({
        error: 'Parámetros requeridos: galpon1_id, fecha_inicio_1, fecha_fin_1'
      });
    }

    // Si es el mismo galpón en diferentes períodos
    const mismoGalpon = galpon1_id === galpon2_id;

    // Función para calcular métricas de un galpón en un rango
    const calcularMetricas = async (galponId, fechaInicio, fechaFin) => {
      const galpon = await Galpon.findByPk(galponId);
      if (!galpon) {
        throw new Error(`Galpón ${galponId} no encontrado`);
      }

      // Obtener registros del período
      const registros = await RegistroDiario.findAll({
        where: {
          galpon_id: galponId,
          fecha: {
            [Op.gte]: fechaInicio,
            [Op.lte]: fechaFin
          }
        },
        order: [['fecha', 'ASC']]
      });

      if (registros.length === 0) {
        return {
          galpon: {
            id: galpon.id,
            numero: galpon.numero,
            nombre: galpon.nombre,
            lote: galpon.lote
          },
          periodo: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
          dias_con_datos: 0,
          metricas: null,
          registros: []
        };
      }

      // Calcular métricas del período
      const primerRegistro = registros[0];
      const ultimoRegistro = registros[registros.length - 1];

      const mortalidadPeriodo = registros.reduce((sum, r) => sum + (r.mortalidad || 0), 0);
      const seleccionPeriodo = registros.reduce((sum, r) => sum + (r.seleccion || 0), 0);
      const consumoPeriodo = registros.reduce((sum, r) => sum + parseFloat(r.consumo_kg || 0), 0);
      const pesoPromedio = registros.reduce((sum, r) => sum + parseFloat(r.peso_promedio || 0), 0) / registros.length;

      const avesPeriodoInicio = primerRegistro.saldo_aves + mortalidadPeriodo + seleccionPeriodo;
      const avesPeriodoFin = ultimoRegistro.saldo_aves;

      const porcentajeMortalidad = avesPeriodoInicio > 0
        ? ((mortalidadPeriodo / avesPeriodoInicio) * 100).toFixed(2)
        : 0;

      const tasaSupervivencia = avesPeriodoInicio > 0
        ? ((avesPeriodoFin / avesPeriodoInicio) * 100).toFixed(2)
        : 0;

      // Calcular ganancia de peso
      const pesoInicial = parseFloat(primerRegistro.peso_promedio || 0);
      const pesoFinal = parseFloat(ultimoRegistro.peso_promedio || 0);
      const gananciaPeso = pesoFinal - pesoInicial;

      // Calcular Conversion
      const pesoTotalGanado = avesPeriodoFin * (gananciaPeso / 1000); // kg
      const conversion = pesoTotalGanado > 0
        ? (consumoPeriodo / pesoTotalGanado).toFixed(2)
        : 0;

      // Promedios diarios
      const diasConDatos = registros.length;
      const mortalidadPromedioDia = (mortalidadPeriodo / diasConDatos).toFixed(2);
      const consumoPromedioDia = (consumoPeriodo / diasConDatos).toFixed(2);

      return {
        galpon: {
          id: galpon.id,
          numero: galpon.numero,
          nombre: galpon.nombre,
          lote: galpon.lote
        },
        periodo: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        },
        dias_con_datos: diasConDatos,
        metricas: {
          aves_inicio_periodo: avesPeriodoInicio,
          aves_fin_periodo: avesPeriodoFin,
          mortalidad_total: mortalidadPeriodo,
          mortalidad_promedio_dia: parseFloat(mortalidadPromedioDia),
          porcentaje_mortalidad: parseFloat(porcentajeMortalidad),
          seleccion_total: seleccionPeriodo,
          tasa_supervivencia: parseFloat(tasaSupervivencia),
          consumo_total_kg: parseFloat(consumoPeriodo).toFixed(2),
          consumo_promedio_dia: parseFloat(consumoPromedioDia),
          consumo_por_ave: avesPeriodoFin > 0 ? (consumoPeriodo / avesPeriodoFin).toFixed(2) : 0,
          peso_inicial_g: parseFloat(pesoInicial).toFixed(1),
          peso_final_g: parseFloat(pesoFinal).toFixed(1),
          ganancia_peso_g: parseFloat(gananciaPeso).toFixed(1),
          peso_promedio_periodo_g: parseFloat(pesoPromedio).toFixed(1),
          conversion: parseFloat(conversion),
          eficiencia: conversion > 0 && conversion <= 2.5 ? 'Excelente' :
                     conversion > 2.5 && conversion <= 3.0 ? 'Buena' :
                     conversion > 3.0 && conversion <= 3.5 ? 'Regular' : 'Baja',
          edad_inicio: primerRegistro.edad_dias,
          edad_fin: ultimoRegistro.edad_dias
        },
        registros: registros.map(r => ({
          fecha: r.fecha,
          edad_dias: r.edad_dias,
          mortalidad: r.mortalidad,
          consumo_kg: parseFloat(r.consumo_kg),
          peso_promedio: parseFloat(r.peso_promedio || 0),
          saldo_aves: r.saldo_aves
        }))
      };
    };

    // Calcular métricas para el primer galpón/período
    const metricas1 = await calcularMetricas(galpon1_id, fecha_inicio_1, fecha_fin_1);

    // Calcular métricas para el segundo galpón/período (si se especifica)
    let metricas2 = null;
    if (galpon2_id && fecha_inicio_2 && fecha_fin_2) {
      metricas2 = await calcularMetricas(galpon2_id, fecha_inicio_2, fecha_fin_2);
    }

    res.json({
      tipo_comparacion: mismoGalpon && metricas2 ? 'mismo_galpon_diferentes_periodos' : 'diferentes_galpones',
      comparacion_1: metricas1,
      comparacion_2: metricas2
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerKPIs,
  obtenerDatosGraficas,
  obtenerResumenGranjas,
  compararGalpones,
  comparacionPersonalizada
};
