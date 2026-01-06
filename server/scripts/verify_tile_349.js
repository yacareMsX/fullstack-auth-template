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
        console.log('--- Verifying Tile 349 Permission ---');

        // 1. Check if Authorization Object exists
        const authObjRes = await pool.query("SELECT * FROM authorization_objects WHERE code = 'APP_TILE_349'");
        if (authObjRes.rows.length > 0) {
            console.log(`[OK] APP_TILE_349 found with ID: ${authObjRes.rows[0].id}`);
        } else {
            console.error(`[FAIL] APP_TILE_349 NOT found in authorization_objects.`);
        }

        // 2. Check if any profile has this permission
        const assignmentRes = await pool.query(`
            SELECT rp.name as profile_name, rp.id as profile_id
            FROM rol_profiles rp
            JOIN rol_profile_auth_objects rpao ON rp.id = rpao.profile_id
            JOIN authorization_objects ao ON rpao.auth_object_id = ao.id
            WHERE ao.code = 'APP_TILE_349'
        `);

        if (assignmentRes.rows.length > 0) {
            console.log(`[OK] APP_TILE_349 is assigned to ${assignmentRes.rows.length} profiles:`);
            assignmentRes.rows.forEach(r => console.log(` - ${r.profile_name} (ID: ${r.profile_id})`));
        } else {
            console.error(`[FAIL] APP_TILE_349 is NOT assigned to any profile.`);
        }

        // 3. Check profiles that HAVE APP_TILE_301 (for comparison)
        const refRes = await pool.query(`
            SELECT rp.name as profile_name, rp.id as profile_id
            FROM rol_profiles rp
            JOIN rol_profile_auth_objects rpao ON rp.id = rpao.profile_id
            JOIN authorization_objects ao ON rpao.auth_object_id = ao.id
            WHERE ao.code = 'APP_TILE_301'
        `);
        console.log(`[INFO] Profiles with APP_TILE_301 (Reference): ${refRes.rows.length}`);
        refRes.rows.forEach(r => console.log(` - ${r.profile_name} (ID: ${r.profile_id})`));

        await pool.end();
    } catch (err) {
        console.error('Error executing verification:', err);
        process.exit(1);
    }
}

verify();
