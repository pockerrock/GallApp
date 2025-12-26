const jwt = require('jsonwebtoken');
const { Usuario, Granja } = require('../models');

// Generar token JWT
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email (incluir password_hash)
    const usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Granja, as: 'granja', attributes: ['id', 'nombre'] }]
    });

    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(401).json({
        error: 'Usuario desactivado'
      });
    }

    // Comparar contraseña
    const passwordValido = await usuario.compararPassword(password);

    if (!passwordValido) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generarToken(usuario);

    // Preparar respuesta (sin password_hash)
    const usuarioData = usuario.toJSON();

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: usuarioData
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/register
const register = async (req, res, next) => {
  try {
    const { nombre, email, password, rol, granja_id } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos: nombre, email, password, rol'
      });
    }

    // Validar que el rol sea válido
    const rolesValidos = ['trabajador', 'supervisor', 'dueno'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({
        error: 'Rol inválido. Debe ser: trabajador, supervisor o dueno'
      });
    }

    // Verificar que el email no exista
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({
        error: 'El email ya está registrado'
      });
    }

    // Si se proporciona granja_id, verificar que exista
    if (granja_id) {
      const granja = await Granja.findByPk(granja_id);
      if (!granja) {
        return res.status(404).json({
          error: 'La granja especificada no existe'
        });
      }
    }

    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password_hash: password, // Se encripta en el hook beforeCreate
      rol,
      granja_id: granja_id || null
    });

    // Generar token
    const token = generarToken(nuevoUsuario);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: nuevoUsuario.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/profile
const getProfile = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      include: [{ model: Granja, as: 'granja' }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getProfile
};
