const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');
const router = express.Router();

/**
 * @swagger
 * /api/admin/origenes:
 *   get:
 *     summary: Get all origins
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of origins
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM origenes ORDER BY id_origen');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching origins:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/origenes:
 *   post:
 *     summary: Create a new origin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descripcion]
 *             properties:
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Origin created successfully
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { descripcion } = req.body;
        if (!descripcion) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const result = await db.query(
            'INSERT INTO origenes (descripcion) VALUES ($1) RETURNING *',
            [descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating origin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/origenes/{id}:
 *   put:
 *     summary: Update an origin
 *     tags: [Admin]
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
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Origin updated successfully
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion } = req.body;

        if (!descripcion) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const result = await db.query(
            'UPDATE origenes SET descripcion = $1 WHERE id_origen = $2 RETURNING *',
            [descripcion, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Origin not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating origin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/origenes/{id}:
 *   delete:
 *     summary: Delete an origin
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Origin deleted successfully
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if used in invoices
        const checkUsage = await db.query('SELECT COUNT(*) FROM factura WHERE id_origen = $1', [id]);
        if (parseInt(checkUsage.rows[0].count) > 0) {
            return res.status(400).json({ error: 'Cannot delete origin: it is used in invoices' });
        }

        const result = await db.query('DELETE FROM origenes WHERE id_origen = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Origin not found' });
        }

        res.json({ message: 'Origin deleted successfully' });
    } catch (error) {
        console.error('Error deleting origin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
