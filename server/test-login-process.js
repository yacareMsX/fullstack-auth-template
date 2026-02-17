require('dotenv').config();
const db = require('./db');

const email = 'test@example.com';

(async () => {
    try {
        console.log(`[TEST] database config: host=${process.env.DB_HOST} user=${process.env.DB_USER} db=${process.env.DB_NAME}`);

        // 1. Select User
        console.log('[TEST] 1. Selecting user...');
        const userRes = await db.query(
            `SELECT u.id, u.email
         FROM users u
         WHERE u.email = $1`,
            [email]
        );
        console.log(`[TEST] User found: ${userRes.rows.length}`);

        if (userRes.rows.length === 0) {
            console.log('[TEST] User not found, aborting rest of test (this is a valid result).');
            process.exit(0);
        }
        const user = userRes.rows[0];

        // 2. Update User (simulating login update)
        console.log('[TEST] 2. Updating user status...');
        await db.query(
            'UPDATE users SET is_online = true, last_connection = NOW() WHERE id = $1',
            [user.id]
        );
        console.log('[TEST] User updated.');

        // 3. Log Audit
        console.log('[TEST] 3. logging audit...');
        try {
            const query = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
            const detailsJson = JSON.stringify({ email: user.email, test: true });
            await db.query(query, [user.id, 'LOGIN_TEST', 'AUTH', null, detailsJson, '127.0.0.1']);
            console.log('[TEST] Audit logged.');
        } catch (e) {
            console.error('[TEST] Audit log failed:', e.message);
        }

        // 4. Permissions (simplified query from auth.js)
        console.log('[TEST] 4. Fetching permissions...');
        // We need role_id from user first, query again or use if we had it.
        // Let's just mock the query to see if connection works.
        await db.query('SELECT 1');
        console.log('[TEST] Permissions fetch simulated.');

        console.log('[TEST] Done.');
        process.exit(0);
    } catch (err) {
        console.error('[TEST] Error:', err);
        process.exit(1);
    }
})();
