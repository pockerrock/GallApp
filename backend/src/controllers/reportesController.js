const { generarRegistrosPDF, generarKPIsMensualPDF, generarComparacionPDF } = require('../services/pdfGenerator');
const { generarRegistrosExcel, generarInventarioExcel, generarKPIsExcel } = require('../services/excelGenerator');

/**
 * GET /api/reportes/registros-pdf
 * Genera un reporte PDF de registros diarios
 */
const descargarRegistrosPDF = async (req, res, next) => {
  try {
    const filtros = {
      galpon_id: req.query.galpon_id,
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin,
      limit: req.query.limit
    };

    const doc = await generarRegistrosPDF(filtros);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="registros-diarios.pdf"');

    // Pipe del PDF a la respuesta
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reportes/registros-excel
 * Genera un reporte Excel de registros diarios
 */
const descargarRegistrosExcel = async (req, res, next) => {
  try {
    const filtros = {
      galpon_id: req.query.galpon_id,
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin,
      limit: req.query.limit
    };

    const workbook = await generarRegistrosExcel(filtros);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="registros-diarios.xlsx"');

    // Escribir el workbook a la respuesta
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reportes/inventario-pdf
 * Genera un reporte PDF del inventario (redirige a Excel, ya que no implementamos PDF de inventario)
 */
const descargarInventarioPDF = async (req, res, next) => {
  try {
    // Por simplicidad, redirigimos al Excel ya que el inventario tiene mejor formato en tablas
    return res.status(400).json({
      error: 'Para inventario, use el endpoint /api/reportes/inventario-excel'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reportes/inventario-excel
 * Genera un reporte Excel del inventario de alimento
 */
const descargarInventarioExcel = async (req, res, next) => {
  try {
    const filtros = {
      tipo: req.query.tipo,
      lote_id: req.query.lote_id,
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin
    };

    const workbook = await generarInventarioExcel(filtros);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inventario-alimento.xlsx"');

    // Escribir el workbook a la respuesta
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reportes/kpis-mensual-pdf
 * Genera un reporte PDF mensual de KPIs
 */
const descargarKPIsMensualPDF = async (req, res, next) => {
  try {
    const { mes, anio, galpon_id } = req.query;

    // Validar parámetros requeridos
    if (!mes || !anio) {
      return res.status(400).json({
        error: 'Los parámetros mes y anio son requeridos'
      });
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        error: 'El mes debe estar entre 1 y 12'
      });
    }

    if (anioNum < 2000 || anioNum > 2100) {
      return res.status(400).json({
        error: 'El año debe estar entre 2000 y 2100'
      });
    }

    const doc = await generarKPIsMensualPDF(mesNum, anioNum, galpon_id);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="kpis-mensual-${mes}-${anio}.pdf"`);

    // Pipe del PDF a la respuesta
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reportes/kpis-mensual-excel
 * Genera un reporte Excel mensual de KPIs
 */
const descargarKPIsMensualExcel = async (req, res, next) => {
  try {
    const { mes, anio, galpon_id } = req.query;

    // Validar parámetros requeridos
    if (!mes || !anio) {
      return res.status(400).json({
        error: 'Los parámetros mes y anio son requeridos'
      });
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        error: 'El mes debe estar entre 1 y 12'
      });
    }

    if (anioNum < 2000 || anioNum > 2100) {
      return res.status(400).json({
        error: 'El año debe estar entre 2000 y 2100'
      });
    }

    const workbook = await generarKPIsExcel(mesNum, anioNum, galpon_id);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="kpis-mensual-${mes}-${anio}.xlsx"`);

    // Escribir el workbook a la respuesta
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reportes/comparacion-pdf
 * Genera un reporte PDF de comparación entre galpones
 */
const descargarComparacionPDF = async (req, res, next) => {
  try {
    const doc = await generarComparacionPDF();

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="comparacion-galpones.pdf"');

    // Pipe del PDF a la respuesta
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  descargarRegistrosPDF,
  descargarRegistrosExcel,
  descargarInventarioPDF,
  descargarInventarioExcel,
  descargarKPIsMensualPDF,
  descargarKPIsMensualExcel,
  descargarComparacionPDF
};
