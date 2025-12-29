
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

const pool = new Pool(dbConfig);

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');
        await client.query('BEGIN');

        // Fetch all invoices ordered by date
        const res = await client.query('SELECT id_factura, fecha_emision FROM factura ORDER BY fecha_emision ASC, id_factura ASC');
        const invoices = res.rows;

        console.log(`Found ${invoices.length} invoices to update.`);

        for (let i = 0; i < invoices.length; i++) {
            const invoice = invoices[i];
            const sequence = (i + 21).toString().padStart(12, '0'); // Start from 21 as requested
            const newNumber = `INV-ISUE-${sequence}`; // Fixed prefix as requested

            await client.query('UPDATE factura SET numero = $1 WHERE id_factura = $2', [newNumber, invoice.id_factura]);
            console.log(`Updated invoice ${invoice.id_factura} to ${newNumber}`);
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
