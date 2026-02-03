
const { Pool } = require('pg');
require('dotenv').config(); // Load .env from current directory

async function verifyConnection() {
    console.log('Testing connection to GCP Database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: false // Start with no SSL to match psql behavior, or set { rejectUnauthorized: false } if needed
    });

    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database!');

        const res = await client.query('SELECT NOW() as now');
        console.log('Database time:', res.rows[0].now);

        const tableRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 5");
        console.log('Sample tables:', tableRes.rows.map(r => r.table_name).join(', '));

        client.release();
        await pool.end();
        console.log('Verification passed.');
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

verifyConnection();
