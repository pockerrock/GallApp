const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventarioAlimento = sequelize.define('InventarioAlimento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lote_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lotes_alimento',
      key: 'id'
    }
  },
  tipo_movimiento: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: {
        args: [['entrada', 'salida']],
        msg: 'El tipo de movimiento debe ser entrada o salida'
      }
    }
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'La cantidad debe ser positiva' }
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
  bodega_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bodegas',
      key: 'id'
    }
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'creado_en'
  }
}, {
  tableName: 'inventario_alimento',
  timestamps: false
});

module.exports = InventarioAlimento;
