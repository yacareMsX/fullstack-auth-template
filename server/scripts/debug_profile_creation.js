const db = require('../db');

async function debugProfileCreation() {
    const client = await db.pool.connect();
    try {
        console.log('Starting transaction...');
        await client.query('BEGIN');

        const name = 'Debug Profile ' + Date.now();
        const description = 'Created via debug script';
        const auth_object_ids = [];

        console.log('Inserting profile:', name);
        // Insert Profile
        const result = await client.query(
            'INSERT INTO rol_profiles (name, description) VALUES ($1, $2) RETURNING id',
            [name, description]
        );
        const profileId = result.rows[0].id;
        console.log('Profile created with ID:', profileId);

        // Fetch a valid auth object ID to test association
        const authObj = await client.query('SELECT id FROM authorization_objects LIMIT 1');
        if (authObj.rows.length > 0) {
            const authId = authObj.rows[0].id;
            console.log('Associating auth object ID:', authId);
            await client.query(
                'INSERT INTO rol_profile_auth_objects (profile_id, auth_object_id) VALUES ($1, $2)',
                [profileId, authId]
            );
            console.log('Association successful');
        } else {
            console.log('No auth objects found to associate');
        }

        await client.query('ROLLBACK'); // Rollback to not pollute DB
        console.log('Transaction rolled back (success)');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during profile creation:', err);
    } finally {
        client.release();
        process.exit();
    }
}

debugProfileCreation();
