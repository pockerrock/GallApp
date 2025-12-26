const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos
// Railway proporciona DATABASE_URL automáticamente
const sequelize = new Sequelize(
  process.env.DATABASE_URL || {
    database: process.env.DB_NAME || 'gallinaapp',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // SSL para producción (Railway, Heroku, etc.)
      ...(process.env.DATABASE_URL && {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      })
    }
  }
);

// Probar conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
