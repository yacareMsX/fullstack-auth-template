const bcrypt = require('bcrypt');
const db = require('../db');

async function createTestUser() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const email = 'test@example.com';
        const password = 'password123';
        const firstName = 'Test';
        const lastName = 'User';
        const nif = '12345678Z';

        console.log(`Checking if user ${email} exists...`);
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);

        if (userCheck.rows.length > 0) {
            console.log('User already exists. Updating password...');
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
            console.log('Password updated to: ' + password);
        } else {
            console.log('Creating new test user...');
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Get role
            const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', ['user']);
            let roleId;
            if (roleRes.rows.length === 0) {
                console.log('Role "user" not found, creating it...');
                const newRole = await client.query('INSERT INTO roles (name) VALUES ($1) RETURNING id', ['user']);
                roleId = newRole.rows[0].id;
            } else {
                roleId = roleRes.rows[0].id;
            }

            // Insert User
            const userRes = await client.query(
                'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id',
                [email, passwordHash, roleId]
            );
            const userId = userRes.rows[0].id;

            // Insert Profile
            await client.query(
                `INSERT INTO profiles (user_id, first_name, last_name, nif) 
                 VALUES ($1, $2, $3, $4)`,
                [userId, firstName, lastName, nif]
            );
            console.log(`User ${email} created with password: ${password}`);
        }

        await client.query('COMMIT');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating test user:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

createTestUser();
