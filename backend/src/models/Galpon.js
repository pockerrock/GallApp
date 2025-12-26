const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Galpon = sequelize.define('Galpon', {
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
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'El número debe ser mayor a 0' }
    }
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  sexo: {
    type: DataTypes.CHAR(1),
    allowNull: true,
    validate: {
      isIn: { args: [['M', 'H']], msg: 'El sexo debe ser M (Macho) o H (Hembra)' }
    }
  },
  lote: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'La capacidad debe ser mayor a 0' }
    }
  },
  aves_iniciales: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Las aves iniciales deben ser mayor a 0' }
    }
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  galpon_padre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'galpones',
      key: 'id'
    }
  },
  division_sufijo: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Sufijo de división (A, B, etc.)'
  },
  es_division: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'galpones',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['granja_id', 'numero', 'division_sufijo'], name: 'galpones_granja_numero_sufijo_unique' }
  ]
});

module.exports = Galpon;
