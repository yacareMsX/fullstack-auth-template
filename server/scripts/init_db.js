const fs = require('fs');
const path = require('path');
const db = require('../db');

const schemaPath = path.join(__dirname, '../schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const countriesSeedPath = path.join(__dirname, '../seeds/countries.sql');
const countriesSeedSql = fs.readFileSync(countriesSeedPath, 'utf8');

async function initDb() {
    try {
        console.log('Running schema migration...');
        await db.query(schemaSql);
        console.log('Schema migration completed.');

        console.log('Seeding countries...');
        await db.query(countriesSeedSql);
        console.log('Countries seeded successfully.');

        process.exit(0);
    } catch (err) {
        console.error('Error running schema migration:', err);
        process.exit(1);
    }
}

initDb();
