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
  // tipos soportados:
  // - entrada  : ingreso de alimento a una bodega
  // - consumo  : consumo de un galpón desde su bodega asignada
  // - traslado : movimiento entre bodegas (origen/destino)
  // - ajuste   : corrección manual de stock
  tipo_movimiento: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      isIn: {
        args: [['entrada', 'consumo', 'traslado', 'ajuste']],
        msg: 'El tipo de movimiento debe ser entrada, consumo, traslado o ajuste'
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
  // Para movimientos simples (entrada/consumo/ajuste) se usa bodega_id
  bodega_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bodegas',
      key: 'id'
    }
  },
  // Para traslados se usan bodega_origen_id y bodega_destino_id
  bodega_origen_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bodegas',
      key: 'id'
    }
  },
  bodega_destino_id: {
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
