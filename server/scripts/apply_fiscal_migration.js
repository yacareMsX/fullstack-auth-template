const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function applyMigrations() {
    try {
        console.log('--- Applying Fiscal Models Migration ---');
        const file = '../migrations/021_create_fiscal_models_table.sql';
        const filePath = path.join(__dirname, file);
        console.log(`Reading file: ${filePath}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`Executing SQL from ${file}...`);
        await pool.query(sql);
        console.log(`[OK] Executed ${file}`);
        await pool.end();
    } catch (err) {
        console.error('Error applying migrations:', err);
        process.exit(1);
    }
}

applyMigrations();
