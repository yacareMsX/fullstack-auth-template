const express = require('express');
const { authenticateToken } = require('../../../middleware/auth');
const db = require('../../../db');
const router = express.Router();

// Get all taxes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { activo } = req.query;
        let query = 'SELECT * FROM impuesto';
        const params = [];

        if (activo !== undefined) {
            query += ' WHERE activo = $1';
            params.push(activo === 'true');
        }

        query += ' ORDER BY porcentaje DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching taxes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get tax by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT * FROM impuesto WHERE id_impuesto = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tax not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching tax:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create tax
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { codigo, descripcion, porcentaje, activo = true } = req.body;

        if (!codigo || porcentaje === undefined) {
            return res.status(400).json({ error: 'Code and percentage are required' });
        }

        const result = await db.query(
            `INSERT INTO impuesto (codigo, descripcion, porcentaje, activo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [codigo, descripcion, porcentaje, activo]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating tax:', error);
        if (error.constraint === 'impuesto_codigo_key') {
            return res.status(409).json({ error: 'Tax code already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update tax
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, descripcion, porcentaje, activo } = req.body;

        const result = await db.query(
            `UPDATE impuesto 
       SET codigo = $1, descripcion = $2, porcentaje = $3, activo = $4
       WHERE id_impuesto = $5
       RETURNING *`,
            [codigo, descripcion, porcentaje, activo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tax not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating tax:', error);
        if (error.constraint === 'impuesto_codigo_key') {
            return res.status(409).json({ error: 'Tax code already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete tax
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM impuesto WHERE id_impuesto = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tax not found' });
        }

        res.json({ message: 'Tax deleted successfully' });
    } catch (error) {
        console.error('Error deleting tax:', error);
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Cannot delete tax in use by invoice lines' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
