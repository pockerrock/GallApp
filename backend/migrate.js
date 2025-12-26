#!/usr/bin/env node

/**
 * Script de migración para GallinaApp
 * Ejecuta el schema SQL en la base de datos
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

const useSSL = process.env.DB_SSL === 'true';

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSSL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});


async function ejecutarMigracion() {
  console.log('\n🐔 GallinaApp - Migración de Base de Datos\n');
  console.log('==========================================\n');

  try {
    // 1. Verificar conexión
    log.info('Verificando conexión a la base de datos...');
    await sequelize.authenticate();
    log.success('Conexión establecida correctamente');

    // Mostrar info de la BD
    console.log(`\n📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`🖥️  Host: ${process.env.DB_HOST}\n`);

    // 2. Leer el archivo schema.sql
    const schemaPath = path.join(__dirname, '../database/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      log.error('No se encuentra el archivo database/schema.sql');
      process.exit(1);
    }

    log.info('Leyendo archivo schema.sql...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    log.success('Schema cargado correctamente');

    // 3. Ejecutar schema
    log.info('Ejecutando schema en la base de datos...');
    await sequelize.query(schema);
    log.success('Schema ejecutado correctamente');

    // 4. Verificar tablas creadas
    log.info('Verificando tablas creadas...');
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Tablas creadas:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // 5. Preguntar si desea cargar datos de prueba
    console.log('\n');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('¿Deseas cargar los datos de prueba? (s/n): ', async (respuesta) => {
      if (respuesta.toLowerCase() === 's') {
        const seedPath = path.join(__dirname, '../database/migrations/seed.sql');

        if (fs.existsSync(seedPath)) {
          log.info('Cargando datos de prueba...');
          const seed = fs.readFileSync(seedPath, 'utf8');
          await sequelize.query(seed);
          log.success('Datos de prueba cargados correctamente');

          console.log('\n🔑 Usuarios de prueba:');
          console.log('   - dueno@elolimp.com / password123');
          console.log('   - supervisor@elolimp.com / password123');
          console.log('   - trabajador@elolimp.com / password123');
        } else {
          log.error('No se encuentra el archivo database/migrations/seed.sql');
        }
      }

      console.log('\n✅ Migración completada\n');
      await sequelize.close();
      readline.close();
      process.exit(0);
    });

  } catch (error) {
    log.error('Error durante la migración:');
    console.error(error.message);
    await sequelize.close();
    process.exit(1);
  }
}

// Ejecutar migración
ejecutarMigracion();
