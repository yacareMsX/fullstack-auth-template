const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { generateToken, getTokenExpirationTime } = require('../utils/jwt');
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
            'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id, email',
            [email, passwordHash, roleId]
        );
        const user = userRes.rows[0];

        // Insert Profile
        await client.query(
            `INSERT INTO profiles (
        user_id, first_name, last_name, nif, phone, 
        address_line1, address_line2, city, state_province, 
        postal_code, country, date_of_birth, bio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                user.id, firstName, lastName, nif, phone,
                addressLine1, addressLine2, city, stateProvince,
                postalCode, country, dateOfBirth, bio
            ]
        );

        await client.query('COMMIT');

        // Generate JWT token
        const token = generateToken(user.id, user.email, 'user');
        const expiresIn = getTokenExpirationTime();

        res.status(201).json({
            message: 'User registered successfully',
            token,
            expiresIn,
            user: {
                id: user.id,
                email: user.email,
                firstName,
                lastName,
                role: 'user'
            }
        });
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

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Get user with role
        const userRes = await db.query(
            `SELECT u.id, u.email, u.password_hash, r.name as role, 
                    p.first_name, p.last_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.email = $1 AND u.is_active = true`,
            [email]
        );

        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userRes.rows[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(user.id, user.email, user.role);
        const expiresIn = getTokenExpirationTime();

        res.json({
            message: 'Login successful',
            token,
            expiresIn,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
