const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function verify() {
    try {
        const tables = ['authorization_objects', 'rol_profiles', 'rol_profile_auth_objects', 'role_rol_profiles'];
        for (const table of tables) {
            const res = await pool.query(`SELECT to_regclass('public.${table}')`);
            if (res.rows[0].to_regclass) {
                console.log(`[OK] Table ${table} exists.`);
            } else {
                console.error(`[FAIL] Table ${table} DOES NOT exist.`);
            }
        }

        const devRole = await pool.query("SELECT * FROM roles WHERE name = 'dev'");
        if (devRole.rows.length > 0) {
            console.log(`[OK] Role 'dev' exists with ID: ${devRole.rows[0].id}`);
            if (parseInt(devRole.rows[0].id) === 3) {
                console.log(`[OK] Role 'dev' has correct ID 3.`);
            } else {
                console.warn(`[WARN] Role 'dev' exists but ID is ${devRole.rows[0].id}, expected 3.`);
            }
        } else {
            console.error(`[FAIL] Role 'dev' NOT found.`);
        }

        const authObjs = await pool.query("SELECT count(*) FROM authorization_objects");
        console.log(`[OK] Found ${authObjs.rows[0].count} Authorization Objects.`);

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
