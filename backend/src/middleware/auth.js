const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Verificar token JWT
const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Buscar el usuario
    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        error: 'Usuario no autorizado'
      });
    }

    // Agregar usuario al request
    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Error al verificar token' });
  }
};

// Verificar roles específicos
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción',
        rol_requerido: rolesPermitidos,
        tu_rol: req.usuario.rol
      });
    }

    next();
  };
};

// Verificar que el usuario pertenece a la granja
const verificarGranja = async (req, res, next) => {
  try {
    const { granja_id } = req.params;
    const usuario = req.usuario;

    // El dueño puede acceder a todas las granjas
    if (usuario.rol === 'dueno') {
      return next();
    }

    // Verificar que el usuario pertenece a la granja
    if (usuario.granja_id !== parseInt(granja_id)) {
      return res.status(403).json({
        error: 'No tienes acceso a esta granja'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error al verificar acceso a granja' });
  }
};

module.exports = {
  verificarToken,
  verificarRol,
  verificarGranja
};
