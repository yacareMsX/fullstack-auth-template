const fs = require('fs');
const path = require('path');
const db = require('../db');

const migrationPath = path.join(__dirname, '../migrations/002_create_catalog_tables.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

async function runMigration() {
    try {
        console.log('Running catalog migration...');
        await db.query(migrationSql);
        console.log('Catalog migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error running catalog migration:', err);
        process.exit(1);
    }
}

runMigration();
