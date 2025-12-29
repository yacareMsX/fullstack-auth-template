const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     summary: List all roles
 *     tags: [Admin, Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM roles WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }

        query += ' ORDER BY id ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error listing roles:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Admin, Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created
 */
router.post('/', authenticateToken, async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        // Check for duplicates
        const check = await db.query('SELECT id FROM roles WHERE name = $1', [name]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'Role with this name already exists' });
        }

        const result = await db.query(
            'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id',
            [name, description]
        );
        res.status(201).json({ message: 'Role created', id: result.rows[0].id });
    } catch (err) {
        console.error('Error creating role:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Admin, Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        // Check for duplicates (excluding self)
        const check = await db.query('SELECT id FROM roles WHERE name = $1 AND id != $2', [name, id]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'Role with this name already exists' });
        }

        const result = await db.query(
            'UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING id',
            [name, description, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json({ message: 'Role updated' });
    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Admin, Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Check if role is in use
        const userCheck = await db.query('SELECT id FROM users WHERE role_id = $1 LIMIT 1', [id]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Cannot delete role: It is assigned to one or more users.' });
        }

        const result = await db.query('DELETE FROM roles WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json({ message: 'Role deleted' });
    } catch (err) {
        console.error('Error deleting role:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
