const { ActividadProgramada, Galpon } = require('../models');
const { Op } = require('sequelize');

// GET /api/actividades - Listar actividades programadas
const listarActividades = async (req, res, next) => {
  try {
    const {
      galpon_id,
      tipo,
      completada,
      fecha_inicio,
      fecha_fin,
      prioridad
    } = req.query;

    const where = {};

    if (galpon_id) where.galpon_id = galpon_id;
    if (tipo) where.tipo = tipo;
    if (completada !== undefined) where.completada = completada === 'true';
    if (prioridad) where.prioridad = prioridad;

    // Filtrar por rango de fechas
    if (fecha_inicio || fecha_fin) {
      where.fecha_inicio = {};
      if (fecha_inicio) where.fecha_inicio[Op.gte] = fecha_inicio;
      if (fecha_fin) where.fecha_inicio[Op.lte] = fecha_fin;
    }

    const actividades = await ActividadProgramada.findAll({
      where,
      include: [{
        model: Galpon,
        as: 'galpon',
        attributes: ['id', 'numero', 'nombre']
      }],
      order: [['fecha_inicio', 'ASC']]
    });

    res.json({
      total: actividades.length,
      actividades
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/actividades/:id - Obtener actividad por ID
const obtenerActividad = async (req, res, next) => {
  try {
    const { id } = req.params;

    const actividad = await ActividadProgramada.findByPk(id, {
      include: [{
        model: Galpon,
        as: 'galpon',
        attributes: ['id', 'numero', 'nombre']
      }]
    });

    if (!actividad) {
      return res.status(404).json({
        error: 'Actividad no encontrada'
      });
    }

    res.json(actividad);
  } catch (error) {
    next(error);
  }
};

// POST /api/actividades - Crear nueva actividad
const crearActividad = async (req, res, next) => {
  try {
    const {
      titulo,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      todo_el_dia,
      galpon_id,
      prioridad,
      recordatorio,
      minutos_antes,
      notas
    } = req.body;

    // Validar campos requeridos
    if (!titulo || !tipo || !fecha_inicio) {
      return res.status(400).json({
        error: 'Campos requeridos: titulo, tipo, fecha_inicio'
      });
    }

    // Validar que el tipo sea válido
    const tiposValidos = ['vacunacion', 'limpieza', 'mantenimiento', 'revision_veterinaria', 'pesaje', 'cambio_alimento', 'otro'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        error: `El tipo debe ser uno de: ${tiposValidos.join(', ')}`
      });
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

    // Crear actividad
    const nuevaActividad = await ActividadProgramada.create({
      titulo,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin: fecha_fin || null,
      todo_el_dia: todo_el_dia || false,
      galpon_id: galpon_id || null,
      prioridad: prioridad || 'media',
      recordatorio: recordatorio || false,
      minutos_antes: minutos_antes || 60,
      notas: notas || null
    });

    const actividadConRelaciones = await ActividadProgramada.findByPk(nuevaActividad.id, {
      include: [{
        model: Galpon,
        as: 'galpon',
        attributes: ['id', 'numero', 'nombre']
      }]
    });

    res.status(201).json({
      mensaje: 'Actividad creada exitosamente',
      actividad: actividadConRelaciones
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/actividades/:id - Actualizar actividad
const actualizarActividad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      todo_el_dia,
      galpon_id,
      prioridad,
      recordatorio,
      minutos_antes,
      notas
    } = req.body;

    const actividad = await ActividadProgramada.findByPk(id);

    if (!actividad) {
      return res.status(404).json({
        error: 'Actividad no encontrada'
      });
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

    // Actualizar actividad
    await actividad.update({
      titulo: titulo || actividad.titulo,
      descripcion: descripcion !== undefined ? descripcion : actividad.descripcion,
      tipo: tipo || actividad.tipo,
      fecha_inicio: fecha_inicio || actividad.fecha_inicio,
      fecha_fin: fecha_fin !== undefined ? fecha_fin : actividad.fecha_fin,
      todo_el_dia: todo_el_dia !== undefined ? todo_el_dia : actividad.todo_el_dia,
      galpon_id: galpon_id !== undefined ? galpon_id : actividad.galpon_id,
      prioridad: prioridad || actividad.prioridad,
      recordatorio: recordatorio !== undefined ? recordatorio : actividad.recordatorio,
      minutos_antes: minutos_antes !== undefined ? minutos_antes : actividad.minutos_antes,
      notas: notas !== undefined ? notas : actividad.notas,
      actualizado_en: new Date()
    });

    const actividadActualizada = await ActividadProgramada.findByPk(id, {
      include: [{
        model: Galpon,
        as: 'galpon',
        attributes: ['id', 'numero', 'nombre']
      }]
    });

    res.json({
      mensaje: 'Actividad actualizada exitosamente',
      actividad: actividadActualizada
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/actividades/:id/completar - Marcar actividad como completada
const completarActividad = async (req, res, next) => {
  try {
    const { id } = req.params;

    const actividad = await ActividadProgramada.findByPk(id);

    if (!actividad) {
      return res.status(404).json({
        error: 'Actividad no encontrada'
      });
    }

    await actividad.update({
      completada: true,
      fecha_completada: new Date(),
      actualizado_en: new Date()
    });

    const actividadActualizada = await ActividadProgramada.findByPk(id, {
      include: [{
        model: Galpon,
        as: 'galpon',
        attributes: ['id', 'numero', 'nombre']
      }]
    });

    res.json({
      mensaje: 'Actividad marcada como completada',
      actividad: actividadActualizada
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/actividades/:id - Eliminar actividad
const eliminarActividad = async (req, res, next) => {
  try {
    const { id } = req.params;

    const actividad = await ActividadProgramada.findByPk(id);

    if (!actividad) {
      return res.status(404).json({
        error: 'Actividad no encontrada'
      });
    }

    await actividad.destroy();

    res.json({
      mensaje: 'Actividad eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/actividades/proximas - Obtener actividades próximas (próximos 7 días)
const actividadesProximas = async (req, res, next) => {
  try {
    const hoy = new Date();
    const proximosSieteDias = new Date();
    proximosSieteDias.setDate(hoy.getDate() + 7);

    const actividades = await ActividadProgramada.findAll({
      where: {
        fecha_inicio: {
          [Op.gte]: hoy,
          [Op.lte]: proximosSieteDias
        },
        completada: false
      },
      include: [{
        model: Galpon,
        as: 'galpon',
        attributes: ['id', 'numero', 'nombre']
      }],
      order: [['fecha_inicio', 'ASC']]
    });

    res.json({
      total: actividades.length,
      actividades
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarActividades,
  obtenerActividad,
  crearActividad,
  actualizarActividad,
  completarActividad,
  eliminarActividad,
  actividadesProximas
};
