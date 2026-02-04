const { Alerta, Galpon, LoteAlimento, RegistroDiario, StockLoteBodega } = require('../models');
const { Op } = require('sequelize');

// Thresholds configurables (pueden venir de .env en el futuro)
const THRESHOLDS = {
  MORTALIDAD_ALTA: parseFloat(process.env.MORTALIDAD_ALERTA_ALTA) || 5, // %
  MORTALIDAD_CRITICA: parseFloat(process.env.MORTALIDAD_ALERTA_CRITICA) || 10, // %
  STOCK_BAJO_PORCENTAJE: parseFloat(process.env.STOCK_BAJO_PORCENTAJE) || 20, // %
  STOCK_CRITICO_PORCENTAJE: parseFloat(process.env.STOCK_CRITICO_PORCENTAJE) || 10, // %
  VARIACION_PESO_ALERTA: parseFloat(process.env.VARIACION_PESO_ALERTA) || 15, // %
  CONSUMO_ANORMAL_PORCENTAJE: parseFloat(process.env.CONSUMO_ANORMAL_PORCENTAJE) || 25, // %
  DIAS_MORTALIDAD_CONSECUTIVA: parseInt(process.env.DIAS_MORTALIDAD_CONSECUTIVA) || 3
};

/**
 * Detectar mortalidad alta en un galpón
 * @param {number} galpon_id - ID del galpón
 * @param {Object} registroActual - Registro diario actual
 */
const detectarMortalidadAlta = async (galpon_id, registroActual) => {
  try {
    const galpon = await Galpon.findByPk(galpon_id);
    if (!galpon) return null;

    const mortalidad = registroActual.mortalidad || 0;
    const porcentajeMortalidad = galpon.aves_iniciales > 0
      ? (mortalidad / galpon.aves_iniciales) * 100
      : 0;

    // Verificar si ya existe una alerta activa similar
    const alertaExistente = await Alerta.findOne({
      where: {
        galpon_id,
        tipo: 'mortalidad_alta',
        atendida: false
      }
    });

    // Mortalidad crítica (> 10% en un día)
    if (porcentajeMortalidad >= THRESHOLDS.MORTALIDAD_CRITICA && !alertaExistente) {
      return await Alerta.create({
        galpon_id,
        tipo: 'mortalidad_alta',
        severidad: 'alta',
        mensaje: `Mortalidad crítica detectada: ${mortalidad} aves (${porcentajeMortalidad.toFixed(2)}%) en el día ${registroActual.edad_dias}. Requiere atención inmediata.`,
        atendida: false
      });
    }

    // Mortalidad alta (> 5% en un día)
    if (porcentajeMortalidad >= THRESHOLDS.MORTALIDAD_ALTA && porcentajeMortalidad < THRESHOLDS.MORTALIDAD_CRITICA && !alertaExistente) {
      return await Alerta.create({
        galpon_id,
        tipo: 'mortalidad_alta',
        severidad: 'media',
        mensaje: `Mortalidad elevada: ${mortalidad} aves (${porcentajeMortalidad.toFixed(2)}%) en el día ${registroActual.edad_dias}. Revisar condiciones del galpón.`,
        atendida: false
      });
    }

    // Detectar mortalidad consecutiva (3+ días seguidos con mortalidad > 0)
    const registrosRecientes = await RegistroDiario.findAll({
      where: { galpon_id },
      order: [['fecha', 'DESC']],
      limit: THRESHOLDS.DIAS_MORTALIDAD_CONSECUTIVA
    });

    const mortalidadConsecutiva = registrosRecientes.every(r => r.mortalidad > 0);
    if (mortalidadConsecutiva && registrosRecientes.length >= THRESHOLDS.DIAS_MORTALIDAD_CONSECUTIVA && !alertaExistente) {
      const totalMortalidad = registrosRecientes.reduce((sum, r) => sum + r.mortalidad, 0);
      return await Alerta.create({
        galpon_id,
        tipo: 'mortalidad_alta',
        severidad: 'media',
        mensaje: `Mortalidad consecutiva detectada: ${totalMortalidad} aves perdidas en los últimos ${THRESHOLDS.DIAS_MORTALIDAD_CONSECUTIVA} días. Investigar causa.`,
        atendida: false
      });
    }

    return null;
  } catch (error) {
    console.error('Error al detectar mortalidad alta:', error);
    return null;
  }
};

/**
 * Detectar stock bajo de alimento
 * @param {number} lote_id - ID del lote
 */
const detectarStockBajo = async (lote_id) => {
  try {
    const lote = await LoteAlimento.findByPk(lote_id, {
      include: [{
        model: StockLoteBodega,
        as: 'stocks'
      }]
    });
    if (!lote) return null;

    // Calcular stock total real como suma de todas las bodegas
    const stockTotal = (lote.stocks || []).reduce(
      (sum, s) => sum + parseFloat(s.cantidad_actual),
      0
    );

    const porcentajeDisponible = lote.cantidad_inicial > 0
      ? (stockTotal / lote.cantidad_inicial) * 100
      : 0;

    // Verificar si ya existe alerta activa
    const alertaExistente = await Alerta.findOne({
      where: {
        lote_id,
        tipo: 'stock_bajo',
        atendida: false
      }
    });

    // Stock crítico (< 10%)
    if (porcentajeDisponible <= THRESHOLDS.STOCK_CRITICO_PORCENTAJE && porcentajeDisponible > 0 && !alertaExistente) {
      return await Alerta.create({
        lote_id,
        tipo: 'stock_bajo',
        severidad: 'alta',
        mensaje: `Stock crítico en lote ${lote.codigo_lote} (${lote.tipo}): ${stockTotal.toFixed(2)} kg restantes (${porcentajeDisponible.toFixed(1)}%). Ordenar reposición urgente.`,
        atendida: false
      });
    }

    // Stock bajo (< 20%)
    if (porcentajeDisponible <= THRESHOLDS.STOCK_BAJO_PORCENTAJE && porcentajeDisponible > THRESHOLDS.STOCK_CRITICO_PORCENTAJE && !alertaExistente) {
      return await Alerta.create({
        lote_id,
        tipo: 'stock_bajo',
        severidad: 'media',
        mensaje: `Stock bajo en lote ${lote.codigo_lote} (${lote.tipo}): ${stockTotal.toFixed(2)} kg restantes (${porcentajeDisponible.toFixed(1)}%). Considerar reposición.`,
        atendida: false
      });
    }

    // Stock agotado
    if (stockTotal <= 0 && !alertaExistente) {
      return await Alerta.create({
        lote_id,
        tipo: 'stock_bajo',
        severidad: 'alta',
        mensaje: `Lote agotado: ${lote.codigo_lote} (${lote.tipo}). Stock en 0 kg.`,
        atendida: false
      });
    }

    return null;
  } catch (error) {
    console.error('Error al detectar stock bajo:', error);
    return null;
  }
};

/**
 * Detectar peso anormal en aves
 * @param {number} galpon_id - ID del galpón
 * @param {Object} registroActual - Registro diario actual
 */
const detectarPesoAnormal = async (galpon_id, registroActual) => {
  try {
    if (!registroActual.peso_promedio || registroActual.peso_promedio === 0) {
      return null; // No hay dato de peso
    }

    // Obtener registro anterior para comparar
    const registroAnterior = await RegistroDiario.findOne({
      where: {
        galpon_id,
        fecha: { [Op.lt]: registroActual.fecha }
      },
      order: [['fecha', 'DESC']],
      attributes: ['peso_promedio', 'edad_dias']
    });

    if (!registroAnterior || !registroAnterior.peso_promedio) {
      return null; // No hay datos para comparar
    }

    const variacionPorcentaje = ((registroActual.peso_promedio - registroAnterior.peso_promedio) / registroAnterior.peso_promedio) * 100;

    // Verificar alerta existente
    const alertaExistente = await Alerta.findOne({
      where: {
        galpon_id,
        tipo: 'peso_anormal',
        atendida: false
      }
    });

    // Pérdida de peso (negativo)
    if (variacionPorcentaje < -5 && !alertaExistente) {
      return await Alerta.create({
        galpon_id,
        tipo: 'peso_anormal',
        severidad: 'alta',
        mensaje: `Pérdida de peso detectada: ${Math.abs(variacionPorcentaje).toFixed(1)}% de reducción en día ${registroActual.edad_dias}. Peso actual: ${registroActual.peso_promedio}g. Verificar alimentación y salud.`,
        atendida: false
      });
    }

    // Ganancia muy baja o estancamiento
    if (variacionPorcentaje >= -5 && variacionPorcentaje < 2 && registroActual.edad_dias > 7 && !alertaExistente) {
      return await Alerta.create({
        galpon_id,
        tipo: 'peso_anormal',
        severidad: 'media',
        mensaje: `Crecimiento lento detectado: solo ${variacionPorcentaje.toFixed(1)}% de ganancia en día ${registroActual.edad_dias}. Peso: ${registroActual.peso_promedio}g. Revisar nutrición.`,
        atendida: false
      });
    }

    return null;
  } catch (error) {
    console.error('Error al detectar peso anormal:', error);
    return null;
  }
};

/**
 * Detectar consumo anormal de alimento
 * @param {number} galpon_id - ID del galpón
 * @param {Object} registroActual - Registro diario actual
 */
const detectarConsumoAnormal = async (galpon_id, registroActual) => {
  try {
    if (!registroActual.consumo_kg || registroActual.consumo_kg === 0) {
      return null;
    }

    // Obtener promedio de consumo de los últimos 5 días
    const registrosRecientes = await RegistroDiario.findAll({
      where: {
        galpon_id,
        fecha: { [Op.lt]: registroActual.fecha }
      },
      order: [['fecha', 'DESC']],
      limit: 5,
      attributes: ['consumo_kg']
    });

    if (registrosRecientes.length < 3) {
      return null; // No hay suficientes datos
    }

    const promedioConsumo = registrosRecientes.reduce((sum, r) => sum + parseFloat(r.consumo_kg), 0) / registrosRecientes.length;
    const variacionPorcentaje = ((registroActual.consumo_kg - promedioConsumo) / promedioConsumo) * 100;

    // Verificar alerta existente
    const alertaExistente = await Alerta.findOne({
      where: {
        galpon_id,
        tipo: 'consumo_anormal',
        atendida: false
      }
    });

    // Consumo excesivamente bajo
    if (variacionPorcentaje < -THRESHOLDS.CONSUMO_ANORMAL_PORCENTAJE && !alertaExistente) {
      return await Alerta.create({
        galpon_id,
        tipo: 'consumo_anormal',
        severidad: 'media',
        mensaje: `Consumo de alimento muy bajo: ${registroActual.consumo_kg.toFixed(2)}kg (${Math.abs(variacionPorcentaje).toFixed(1)}% por debajo del promedio). Día ${registroActual.edad_dias}. Verificar comederos y agua.`,
        atendida: false
      });
    }

    // Consumo excesivamente alto
    if (variacionPorcentaje > THRESHOLDS.CONSUMO_ANORMAL_PORCENTAJE && !alertaExistente) {
      return await Alerta.create({
        galpon_id,
        tipo: 'consumo_anormal',
        severidad: 'baja',
        mensaje: `Consumo de alimento elevado: ${registroActual.consumo_kg.toFixed(2)}kg (${variacionPorcentaje.toFixed(1)}% por encima del promedio). Día ${registroActual.edad_dias}. Verificar desperdicio.`,
        atendida: false
      });
    }

    return null;
  } catch (error) {
    console.error('Error al detectar consumo anormal:', error);
    return null;
  }
};

/**
 * Ejecutar todas las detecciones de alertas para un registro
 * @param {number} galpon_id - ID del galpón
 * @param {Object} registro - Registro diario
 */
const ejecutarDetecciones = async (galpon_id, registro) => {
  const alertasCreadas = [];

  try {
    // Ejecutar todas las detecciones en paralelo
    const [alertaMortalidad, alertaPeso, alertaConsumo] = await Promise.all([
      detectarMortalidadAlta(galpon_id, registro),
      detectarPesoAnormal(galpon_id, registro),
      detectarConsumoAnormal(galpon_id, registro)
    ]);

    if (alertaMortalidad) alertasCreadas.push(alertaMortalidad);
    if (alertaPeso) alertasCreadas.push(alertaPeso);
    if (alertaConsumo) alertasCreadas.push(alertaConsumo);

    return alertasCreadas;
  } catch (error) {
    console.error('Error al ejecutar detecciones:', error);
    return alertasCreadas;
  }
};

module.exports = {
  detectarMortalidadAlta,
  detectarStockBajo,
  detectarPesoAnormal,
  detectarConsumoAnormal,
  ejecutarDetecciones,
  THRESHOLDS
};
