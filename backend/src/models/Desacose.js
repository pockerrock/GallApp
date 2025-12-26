const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Desacose = sequelize.define('Desacose', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  galpon_origen_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'galpones',
      key: 'id'
    }
  },
  galpon_destino_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'galpones',
      key: 'id'
    }
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  cantidad_aves: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'La cantidad de aves debe ser mayor a 0' }
    }
  },
  motivo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  realizado_por: {
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
  tableName: 'desacose',
  timestamps: false,
  validate: {
    origenDestinoDiferentes() {
      if (this.galpon_origen_id === this.galpon_destino_id) {
        throw new Error('El galpón de origen y destino deben ser diferentes');
      }
    }
  }
});

module.exports = Desacose;

