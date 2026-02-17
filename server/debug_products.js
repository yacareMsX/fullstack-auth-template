require('dotenv').config({ path: '/Users/ivan.prieto/antigravity/prj-jupiter/server/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkProducts() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
        console.log('Connected. Checking recent products...');
        const res = await client.query('SELECT id_producto, sku, invoice_country_id FROM producto ORDER BY id_producto DESC LIMIT 10');
        console.table(res.rows);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkProducts();
