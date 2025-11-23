const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password, firstName, lastName, nif, phone, addressLine1, addressLine2, city, stateProvince, postalCode, country, dateOfBirth, bio } = req.body;

    // Basic validation
    if (!email || !password || !firstName || !lastName || !nif) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Get default role (user)
        const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', ['user']);
        if (roleRes.rows.length === 0) {
            throw new Error('Default role not found');
        }
        const roleId = roleRes.rows[0].id;

        // Insert User
        const userRes = await client.query(
            'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id',
            [email, passwordHash, roleId]
        );
        const userId = userRes.rows[0].id;

        // Insert Profile
        await client.query(
            `INSERT INTO profiles (
        user_id, first_name, last_name, nif, phone, 
        address_line1, address_line2, city, state_province, 
        postal_code, country, date_of_birth, bio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                userId, firstName, lastName, nif, phone,
                addressLine1, addressLine2, city, stateProvince,
                postalCode, country, dateOfBirth, bio
            ]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Registration error:', err);
        if (err.constraint === 'users_email_key') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
