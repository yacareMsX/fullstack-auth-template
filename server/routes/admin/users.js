const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');
const bcrypt = require('bcrypt');

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users with filters
 *     tags: [Admin, User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search, role_id } = req.query;
        let query = `
            SELECT u.id, u.email, u.is_active, r.name as role, 
                   p.first_name, p.last_name, p.nif, p.avatar_url,
                   p.phone, p.address_line1, p.address_line2, p.city, p.state_province, p.postal_code, p.country, p.date_of_birth, p.bio,
                   u.created_at, u.last_connection, u.is_online
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.email ILIKE $${params.length} OR p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length})`;
        }

        if (role_id) {
            params.push(role_id);
            query += ` AND u.role_id = $${params.length}`;
        }

        query += ` ORDER BY u.id ASC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error listing users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create User
router.post('/', authenticateToken, async (req, res) => {
    // Password is optional now, generated if missing
    // role_id received from frontend is actually the role NAME (string) e.g. "user", "admin"
    const {
        email, firstName, lastName, nif, role_id: roleName,
        phone, addressLine1, addressLine2, city, stateProvince, postalCode, country, dateOfBirth, bio
    } = req.body;
    let { password } = req.body;

    if (!email || !firstName || !lastName || !nif || !roleName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Check if email exists
        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Resolve Role ID from Name
        const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
        if (roleRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid role' });
        }
        const dbRoleId = roleRes.rows[0].id;

        // Generate random password if not provided (so we can save to DB Not Null col)
        if (!password) {
            password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert User - ALWAYS INACTIVE by default as per requirement
        const userRes = await client.query(
            'INSERT INTO users (email, password_hash, role_id, is_active) VALUES ($1, $2, $3, false) RETURNING id',
            [email, passwordHash, dbRoleId]
        );
        const userId = userRes.rows[0].id;

        // Insert Profile
        await client.query(
            `INSERT INTO profiles (
                user_id, first_name, last_name, nif, 
                phone, address_line1, address_line2, city, state_province, postal_code, country, date_of_birth, bio
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                userId, firstName, lastName, nif,
                phone, addressLine1, addressLine2, city, stateProvince, postalCode, country, dateOfBirth, bio
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({ message: 'User created successfully', id: userId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Internal server error: ' + err.message });
    } finally {
        client.release();
    }
});

// Update User
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        email, firstName, lastName, nif, role_id: roleName,
        phone, addressLine1, addressLine2, city, stateProvince, postalCode, country, dateOfBirth, bio
    } = req.body;

    if (!email || !firstName || !lastName || !nif || !roleName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Check if email exists for OTHER users
        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Resolve Role ID from Name
        const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
        if (roleRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid role' });
        }
        const dbRoleId = roleRes.rows[0].id;

        // Update User
        await client.query(
            'UPDATE users SET email = $1, role_id = $2 WHERE id = $3',
            [email, dbRoleId, id]
        );

        // Update Profile
        await client.query(
            `UPDATE profiles SET 
                first_name = $1, last_name = $2, nif = $3,
                phone = $4, address_line1 = $5, address_line2 = $6, city = $7, state_province = $8, 
                postal_code = $9, country = $10, date_of_birth = $11, bio = $12
             WHERE user_id = $13`,
            [
                firstName, lastName, nif,
                phone, addressLine1, addressLine2, city, stateProvince, postalCode, country, dateOfBirth, bio,
                id
            ]
        );

        await client.query('COMMIT');
        res.json({ message: `User ${id} updated` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error: ' + err.message });
    } finally {
        client.release();
    }
});

// Block/Unblock
router.put('/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    try {
        await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
        res.json({ message: `User ${id} status updated to ${is_active}` });
    } catch (err) {
        console.error('Error updating user status:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete User
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Basic soft delete or hard delete depending on policy.
        // For now, hard delete but with constraints it might fail if user has data.
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: `User ${id} deleted` });
    } catch (err) {
        if (err.code === '23503') { // Foreign key violation
            return res.status(400).json({ error: 'Cannot delete user with associated data' });
        }
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
