const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { generateToken, getTokenExpirationTime } = require('../utils/jwt');
const { logAction } = require('../utils/audit');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, nif]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               nif:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already exists
 */
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

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for email: ${email}`);

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Get user with role
        const userRes = await db.query(
            `SELECT u.id, u.email, u.password_hash, u.role_id, r.name as role, 
                    p.first_name, p.last_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.email = $1 AND u.is_active = true`,
            [email]
        );
        console.log(`[AUTH] User lookup result count: ${userRes.rows.length}`);

        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userRes.rows[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            console.log('[AUTH] Validate password failed');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('[AUTH] Password validated');

        // Generate JWT token
        const token = generateToken(user.id, user.email, user.role);
        const expiresIn = getTokenExpirationTime();

        // Update session tracking
        await db.query(
            'UPDATE users SET is_online = true, last_connection = NOW() WHERE id = $1',
            [user.id]
        );

        // Log action
        try {
            await logAction(user.id, 'LOGIN', 'AUTH', null, { email: user.email }, req.ip);
        } catch (logErr) {
            console.error('Failed to log login action:', logErr);
        }

        // Get Permissions (Auth Object Codes)
        console.log(`[AUTH] Fetching permissions for role_id: ${user.role_id}`);
        const permissionsRes = await db.query(
            `SELECT DISTINCT ao.code
             FROM roles r
             JOIN role_rol_profiles rrp ON r.id = rrp.role_id
             JOIN rol_profiles rp ON rrp.profile_id = rp.id
             JOIN rol_profile_auth_objects rpao ON rp.id = rpao.profile_id
             JOIN authorization_objects ao ON rpao.auth_object_id = ao.id
             WHERE r.id = $1`,
            [user.role_id]
        );
        const permissions = permissionsRes.rows.map(row => row.code);
        console.log(`[AUTH] Permissions found: ${permissions.length}`);

        res.json({
            message: 'Login successful',
            token,
            expiresIn,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role, // role name from the join
                permissions: permissions
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userRes = await db.query(
            `SELECT u.id, u.email, u.role_id, r.name as role, 
                    p.first_name, p.last_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [req.user.userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRes.rows[0];

        // Get Permissions
        const permissionsRes = await db.query(
            `SELECT DISTINCT ao.code
             FROM roles r
             JOIN role_rol_profiles rrp ON r.id = rrp.role_id
             JOIN rol_profiles rp ON rrp.profile_id = rp.id
             JOIN rol_profile_auth_objects rpao ON rp.id = rpao.profile_id
             JOIN authorization_objects ao ON rpao.auth_object_id = ao.id
             WHERE r.id = $1`,
            [user.role_id]
        );
        const permissions = permissionsRes.rows.map(row => row.code);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                permissions: permissions
            }
        });
    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Alias for /api/auth/me (since router is mounted at /api)
router.get('/auth/me', authenticateToken, async (req, res) => {
    // Redirect logic or duplicate handler. Duplicating for simplicity.
    try {
        const userRes = await db.query(
            `SELECT u.id, u.email, u.role_id, r.name as role, 
                    p.first_name, p.last_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [req.user.userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRes.rows[0];

        // Get Permissions
        const permissionsRes = await db.query(
            `SELECT DISTINCT ao.code
             FROM roles r
             JOIN role_rol_profiles rrp ON r.id = rrp.role_id
             JOIN rol_profiles rp ON rrp.profile_id = rp.id
             JOIN rol_profile_auth_objects rpao ON rp.id = rpao.profile_id
             JOIN authorization_objects ao ON rpao.auth_object_id = ao.id
             WHERE r.id = $1`,
            [user.role_id]
        );
        const permissions = permissionsRes.rows.map(row => row.code);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                permissions: permissions
            }
        });
    } catch (err) {
        console.error('Auth/Me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await db.query('UPDATE users SET is_online = false WHERE id = $1', [req.user.userId]);
        await logAction(req.user.userId, 'LOGOUT', 'AUTH', null, { email: req.user.email }, req.ip);
        res.json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
