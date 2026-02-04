const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Representa el stock de un lote específico dentro de una bodega concreta
// Un mismo lote puede tener múltiples registros (uno por bodega)
const StockLoteBodega = sequelize.define('StockLoteBodega', {
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
  bodega_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bodegas',
      key: 'id'
    }
  },
  cantidad_actual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'La cantidad actual debe ser positiva' }
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
  tableName: 'stock_lote_bodega',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['lote_id', 'bodega_id'] }
  ]
});

module.exports = StockLoteBodega;

