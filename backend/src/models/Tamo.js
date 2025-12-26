const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tamo = sequelize.define('Tamo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  galpon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'galpones',
      key: 'id'
    }
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tipo_material: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El tipo de material es requerido' }
    }
  },
  cantidad_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'La cantidad debe ser mayor o igual a 0' }
    }
  },
  espanol_cm: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Espesor del tamo en centímetros'
  },
  calidad: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'buena',
    validate: {
      isIn: {
        args: [['excelente', 'buena', 'regular', 'mala']],
        msg: 'La calidad debe ser: excelente, buena, regular o mala'
      }
    }
  },
  humedad_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'La humedad debe ser mayor o igual a 0' },
      max: { args: [100], msg: 'La humedad no puede ser mayor a 100%' }
    }
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  aplicado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
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
  tableName: 'tamo',
  timestamps: false
});

module.exports = Tamo;

