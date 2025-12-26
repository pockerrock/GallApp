// Middleware para manejo centralizado de errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      detalles: err.errors.map(e => ({
        campo: e.path,
        mensaje: e.message
      }))
    });
  }

  // Error de clave única
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'El registro ya existe',
      detalles: err.errors.map(e => ({
        campo: e.path,
        mensaje: e.message
      }))
    });
  }

  // Error de clave foránea
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Referencia inválida',
      mensaje: 'El registro relacionado no existe'
    });
  }

  // Error de base de datos
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      error: 'Error de base de datos',
      mensaje: 'Error al procesar la solicitud'
    });
  }

  // Error personalizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  // Error genérico
  return res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
  });
};

// Middleware para rutas no encontradas
const notFound = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    ruta: req.originalUrl
  });
};

module.exports = {
  errorHandler,
  notFound
};
