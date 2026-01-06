const express = require('express');
const router = express.Router();
const db = require('../../db');
const { authenticateToken } = require('../../middleware/auth');

// GET /api/statutory/models
// Retrieve models based on query params (year, model_type)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { year, model_type, period } = req.query;

        let query = 'SELECT * FROM fiscal_models WHERE user_id = $1';
        let params = [userId];
        let paramIndex = 2;

        if (year) {
            query += ` AND year = $${paramIndex++}`;
            params.push(year);
        }
        if (model_type) {
            query += ` AND model_type = $${paramIndex++}`;
            params.push(model_type);
        }
        if (period) {
            query += ` AND period = $${paramIndex++}`;
            params.push(period);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching fiscal models:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/statutory/models/:id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM fiscal_models WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Model not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching fiscal model:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/statutory/models
// Create or Update a model
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { model_type, year, period, status, data } = req.body;

        if (!model_type || !year || !period) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if exists
        const check = await db.query(
            'SELECT id FROM fiscal_models WHERE user_id = $1 AND model_type = $2 AND year = $3 AND period = $4',
            [userId, model_type, year, period]
        );

        if (check.rows.length > 0) {
            // Update
            const update = await db.query(
                `UPDATE fiscal_models 
                 SET status = COALESCE($1, status), 
                     data = $2, 
                     updated_at = NOW() 
                 WHERE id = $3 RETURNING *`,
                [status, data, check.rows[0].id]
            );
            return res.json({ message: 'Model updated', model: update.rows[0] });
        } else {
            // Insert
            const insert = await db.query(
                `INSERT INTO fiscal_models (user_id, model_type, year, period, status, data)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userId, model_type, year, period, status || 'DRAFT', data]
            );
            return res.status(201).json({ message: 'Model created', model: insert.rows[0] });
        }

    } catch (err) {
        console.error('Error saving fiscal model:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
