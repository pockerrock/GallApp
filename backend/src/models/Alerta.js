const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alerta = sequelize.define('Alerta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El tipo de alerta es requerido' }
    }
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El mensaje es requerido' }
    }
  },
  severidad: {
    type: DataTypes.STRING(20),
    defaultValue: 'media',
    validate: {
      isIn: {
        args: [['baja', 'media', 'alta']],
        msg: 'La severidad debe ser: baja, media o alta'
      }
    }
  },
  galpon_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'galpones',
      key: 'id'
    }
  },
  lote_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'lotes_alimento',
      key: 'id'
    }
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  atendida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  atendida_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  fecha_atencion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'creado_en'
  }
}, {
  tableName: 'alertas',
  timestamps: false
});

module.exports = Alerta;
