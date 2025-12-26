const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActividadProgramada = sequelize.define('ActividadProgramada', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El título es requerido' }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM(
      'vacunacion',
      'limpieza',
      'mantenimiento',
      'revision_veterinaria',
      'pesaje',
      'cambio_alimento',
      'otro'
    ),
    allowNull: false,
    defaultValue: 'otro'
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'La fecha de inicio debe ser válida' }
    }
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: { msg: 'La fecha de fin debe ser válida' },
      isAfterStart(value) {
        if (value && this.fecha_inicio && new Date(value) < new Date(this.fecha_inicio)) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }
    }
  },
  todo_el_dia: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  galpon_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'galpones',
      key: 'id'
    }
  },
  completada: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fecha_completada: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    allowNull: false,
    defaultValue: 'media'
  },
  recordatorio: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  minutos_antes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 60,
    validate: {
      min: { args: [0], msg: 'Los minutos antes deben ser positivos' }
    }
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creado_en: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  actualizado_en: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'actividades_programadas',
  timestamps: false
});

module.exports = ActividadProgramada;
