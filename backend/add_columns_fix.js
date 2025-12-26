require('dotenv').config({ path: '../.env' }); // Adjusted path if file is in scripts folder, but let's put it in backend root
const { sequelize } = require('./src/config/database');

async function run() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Running ALTER TABLE...');
        await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_diarios' AND column_name = 'foto_factura') THEN
          ALTER TABLE registros_diarios ADD COLUMN foto_factura VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_diarios' AND column_name = 'foto_medidor') THEN
          ALTER TABLE registros_diarios ADD COLUMN foto_medidor VARCHAR(255);
        END IF;
      END
      $$;
    `);

        // Fallback for non-Postgres (though project uses pg) or simple query if the above fails
        // actually above is PL/pgSQL. If generic query is preferred:
        // await sequelize.query('ALTER TABLE registros_diarios ADD COLUMN IF NOT EXISTS foto_factura VARCHAR(255);'); 
        // Postgres supports IF NOT EXISTS for ADD COLUMN in newer versions (9.6+).

        console.log('Columns added successfully.');

    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await sequelize.close();
    }
}

run();
