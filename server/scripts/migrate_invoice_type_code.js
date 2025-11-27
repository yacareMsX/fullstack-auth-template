const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting migration 008_add_invoice_type_code...\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, '../migrations/008_add_invoice_type_code.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute the SQL
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('✅ Migration 008 completed successfully!\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
