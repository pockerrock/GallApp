const ExcelJS = require('exceljs');
const { Galpon, RegistroDiario, LoteAlimento, InventarioAlimento } = require('../models');
const { Op } = require('sequelize');

/**
 * Genera un archivo Excel con registros diarios
 */
const generarRegistrosExcel = async (filtros = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GallinaApp';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Registros Diarios');

  // Obtener registros con filtros
  const where = {};
  if (filtros.galpon_id) where.galpon_id = filtros.galpon_id;
  if (filtros.fecha_inicio || filtros.fecha_fin) {
    where.fecha = {};
    if (filtros.fecha_inicio) where.fecha[Op.gte] = filtros.fecha_inicio;
    if (filtros.fecha_fin) where.fecha[Op.lte] = filtros.fecha_fin;
  }

  const registros = await RegistroDiario.findAll({
    where,
    include: [{
      model: Galpon,
      as: 'galpon',
      attributes: ['numero', 'nombre', 'lote']
    }],
    order: [['fecha', 'DESC'], ['creado_en', 'DESC']],
    limit: parseInt(filtros.limit) || 1000
  });

  // Configurar columnas
  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Galpón', key: 'galpon', width: 12 },
    { header: 'Lote', key: 'lote', width: 15 },
    { header: 'Edad (días)', key: 'edad_dias', width: 12 },
    { header: 'Saldo Aves', key: 'saldo_aves', width: 15 },
    { header: 'Mortalidad', key: 'mortalidad', width: 12 },
    { header: 'Consumo (kg)', key: 'consumo_kg', width: 15 },
    { header: 'Peso Promedio (g)', key: 'peso_promedio', width: 18 },
    { header: 'Observaciones', key: 'observaciones', width: 40 }
  ];

  // Estilo del encabezado
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF15803d' }
  };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Agregar datos
  registros.forEach((registro) => {
    sheet.addRow({
      id: registro.id,
      fecha: new Date(registro.fecha).toLocaleDateString('es-ES'),
      galpon: registro.galpon.numero,
      lote: registro.galpon.lote || 'N/A',
      edad_dias: registro.edad_dias,
      saldo_aves: registro.saldo_aves,
      mortalidad: registro.mortalidad || 0,
      consumo_kg: parseFloat(registro.consumo_kg || 0),
      peso_promedio: registro.peso_promedio || '',
      observaciones: registro.observaciones || ''
    });
  });

  // Agregar filtros
  sheet.autoFilter = {
    from: 'A1',
    to: 'J1'
  };

  // Agregar totales al final
  if (registros.length > 0) {
    const totalMortalidad = registros.reduce((sum, r) => sum + (r.mortalidad || 0), 0);
    const totalConsumo = registros.reduce((sum, r) => sum + parseFloat(r.consumo_kg || 0), 0);

    const rowTotal = sheet.addRow({
      id: '',
      fecha: '',
      galpon: '',
      lote: '',
      edad_dias: 'TOTALES:',
      saldo_aves: '',
      mortalidad: totalMortalidad,
      consumo_kg: totalConsumo.toFixed(2),
      peso_promedio: '',
      observaciones: ''
    });

    rowTotal.font = { bold: true };
    rowTotal.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };
  }

  return workbook;
};

/**
 * Genera un archivo Excel con el inventario de alimento
 */
const generarInventarioExcel = async (filtros = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GallinaApp';
  workbook.created = new Date();

  // Hoja 1: Resumen de Inventario por Tipo
  const sheetResumen = workbook.addWorksheet('Resumen por Tipo');

  const where = {};
  if (filtros.tipo) where.tipo = filtros.tipo;

  const lotes = await LoteAlimento.findAll({
    where,
    order: [['tipo', 'ASC'], ['fecha_ingreso', 'DESC']]
  });

  // Agrupar por tipo
  const inventarioPorTipo = lotes.reduce((acc, lote) => {
    if (!acc[lote.tipo]) {
      acc[lote.tipo] = {
        tipo: lote.tipo,
        cantidad_total: 0,
        num_lotes: 0
      };
    }
    acc[lote.tipo].cantidad_total += parseFloat(lote.cantidad_actual);
    acc[lote.tipo].num_lotes += 1;
    return acc;
  }, {});

  const inventario = Object.values(inventarioPorTipo);

  // Configurar columnas - Resumen
  sheetResumen.columns = [
    { header: 'Tipo de Alimento', key: 'tipo', width: 25 },
    { header: 'Cantidad Total (kg)', key: 'cantidad_total', width: 20 },
    { header: 'Número de Lotes', key: 'num_lotes', width: 18 }
  ];

  // Estilo del encabezado
  sheetResumen.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheetResumen.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF15803d' }
  };
  sheetResumen.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Agregar datos
  inventario.forEach((item) => {
    sheetResumen.addRow({
      tipo: item.tipo,
      cantidad_total: item.cantidad_total.toFixed(2),
      num_lotes: item.num_lotes
    });
  });

  // Hoja 2: Detalle de Lotes
  const sheetLotes = workbook.addWorksheet('Detalle de Lotes');

  sheetLotes.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Código Lote', key: 'codigo_lote', width: 20 },
    { header: 'Tipo', key: 'tipo', width: 25 },
    { header: 'Cantidad Inicial (kg)', key: 'cantidad_inicial', width: 22 },
    { header: 'Cantidad Actual (kg)', key: 'cantidad_actual', width: 22 },
    { header: '% Disponible', key: 'porcentaje', width: 15 },
    { header: 'Fecha Ingreso', key: 'fecha_ingreso', width: 15 },
    { header: 'Proveedor', key: 'proveedor', width: 25 }
  ];

  // Estilo del encabezado
  sheetLotes.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheetLotes.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF15803d' }
  };
  sheetLotes.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Agregar datos de lotes
  lotes.forEach((lote) => {
    const porcentaje = ((parseFloat(lote.cantidad_actual) / parseFloat(lote.cantidad_inicial)) * 100).toFixed(2);

    const row = sheetLotes.addRow({
      id: lote.id,
      codigo_lote: lote.codigo_lote,
      tipo: lote.tipo,
      cantidad_inicial: parseFloat(lote.cantidad_inicial),
      cantidad_actual: parseFloat(lote.cantidad_actual),
      porcentaje: porcentaje + '%',
      fecha_ingreso: new Date(lote.fecha_ingreso).toLocaleDateString('es-ES'),
      proveedor: lote.proveedor || 'N/A'
    });

    // Colorear según nivel de stock
    if (parseFloat(porcentaje) < 10) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFECACA' } // rojo claro
      };
    } else if (parseFloat(porcentaje) < 20) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' } // amarillo claro
      };
    }
  });

  // Hoja 3: Movimientos
  const sheetMovimientos = workbook.addWorksheet('Movimientos');

  const whereMovimientos = {};
  if (filtros.lote_id) whereMovimientos.lote_id = filtros.lote_id;
  if (filtros.fecha_inicio || filtros.fecha_fin) {
    whereMovimientos.fecha = {};
    if (filtros.fecha_inicio) whereMovimientos.fecha[Op.gte] = filtros.fecha_inicio;
    if (filtros.fecha_fin) whereMovimientos.fecha[Op.lte] = filtros.fecha_fin;
  }

  const movimientos = await InventarioAlimento.findAll({
    where: whereMovimientos,
    include: [
      { model: LoteAlimento, as: 'lote', attributes: ['codigo_lote', 'tipo'] },
      { model: Galpon, as: 'galpon', attributes: ['numero', 'nombre'] }
    ],
    order: [['fecha', 'DESC']],
    limit: 1000
  });

  sheetMovimientos.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Lote', key: 'lote', width: 20 },
    { header: 'Tipo Alimento', key: 'tipo', width: 25 },
    { header: 'Tipo Movimiento', key: 'tipo_movimiento', width: 18 },
    { header: 'Cantidad (kg)', key: 'cantidad', width: 15 },
    { header: 'Galpón', key: 'galpon', width: 15 },
    { header: 'Observaciones', key: 'observaciones', width: 40 }
  ];

  // Estilo del encabezado
  sheetMovimientos.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheetMovimientos.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF15803d' }
  };
  sheetMovimientos.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Agregar movimientos
  movimientos.forEach((mov) => {
    const row = sheetMovimientos.addRow({
      id: mov.id,
      fecha: new Date(mov.fecha).toLocaleDateString('es-ES'),
      lote: mov.lote.codigo_lote,
      tipo: mov.lote.tipo,
      tipo_movimiento: mov.tipo_movimiento.toUpperCase(),
      cantidad: parseFloat(mov.cantidad),
      galpon: mov.galpon ? `${mov.galpon.numero}` : 'N/A',
      observaciones: mov.observaciones || ''
    });

    // Colorear según tipo de movimiento
    if (mov.tipo_movimiento === 'entrada') {
      row.getCell('tipo_movimiento').font = { color: { argb: 'FF16a34a' }, bold: true };
    } else {
      row.getCell('tipo_movimiento').font = { color: { argb: 'FFdc2626' }, bold: true };
    }
  });

  return workbook;
};

/**
 * Genera un archivo Excel con KPIs mensuales
 */
const generarKPIsExcel = async (mes, anio, galpon_id = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GallinaApp';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`KPIs ${mes}-${anio}`);

  // Calcular rango de fechas
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0);

  const where = {
    fecha: {
      [Op.gte]: fechaInicio,
      [Op.lte]: fechaFin
    }
  };

  if (galpon_id) where.galpon_id = galpon_id;

  // Obtener datos
  const registros = await RegistroDiario.findAll({
    where,
    include: [{
      model: Galpon,
      as: 'galpon',
      attributes: ['id', 'numero', 'nombre', 'lote', 'capacidad_maxima']
    }],
    order: [['fecha', 'ASC']]
  });

  // Agrupar por galpón
  const galponesData = {};
  registros.forEach(reg => {
    const gid = reg.galpon.id;
    if (!galponesData[gid]) {
      galponesData[gid] = {
        galpon: reg.galpon,
        registros: []
      };
    }
    galponesData[gid].registros.push(reg);
  });

  // Configurar columnas
  sheet.columns = [
    { header: 'Galpón', key: 'galpon', width: 12 },
    { header: 'Lote', key: 'lote', width: 15 },
    { header: 'Capacidad', key: 'capacidad', width: 12 },
    { header: 'Edad Prom (días)', key: 'edad', width: 18 },
    { header: 'Pobl. Inicial', key: 'poblacion_inicial', width: 15 },
    { header: 'Saldo Actual', key: 'saldo_actual', width: 15 },
    { header: 'Total Muertes', key: 'total_muertes', width: 15 },
    { header: 'Mortalidad %', key: 'mortalidad', width: 15 },
    { header: 'Supervivencia %', key: 'supervivencia', width: 18 },
    { header: 'Consumo Total (kg)', key: 'consumo_total', width: 18 },
    { header: 'Consumo/Ave (kg)', key: 'consumo_ave', width: 18 },
    { header: 'Peso Prom (g)', key: 'peso', width: 15 },
    { header: 'Conversion', key: 'conversion', width: 10 },
    { header: 'Eficiencia', key: 'eficiencia', width: 15 }
  ];

  // Estilo del encabezado
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF15803d' }
  };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Agregar datos
  for (const [gid, data] of Object.entries(galponesData)) {
    const { galpon, registros: regs } = data;

    const primerRegistro = regs[0];
    const ultimoRegistro = regs[regs.length - 1];

    const saldoInicial = primerRegistro.saldo_aves + (primerRegistro.mortalidad || 0);
    const saldoActual = ultimoRegistro.saldo_aves;
    const totalMuertes = regs.reduce((sum, r) => sum + (r.mortalidad || 0), 0);
    const porcentajeMortalidad = ((totalMuertes / saldoInicial) * 100).toFixed(2);
    const tasaSupervivencia = (100 - parseFloat(porcentajeMortalidad)).toFixed(2);

    const totalAlimento = regs.reduce((sum, r) => sum + parseFloat(r.consumo_kg || 0), 0);
    const consumoPorAve = (totalAlimento / saldoActual).toFixed(2);

    const registrosConPeso = regs.filter(r => r.peso_promedio && r.peso_promedio > 0);
    let pesoPromedio = 0;
    if (registrosConPeso.length > 0) {
      pesoPromedio = (registrosConPeso.reduce((sum, r) => sum + parseFloat(r.peso_promedio), 0) / registrosConPeso.length).toFixed(0);
    }

    let conversion = 0;
    if (pesoPromedio > 0 && saldoActual > 0) {
      const pesoTotalKg = (pesoPromedio * saldoActual) / 1000;
      conversion = (totalAlimento / pesoTotalKg).toFixed(2);
    }

    const edadPromedio = (regs.reduce((sum, r) => sum + r.edad_dias, 0) / regs.length).toFixed(0);

    let eficiencia = 'Baja';
    if (conversion > 0 && conversion <= 2.5 && parseFloat(porcentajeMortalidad) < 5) {
      eficiencia = 'Excelente';
    } else if (conversion > 0 && conversion <= 3.0 && parseFloat(porcentajeMortalidad) < 8) {
      eficiencia = 'Buena';
    } else if (conversion > 0 && conversion <= 3.5 && parseFloat(porcentajeMortalidad) < 12) {
      eficiencia = 'Regular';
    }

    const row = sheet.addRow({
      galpon: galpon.numero,
      lote: galpon.lote || 'N/A',
      capacidad: galpon.capacidad_maxima,
      edad: edadPromedio,
      poblacion_inicial: saldoInicial,
      saldo_actual: saldoActual,
      total_muertes: totalMuertes,
      mortalidad: porcentajeMortalidad + '%',
      supervivencia: tasaSupervivencia + '%',
      consumo_total: totalAlimento.toFixed(2),
      consumo_ave: consumoPorAve,
      peso: pesoPromedio > 0 ? pesoPromedio : 'N/A',
      conversion: conversion > 0 ? conversion : 'N/A',
      eficiencia: eficiencia
    });

    // Colorear según eficiencia
    if (eficiencia === 'Excelente') {
      row.getCell('eficiencia').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }
      };
      row.getCell('eficiencia').font = { color: { argb: 'FF15803d' }, bold: true };
    } else if (eficiencia === 'Buena') {
      row.getCell('eficiencia').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDBEAFE' }
      };
      row.getCell('eficiencia').font = { color: { argb: 'FF3b82f6' }, bold: true };
    } else if (eficiencia === 'Regular') {
      row.getCell('eficiencia').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }
      };
      row.getCell('eficiencia').font = { color: { argb: 'FFf59e0b' }, bold: true };
    } else {
      row.getCell('eficiencia').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFECACA' }
      };
      row.getCell('eficiencia').font = { color: { argb: 'FFdc2626' }, bold: true };
    }
  }

  return workbook;
};

module.exports = {
  generarRegistrosExcel,
  generarInventarioExcel,
  generarKPIsExcel
};
