const db = require('../db');

const REQUIRED_TABLES = [
    'users',
    'roles',
    'factura',
    'audit_logs',
    'countries',
    'workflows',
    'producto',
    'origenes'
];

async function verify() {
    console.log('Verifying database consistency...');
    try {
        const res = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);

        const existingTables = res.rows.map(r => r.table_name);
        const missingTables = REQUIRED_TABLES.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            console.error('❌ Missing critical tables:', missingTables.join(', '));
            console.log('Existing tables:', existingTables.join(', '));
            process.exit(1);
        } else {
            console.log('✅ All critical tables found.');
            console.log('Verified tables:', REQUIRED_TABLES.join(', '));
            process.exit(0);
        }
    } catch (err) {
        console.error('❌ Error during verification:', err);
        process.exit(1);
    } finally {
        if (db.pool) {
            await db.pool.end();
        } else if (db.end) {
            await db.end();
        }
    }
}

verify();
