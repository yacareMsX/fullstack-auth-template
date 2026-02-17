const express = require('express');
const { authenticateToken } = require('../../../middleware/auth');
const db = require('../../../db');
const router = express.Router();

// Get all issuers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM emisor ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching issuers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get issuer by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT * FROM emisor WHERE id_emisor = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Issuer not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching issuer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create issuer
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nombre, nif, direccion, email, telefono } = req.body;

        if (!nombre || !nif) {
            return res.status(400).json({ error: 'Name and NIF are required' });
        }

        const result = await db.query(
            `INSERT INTO emisor (nombre, nif, direccion, email, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [nombre, nif, direccion, email, telefono]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating issuer:', error);
        if (error.constraint === 'emisor_nif_key') {
            return res.status(409).json({ error: 'NIF already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update issuer
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, nif, direccion, email, telefono } = req.body;

        const result = await db.query(
            `UPDATE emisor 
       SET nombre = $1, nif = $2, direccion = $3, email = $4, telefono = $5
       WHERE id_emisor = $6
       RETURNING *`,
            [nombre, nif, direccion, email, telefono, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Issuer not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating issuer:', error);
        if (error.constraint === 'emisor_nif_key') {
            return res.status(409).json({ error: 'NIF already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete issuer
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM emisor WHERE id_emisor = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Issuer not found' });
        }

        res.json({ message: 'Issuer deleted successfully' });
    } catch (error) {
        console.error('Error deleting issuer:', error);
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Cannot delete issuer with existing invoices' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
