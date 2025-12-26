const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es requerido' }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Debe ser un email válido' }
    }
  },
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rol: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: {
        args: [['trabajador', 'supervisor', 'dueno']],
        msg: 'El rol debe ser: trabajador, supervisor o dueno'
      }
    }
  },
  granja_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'granjas',
      key: 'id'
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'creado_en'
  },
  actualizado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'actualizado_en'
  }
}, {
  tableName: 'usuarios',
  timestamps: false,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.password_hash) {
        usuario.password_hash = await bcrypt.hash(usuario.password_hash, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password_hash')) {
        usuario.password_hash = await bcrypt.hash(usuario.password_hash, 10);
      }
    }
  }
});

// Método de instancia para comparar contraseñas
Usuario.prototype.compararPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Método para ocultar password_hash en JSON
Usuario.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

module.exports = Usuario;
