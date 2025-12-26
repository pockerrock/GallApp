const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RegistroDiario = sequelize.define('RegistroDiario', {
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
      min: { args: [1], msg: 'La edad debe ser al menos 1 día' }
    }
  },
  consumo_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'El consumo debe ser positivo' }
    }
  },
  tipo_alimento: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lote_alimento: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  cantidad_bultos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'La cantidad de bultos no puede ser negativa' }
    }
  },
  mortalidad: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'La mortalidad no puede ser negativa' }
    }
  },
  seleccion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'La selección no puede ser negativa' }
    }
  },
  saldo_aves: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'El saldo de aves no puede ser negativo' }
    }
  },
  peso_promedio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'El peso promedio debe ser positivo' }
    }
  },
  acumulado_alimento: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'El acumulado debe ser positivo' }
    }
  },
  temperatura: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  humedad: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  foto_factura: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  foto_medidor: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sincronizado: {
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
  tableName: 'registros_diarios',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['galpon_id', 'fecha'] }
  ]
});

// Campos para fotos (agregados dinámicamente si no existen en BD, pero definidos aquí para Sequelize)
RegistroDiario.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  return values;
};

module.exports = RegistroDiario;
