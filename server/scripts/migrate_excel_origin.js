const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'ainvoices', // Force correct DB name
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/011_add_excel_origin.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration: 011_add_excel_origin.sql');
        await pool.query(sql);
        console.log('Migration completed successfully.');

        // List all origins to confirm IDs
        const res = await pool.query('SELECT * FROM origenes ORDER BY id_origen');
        console.table(res.rows);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
