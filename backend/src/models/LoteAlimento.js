const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoteAlimento = sequelize.define('LoteAlimento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El tipo de alimento es requerido' }
    }
  },
  codigo_lote: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El código de lote es requerido' }
    }
  },
  cantidad_inicial: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'La cantidad inicial debe ser positiva' }
    }
  },
  cantidad_actual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'La cantidad actual debe ser positiva' }
    }
  },
  fecha_ingreso: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  proveedor: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bodega_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bodegas',
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
  tableName: 'lotes_alimento',
  timestamps: false
});

module.exports = LoteAlimento;
