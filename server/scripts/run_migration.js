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
    const migrationFile = process.argv[2];
    if (!migrationFile) {
        console.error('Usage: node scripts/run_migration.js <migration_file>');
        process.exit(1);
    }

    const filePath = path.join(__dirname, '..', 'migrations', migrationFile);

    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`Running migration: ${migrationFile}`);
        await pool.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Error running migration:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
