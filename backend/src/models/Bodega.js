const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bodega = sequelize.define('Bodega', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  granja_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'granjas',
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es requerido' }
    }
  },
  ubicacion: {
    type: DataTypes.STRING(200),
    allowNull: true
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
  tableName: 'bodegas',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['granja_id', 'nombre'] }
  ]
});

module.exports = Bodega;

