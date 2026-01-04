const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

/**
 * @swagger
 * /api/admin/auth-objects:
 *   get:
 *     summary: List all authorization objects
 *     tags: [Admin, AuthObjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of objects
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM authorization_objects WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (code ILIKE $${params.length} OR description ILIKE $${params.length} OR object_type ILIKE $${params.length})`;
        }

        query += ' ORDER BY id ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error listing auth objects:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/auth-objects:
 *   post:
 *     summary: Create a new authorization object
 *     tags: [Admin, AuthObjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - object_type
 *             properties:
 *               code:
 *                 type: string
 *               object_type:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Object created
 */
router.post('/', authenticateToken, async (req, res) => {
    const { code, object_type, description } = req.body;

    if (!code || !object_type) {
        return res.status(400).json({ error: 'Code and Type are required' });
    }

    try {
        // Check for duplicates
        const check = await db.query('SELECT id FROM authorization_objects WHERE code = $1', [code]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'Object with this code already exists' });
        }

        const result = await db.query(
            'INSERT INTO authorization_objects (code, object_type, description) VALUES ($1, $2, $3) RETURNING id',
            [code, object_type, description]
        );
        res.status(201).json({ message: 'Object created', id: result.rows[0].id });
    } catch (err) {
        console.error('Error creating auth object:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/auth-objects/{id}:
 *   put:
 *     summary: Update an authorization object
 *     tags: [Admin, AuthObjects]
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
 *               code:
 *                 type: string
 *               object_type:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Object updated
 */
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { code, object_type, description } = req.body;

    if (!code || !object_type) {
        return res.status(400).json({ error: 'Code and Type are required' });
    }

    try {
        // Check for duplicates (excluding self)
        const check = await db.query('SELECT id FROM authorization_objects WHERE code = $1 AND id != $2', [code, id]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'Object with this code already exists' });
        }

        const result = await db.query(
            'UPDATE authorization_objects SET code = $1, object_type = $2, description = $3 WHERE id = $4 RETURNING id',
            [code, object_type, description, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Object not found' });
        }

        res.json({ message: 'Object updated' });
    } catch (err) {
        console.error('Error updating auth object:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/auth-objects/{id}:
 *   delete:
 *     summary: Delete an authorization object
 *     tags: [Admin, AuthObjects]
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
 *         description: Object deleted
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM authorization_objects WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Object not found' });
        }

        res.json({ message: 'Object deleted' });
    } catch (err) {
        if (err.code === '23503') { // Foreign key violation
            return res.status(409).json({ error: 'Cannot delete object: It is assigned to restrictions.' });
        }
        console.error('Error deleting auth object:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
