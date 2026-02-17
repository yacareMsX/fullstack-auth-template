require('dotenv').config({ path: '/Users/ivan.prieto/antigravity/prj-jupiter/server/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();

        console.log('Adding invoice_country_id column to producto table...');
        await client.query(`
            ALTER TABLE producto 
            ADD COLUMN IF NOT EXISTS invoice_country_id INTEGER DEFAULT 1;
        `);

        console.log('Column added. Updating existing records to default (1)...');
        await client.query(`
            UPDATE producto 
            SET invoice_country_id = 1 
            WHERE invoice_country_id IS NULL;
        `);

        console.log('Migration successful.');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
