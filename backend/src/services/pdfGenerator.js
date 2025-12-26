const PDFDocument = require('pdfkit');
const { Galpon, RegistroDiario, LoteAlimento, InventarioAlimento, Alerta } = require('../models');
const { Op } = require('sequelize');

/**
 * Genera un PDF de registros diarios filtrados
 */
const generarRegistrosPDF = async (filtros = {}) => {
  const doc = new PDFDocument({ margin: 50 });

  // Configurar metadata
  doc.info['Title'] = 'Reporte de Registros Diarios';
  doc.info['Author'] = 'GallinaApp';

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
    limit: parseInt(filtros.limit) || 100
  });

  // Encabezado
  doc.fontSize(20).font('Helvetica-Bold').text('🐔 GallinaApp', { align: 'center' });
  doc.fontSize(16).text('Reporte de Registros Diarios', { align: 'center' });
  doc.moveDown();

  // Información del reporte
  doc.fontSize(10).font('Helvetica');
  doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, { align: 'right' });
  doc.text(`Total de registros: ${registros.length}`, { align: 'right' });
  doc.moveDown();

  if (filtros.galpon_id) {
    const galpon = registros.length > 0 ? registros[0].galpon : null;
    if (galpon) {
      doc.text(`Galpón: ${galpon.numero} - ${galpon.nombre || 'Sin nombre'}`, { align: 'right' });
      doc.text(`Lote: ${galpon.lote || 'N/A'}`, { align: 'right' });
    }
  }

  if (filtros.fecha_inicio || filtros.fecha_fin) {
    let rango = 'Rango de fechas: ';
    if (filtros.fecha_inicio) rango += `${filtros.fecha_inicio}`;
    if (filtros.fecha_fin) rango += ` hasta ${filtros.fecha_fin}`;
    doc.text(rango, { align: 'right' });
  }

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  // Tabla de registros
  if (registros.length === 0) {
    doc.fontSize(12).text('No se encontraron registros con los filtros especificados.', { align: 'center' });
  } else {
    registros.forEach((registro, index) => {
      // Verificar si necesitamos nueva página
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(`Registro #${index + 1} - Galpón ${registro.galpon.numero}`, { continued: true });
      doc.font('Helvetica').text(` | Lote: ${registro.galpon.lote || 'N/A'}`, { align: 'left' });

      doc.fontSize(9).font('Helvetica');
      doc.text(`Fecha: ${new Date(registro.fecha).toLocaleDateString('es-ES')} | Edad: ${registro.edad_dias} días`, { align: 'left' });
      doc.moveDown(0.3);

      // Columna 1: Población
      doc.font('Helvetica-Bold').text('Población:', { continued: true });
      doc.font('Helvetica').text(` Saldo: ${registro.saldo_aves} aves | Mortalidad: ${registro.mortalidad || 0}`);

      // Columna 2: Alimento
      doc.font('Helvetica-Bold').text('Alimento:', { continued: true });
      doc.font('Helvetica').text(` ${registro.consumo_kg || 0} kg`);

      // Columna 3: Peso
      if (registro.peso_promedio) {
        doc.font('Helvetica-Bold').text('Peso Promedio:', { continued: true });
        doc.font('Helvetica').text(` ${registro.peso_promedio} g`);
      }

      // Observaciones
      if (registro.observaciones) {
        doc.font('Helvetica-Bold').text('Observaciones:', { continued: true });
        doc.font('Helvetica').text(` ${registro.observaciones}`);
      }

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ddd');
      doc.moveDown(0.5);
    });
  }

  // Pie de página
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).text(
      `Página ${i + 1} de ${pages.count}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Genera un PDF de reporte mensual de KPIs
 */
const generarKPIsMensualPDF = async (mes, anio, galpon_id = null) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.info['Title'] = `Reporte Mensual de KPIs - ${mes}/${anio}`;
  doc.info['Author'] = 'GallinaApp';

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

  // Encabezado
  doc.fontSize(20).font('Helvetica-Bold').text('🐔 GallinaApp', { align: 'center' });
  doc.fontSize(16).text(`Reporte Mensual de KPIs`, { align: 'center' });
  doc.fontSize(12).font('Helvetica').text(`${mes}/${anio}`, { align: 'center' });
  doc.moveDown();

  doc.fontSize(10);
  doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, { align: 'right' });
  doc.text(`Período: ${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`, { align: 'right' });
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  if (Object.keys(galponesData).length === 0) {
    doc.fontSize(12).text('No se encontraron registros para el período especificado.', { align: 'center' });
  } else {
    for (const [gid, data] of Object.entries(galponesData)) {
      const { galpon, registros: regs } = data;

      // Verificar si necesitamos nueva página
      if (doc.y > 650) {
        doc.addPage();
      }

      // Título del galpón
      doc.fontSize(14).font('Helvetica-Bold');
      doc.fillColor('#15803d').text(`Galpón ${galpon.numero} - ${galpon.nombre || 'Sin nombre'}`, { underline: true });
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica').text(`Lote: ${galpon.lote || 'N/A'} | Capacidad: ${galpon.capacidad_maxima}`);
      doc.moveDown(0.5);

      // Calcular KPIs
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

      const diasMonitoreados = regs.length;
      const edadPromedio = (regs.reduce((sum, r) => sum + r.edad_dias, 0) / diasMonitoreados).toFixed(0);

      // Mostrar KPIs
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('📊 Indicadores Clave de Rendimiento (KPIs)', { underline: true });
      doc.moveDown(0.3);

      doc.font('Helvetica');
      doc.text(`• Población Inicial: ${saldoInicial.toLocaleString('es-ES')} aves`);
      doc.text(`• Saldo Actual: ${saldoActual.toLocaleString('es-ES')} aves`);
      doc.text(`• Total de Muertes: ${totalMuertes.toLocaleString('es-ES')} aves`);
      doc.text(`• Porcentaje de Mortalidad: ${porcentajeMortalidad}%`);
      doc.text(`• Tasa de Supervivencia: ${tasaSupervivencia}%`);
      doc.text(`• Consumo Total de Alimento: ${totalAlimento.toFixed(2)} kg`);
      doc.text(`• Consumo por Ave: ${consumoPorAve} kg`);
      if (pesoPromedio > 0) {
        doc.text(`• Peso Promedio: ${pesoPromedio} g`);
      }
      if (conversion > 0) {
        doc.text(`• Conversion (Conversión Alimenticia): ${conversion}`);
      }
      doc.text(`• Días Monitoreados: ${diasMonitoreados} días`);
      doc.text(`• Edad Promedio: ${edadPromedio} días`);

      doc.moveDown(0.5);

      // Evaluación
      doc.font('Helvetica-Bold').text('🏆 Evaluación de Eficiencia:', { underline: true });
      doc.moveDown(0.3);
      doc.font('Helvetica');

      let eficiencia = 'Baja';
      if (conversion > 0 && conversion <= 2.5 && parseFloat(porcentajeMortalidad) < 5) {
        eficiencia = 'Excelente';
      } else if (conversion > 0 && conversion <= 3.0 && parseFloat(porcentajeMortalidad) < 8) {
        eficiencia = 'Buena';
      } else if (conversion > 0 && conversion <= 3.5 && parseFloat(porcentajeMortalidad) < 12) {
        eficiencia = 'Regular';
      }

      doc.text(`• Clasificación General: ${eficiencia}`);

      if (parseFloat(porcentajeMortalidad) < 3) {
        doc.text(`• Mortalidad: Excelente (< 3%)`);
      } else if (parseFloat(porcentajeMortalidad) < 5) {
        doc.text(`• Mortalidad: Buena (< 5%)`);
      } else if (parseFloat(porcentajeMortalidad) < 10) {
        doc.text(`• Mortalidad: Regular (< 10%)`);
      } else {
        doc.text(`• Mortalidad: Alta (≥ 10%)`);
      }

      if (conversion > 0) {
        if (conversion <= 2.5) {
          doc.text(`• Conversion: Excelente (≤ 2.5)`);
        } else if (conversion <= 3.0) {
          doc.text(`• Conversion: Bueno (≤ 3.0)`);
        } else if (conversion <= 3.5) {
          doc.text(`• Conversion: Regular (≤ 3.5)`);
        } else {
          doc.text(`• Conversion: Bajo (> 3.5)`);
        }
      }

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
    }
  }

  // Pie de página
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).text(
      `Página ${i + 1} de ${pages.count}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Genera un PDF de reporte de comparación entre galpones
 */
const generarComparacionPDF = async () => {
  const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

  doc.info['Title'] = 'Reporte de Comparación de Galpones';
  doc.info['Author'] = 'GallinaApp';

  // Obtener galpones activos
  const galpones = await Galpon.findAll({
    where: { activo: true },
    order: [['numero', 'ASC']]
  });

  const comparacion = await Promise.all(
    galpones.map(async (galpon) => {
      const registros = await RegistroDiario.findAll({
        where: { galpon_id: galpon.id },
        order: [['fecha', 'ASC']]
      });

      if (registros.length === 0) {
        return {
          galpon,
          metricas: null
        };
      }

      const primerRegistro = registros[0];
      const ultimoRegistro = registros[registros.length - 1];

      const saldoInicial = primerRegistro.saldo_aves + (primerRegistro.mortalidad || 0);
      const saldoActual = ultimoRegistro.saldo_aves;
      const totalMuertes = registros.reduce((sum, r) => sum + (r.mortalidad || 0), 0);
      const porcentajeMortalidad = ((totalMuertes / saldoInicial) * 100).toFixed(2);
      const tasaSupervivencia = (100 - parseFloat(porcentajeMortalidad)).toFixed(2);

      const totalAlimento = registros.reduce((sum, r) => sum + parseFloat(r.consumo_kg || 0), 0);

      const registrosConPeso = registros.filter(r => r.peso_promedio && r.peso_promedio > 0);
      let pesoPromedio = 0;
      if (registrosConPeso.length > 0) {
        pesoPromedio = (registrosConPeso.reduce((sum, r) => sum + parseFloat(r.peso_promedio), 0) / registrosConPeso.length).toFixed(0);
      }

      let conversion = 0;
      if (pesoPromedio > 0 && saldoActual > 0) {
        const pesoTotalKg = (pesoPromedio * saldoActual) / 1000;
        conversion = (totalAlimento / pesoTotalKg).toFixed(2);
      }

      return {
        galpon,
        metricas: {
          edad_actual_dias: ultimoRegistro.edad_dias,
          saldo_actual: saldoActual,
          mortalidad_total: totalMuertes,
          porcentaje_mortalidad: parseFloat(porcentajeMortalidad),
          tasa_supervivencia: parseFloat(tasaSupervivencia),
          consumo_total_kg: totalAlimento.toFixed(2),
          peso_promedio_g: pesoPromedio,
          conversion: parseFloat(conversion)
        }
      };
    })
  );

  const comparacionConMetricas = comparacion.filter(c => c.metricas !== null);

  // Encabezado
  doc.fontSize(20).font('Helvetica-Bold').text('🐔 GallinaApp', { align: 'center' });
  doc.fontSize(16).text('Reporte de Comparación de Galpones', { align: 'center' });
  doc.moveDown();

  doc.fontSize(10).font('Helvetica');
  doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, { align: 'right' });
  doc.text(`Total de galpones activos: ${comparacionConMetricas.length}`, { align: 'right' });
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(790, doc.y).stroke();
  doc.moveDown();

  if (comparacionConMetricas.length === 0) {
    doc.fontSize(12).text('No hay galpones activos con registros para comparar.', { align: 'center' });
  } else {
    // Encontrar mejores galpones
    const mejorConversion = comparacionConMetricas.reduce((mejor, actual) =>
      actual.metricas.conversion > 0 && (mejor === null || actual.metricas.conversion < mejor.metricas.conversion)
        ? actual : mejor
    , null);

    const menorMortalidad = comparacionConMetricas.reduce((mejor, actual) =>
      mejor === null || actual.metricas.porcentaje_mortalidad < mejor.metricas.porcentaje_mortalidad
        ? actual : mejor
    , null);

    const mayorPeso = comparacionConMetricas.reduce((mejor, actual) =>
      mejor === null || parseFloat(actual.metricas.peso_promedio_g) > parseFloat(mejor.metricas.peso_promedio_g)
        ? actual : mejor
    , null);

    // Tarjetas de mejores rendimientos con diseño visual
    doc.fontSize(14).font('Helvetica-Bold').text('🏆 Mejores Rendimientos', { underline: true });
    doc.moveDown(0.8);

    const cardY = doc.y;
    const cardWidth = 240;
    const cardHeight = 70;
    const cardSpacing = 10;

    // Tarjeta 1: Mejor Conversion
    if (mejorConversion && mejorConversion.metricas.conversion > 0) {
      doc.rect(50, cardY, cardWidth, cardHeight).fillAndStroke('#f0fdf4', '#16a34a');
      doc.fillColor('#000');
      doc.fontSize(9).font('Helvetica').text('Mejor Conversion', 60, cardY + 10, { width: cardWidth - 20 });
      doc.fontSize(16).font('Helvetica-Bold').text(`Galpón ${mejorConversion.galpon.numero}`, 60, cardY + 28);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#15803d').text(`Conversion: ${mejorConversion.metricas.conversion}`, 60, cardY + 48);
      doc.fillColor('#000');
    }

    // Tarjeta 2: Menor Mortalidad
    if (menorMortalidad) {
      const card2X = 50 + cardWidth + cardSpacing;
      doc.rect(card2X, cardY, cardWidth, cardHeight).fillAndStroke('#fef3c7', '#f59e0b');
      doc.fillColor('#000');
      doc.fontSize(9).font('Helvetica').text('Menor Mortalidad', card2X + 10, cardY + 10, { width: cardWidth - 20 });
      doc.fontSize(16).font('Helvetica-Bold').text(`Galpón ${menorMortalidad.galpon.numero}`, card2X + 10, cardY + 28);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#d97706').text(`${menorMortalidad.metricas.porcentaje_mortalidad}%`, card2X + 10, cardY + 48);
      doc.fillColor('#000');
    }

    // Tarjeta 3: Mayor Peso (en segunda fila si no cabe)
    if (mayorPeso && mayorPeso.metricas.peso_promedio_g > 0) {
      const card3X = 50 + (cardWidth + cardSpacing) * 2;
      let card3Y = cardY;

      // Si se sale del ancho de página, mover a segunda fila
      if (card3X + cardWidth > 790) {
        card3Y = cardY + cardHeight + cardSpacing;
      }

      doc.rect(card3X > 790 ? 50 : card3X, card3Y, cardWidth, cardHeight).fillAndStroke('#f0fdf4', '#15803d');
      doc.fillColor('#000');
      doc.fontSize(9).font('Helvetica').text('Mayor Peso Promedio', (card3X > 790 ? 50 : card3X) + 10, card3Y + 10, { width: cardWidth - 20 });
      doc.fontSize(16).font('Helvetica-Bold').text(`Galpón ${mayorPeso.galpon.numero}`, (card3X > 790 ? 50 : card3X) + 10, card3Y + 28);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#15803d').text(`${mayorPeso.metricas.peso_promedio_g} g`, (card3X > 790 ? 50 : card3X) + 10, card3Y + 48);
      doc.fillColor('#000');
    }

    doc.y = cardY + cardHeight + 20;
    doc.moveTo(50, doc.y).lineTo(790, doc.y).stroke();
    doc.moveDown();

    // Tabla comparativa
    doc.fontSize(12).font('Helvetica-Bold').text('📊 Tabla Comparativa', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = [60, 60, 60, 70, 80, 80, 80, 70, 80];
    const colX = [50, 110, 170, 230, 300, 380, 460, 540, 610];

    // Encabezados de tabla
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Galpón', colX[0], tableTop, { width: colWidths[0] });
    doc.text('Lote', colX[1], tableTop, { width: colWidths[1] });
    doc.text('Edad (días)', colX[2], tableTop, { width: colWidths[2] });
    doc.text('Aves Actuales', colX[3], tableTop, { width: colWidths[3] });
    doc.text('Mortalidad %', colX[4], tableTop, { width: colWidths[4] });
    doc.text('Supervivencia %', colX[5], tableTop, { width: colWidths[5] });
    doc.text('Peso Prom. (g)', colX[6], tableTop, { width: colWidths[6] });
    doc.text('Conversion', colX[7], tableTop, { width: colWidths[7] });
    doc.text('Consumo (kg)', colX[8], tableTop, { width: colWidths[8] });

    doc.moveDown();
    let yPos = doc.y;
    doc.moveTo(50, yPos).lineTo(790, yPos).stroke();
    yPos += 5;

    // Filas de datos
    doc.font('Helvetica');
    comparacionConMetricas.forEach((item) => {
      const { galpon, metricas } = item;

      if (yPos > 500) {
        doc.addPage();
        yPos = 50;
      }

      doc.text(`${galpon.numero}`, colX[0], yPos, { width: colWidths[0] });
      doc.text(`${galpon.lote || 'N/A'}`, colX[1], yPos, { width: colWidths[1] });
      doc.text(`${metricas.edad_actual_dias}`, colX[2], yPos, { width: colWidths[2] });
      doc.text(`${metricas.saldo_actual.toLocaleString('es-ES')}`, colX[3], yPos, { width: colWidths[3] });
      doc.text(`${metricas.porcentaje_mortalidad}%`, colX[4], yPos, { width: colWidths[4] });
      doc.text(`${metricas.tasa_supervivencia}%`, colX[5], yPos, { width: colWidths[5] });
      doc.text(`${metricas.peso_promedio_g}`, colX[6], yPos, { width: colWidths[6] });
      doc.text(`${metricas.conversion || 'N/A'}`, colX[7], yPos, { width: colWidths[7] });
      doc.text(`${metricas.consumo_total_kg}`, colX[8], yPos, { width: colWidths[8] });

      yPos += 20;
      doc.moveTo(50, yPos).lineTo(790, yPos).stroke('#ddd');
      yPos += 5;
    });

    // Agregar visualizaciones de métricas clave
    doc.addPage();

    // Visualización 1: Conversion por Galpón
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('📊 Conversion por Galpón', 50, 50);
    doc.moveDown(0.5);

    const maxConversion = Math.max(...comparacionConMetricas.map(c => c.metricas.conversion).filter(conversion => conversion > 0));
    const barMaxWidth = 400;

    let barY = doc.y;
    comparacionConMetricas.forEach((item) => {
      if (item.metricas.conversion > 0) {
        const barWidth = (item.metricas.conversion / maxConversion) * barMaxWidth;

        doc.fontSize(9).font('Helvetica').text(`Galpón ${item.galpon.numero}`, 50, barY, { width: 100 });

        // Dibujar barra
        const barColor = item.metricas.conversion <= 2.5 ? '#16a34a' : item.metricas.conversion <= 3.0 ? '#f59e0b' : '#dc2626';
        doc.rect(160, barY - 2, barWidth, 12).fillAndStroke(barColor, barColor);

        // Valor al final de la barra
        doc.fillColor('#000').text(item.metricas.conversion, 160 + barWidth + 5, barY, { width: 50 });

        barY += 20;
      }
    });

    doc.moveDown(1.5);

    // Visualización 2: Mortalidad por Galpón
    doc.fontSize(12).font('Helvetica-Bold').text('📉 Mortalidad por Galpón (%)', 50, doc.y);
    doc.moveDown(0.5);

    const maxMortalidad = Math.max(...comparacionConMetricas.map(c => c.metricas.porcentaje_mortalidad));

    barY = doc.y;
    comparacionConMetricas.forEach((item) => {
      const barWidth = (item.metricas.porcentaje_mortalidad / Math.max(maxMortalidad, 10)) * barMaxWidth;

      doc.fontSize(9).font('Helvetica').fillColor('#000').text(`Galpón ${item.galpon.numero}`, 50, barY, { width: 100 });

      // Dibujar barra
      const barColor = item.metricas.porcentaje_mortalidad < 3 ? '#16a34a' : item.metricas.porcentaje_mortalidad < 5 ? '#f59e0b' : '#dc2626';
      doc.rect(160, barY - 2, barWidth, 12).fillAndStroke(barColor, barColor);

      // Valor al final de la barra
      doc.fillColor('#000').text(`${item.metricas.porcentaje_mortalidad}%`, 160 + barWidth + 5, barY, { width: 50 });

      barY += 20;
    });

    doc.moveDown(1.5);

    // Visualización 3: Consumo Total por Galpón
    doc.fontSize(12).font('Helvetica-Bold').text('🌾 Consumo Total de Alimento por Galpón (kg)', 50, doc.y);
    doc.moveDown(0.5);

    const maxConsumo = Math.max(...comparacionConMetricas.map(c => parseFloat(c.metricas.consumo_total_kg)));

    barY = doc.y;
    comparacionConMetricas.forEach((item) => {
      const barWidth = (parseFloat(item.metricas.consumo_total_kg) / maxConsumo) * barMaxWidth;

      doc.fontSize(9).font('Helvetica').fillColor('#000').text(`Galpón ${item.galpon.numero}`, 50, barY, { width: 100 });

      // Dibujar barra
      doc.rect(160, barY - 2, barWidth, 12).fillAndStroke('#f59e0b', '#f59e0b');

      // Valor al final de la barra
      doc.fillColor('#000').text(`${item.metricas.consumo_total_kg} kg`, 160 + barWidth + 5, barY, { width: 80 });

      barY += 20;
    });

    doc.moveDown(1.5);

    // Visualización 4: Peso Promedio por Galpón
    doc.fontSize(12).font('Helvetica-Bold').text('⚖️ Peso Promedio por Galpón (g)', 50, doc.y);
    doc.moveDown(0.5);

    const maxPeso = Math.max(...comparacionConMetricas.map(c => parseFloat(c.metricas.peso_promedio_g)));

    barY = doc.y;
    comparacionConMetricas.forEach((item) => {
      if (item.metricas.peso_promedio_g > 0) {
        const barWidth = (parseFloat(item.metricas.peso_promedio_g) / maxPeso) * barMaxWidth;

        doc.fontSize(9).font('Helvetica').fillColor('#000').text(`Galpón ${item.galpon.numero}`, 50, barY, { width: 100 });

        // Dibujar barra
        doc.rect(160, barY - 2, barWidth, 12).fillAndStroke('#15803d', '#15803d');

        // Valor al final de la barra
        doc.fillColor('#000').text(`${item.metricas.peso_promedio_g} g`, 160 + barWidth + 5, barY, { width: 80 });

        barY += 20;
      }
    });
  }

  // Pie de página
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).text(
      `Página ${i + 1} de ${pages.count}`,
      50,
      doc.page.height - 30,
      { align: 'center', width: doc.page.width - 100 }
    );
  }

  return doc;
};

module.exports = {
  generarRegistrosPDF,
  generarKPIsMensualPDF,
  generarComparacionPDF
};
