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
        console.log('🚀 Starting invoice schema migration...\n');

        // Read the schema file
        const schemaPath = path.join(__dirname, '../schemas/invoices.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute the schema
        await client.query('BEGIN');
        await client.query(schema);
        await client.query('COMMIT');

        console.log('✅ Invoice schema migration completed successfully!\n');
        console.log('📊 Created tables:');
        console.log('   - emisor (Invoice Issuers)');
        console.log('   - receptor (Invoice Receivers)');
        console.log('   - impuesto (Tax Catalog)');
        console.log('   - factura (Invoices)');
        console.log('   - linea_factura (Invoice Lines)');
        console.log('   - log_factura (Audit Log)');
        console.log('   - adjunto (Attachments)');
        console.log('\n📈 Created indexes, triggers, and views');
        console.log('💾 Inserted initial tax data (IVA rates)');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
runMigration();
