const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConsumoGas = sequelize.define('ConsumoGas', {
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
  edad_dias: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'La edad debe ser mayor o igual a 0' }
    }
  },
  lectura_medidor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  consumo_m3: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  imagen_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creado_por: {
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
  tableName: 'consumo_gas',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['galpon_id', 'fecha', 'edad_dias'] }
  ]
});

module.exports = ConsumoGas;

