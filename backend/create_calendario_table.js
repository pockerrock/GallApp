require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: process.env.DB_SSL === 'true' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {}
});

async function runMigration() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Creating actividades_programadas table...');

        // Check if table exists
        const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'actividades_programadas'
      );
    `);

        if (results[0].exists) {
            console.log('Table actividades_programadas already exists.');
        } else {
            await sequelize.query(`
        CREATE TABLE actividades_programadas (
          id SERIAL PRIMARY KEY,
          titulo VARCHAR(200) NOT NULL,
          descripcion TEXT,
          tipo VARCHAR(50) NOT NULL DEFAULT 'otro',
          fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
          fecha_fin TIMESTAMP WITH TIME ZONE,
          todo_el_dia BOOLEAN DEFAULT FALSE,
          galpon_id INTEGER REFERENCES galpones(id) ON DELETE SET NULL,
          completada BOOLEAN DEFAULT FALSE,
          fecha_completada TIMESTAMP WITH TIME ZONE,
          prioridad VARCHAR(20) DEFAULT 'media',
          recordatorio BOOLEAN DEFAULT FALSE,
          minutos_antes INTEGER DEFAULT 60,
          notas TEXT,
          creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
            console.log('Table actividades_programadas created successfully.');

            // Create indexes for performance
            await sequelize.query(`CREATE INDEX idx_actividades_fecha_inicio ON actividades_programadas(fecha_inicio);`);
            await sequelize.query(`CREATE INDEX idx_actividades_galpon_id ON actividades_programadas(galpon_id);`);
            console.log('Indexes created.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

runMigration();
