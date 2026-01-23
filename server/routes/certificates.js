const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const router = express.Router();

// Get all certificates
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, offset = 0, search } = req.query;
        let query = 'SELECT * FROM certificates WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (search) {
            query += ` AND (filename ILIKE $${paramCount} OR cn ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get certificate by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM certificates WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create certificate
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { filename, cn, created_date, expiry_date, chain, active } = req.body;

        const result = await db.query(
            `INSERT INTO certificates (filename, cn, created_date, expiry_date, chain, active)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [filename, cn, created_date, expiry_date, chain, active ?? true]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update certificate
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { filename, cn, created_date, expiry_date, chain, active } = req.body;

        const result = await db.query(
            `UPDATE certificates 
             SET filename = COALESCE($1, filename),
                 cn = COALESCE($2, cn),
                 created_date = COALESCE($3, created_date),
                 expiry_date = COALESCE($4, expiry_date),
                 chain = COALESCE($5, chain),
                 active = COALESCE($6, active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [filename, cn, created_date, expiry_date, chain, active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Toggle active status
router.put('/:id/active', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body; // Expecting { active: true/false }

        if (typeof active !== 'boolean') {
            return res.status(400).json({ error: 'Active status must be a boolean' });
        }

        const result = await db.query(
            `UPDATE certificates 
             SET active = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating certificate status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete certificate
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM certificates WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
