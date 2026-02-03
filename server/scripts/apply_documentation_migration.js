const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../db');

const schemaPath = path.join(__dirname, '../schemas/documentation_xml.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

async function runMigration() {
    try {
        console.log('Running documentation_xml migration...');
        await db.query(schemaSql);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
}

runMigration();
