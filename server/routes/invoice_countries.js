const express = require('express');
const router = express.Router();
const db = require('../db');

// List all countries
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM invoice_country ORDER BY pais ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching invoice countries:', err);
        res.status(500).json({ error: 'Failed to fetch invoice countries' });
    }
});

// Get a specific country by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM invoice_country WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Country not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching invoice country:', err);
        res.status(500).json({ error: 'Failed to fetch invoice country' });
    }
});

// Create a new country
router.post('/', async (req, res) => {
    const { pais, region } = req.body;
    if (!pais) {
        return res.status(400).json({ error: 'Pais is required' });
    }
    try {
        const result = await db.query(
            'INSERT INTO invoice_country (pais, region) VALUES ($1, $2) RETURNING *',
            [pais, region]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating invoice country:', err);
        res.status(500).json({ error: 'Failed to create invoice country' });
    }
});

// Update an existing country
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { pais, region } = req.body;

    if (!pais) {
        return res.status(400).json({ error: 'Pais is required' });
    }

    try {
        const result = await db.query(
            'UPDATE invoice_country SET pais = $1, region = $2 WHERE id = $3 RETURNING *',
            [pais, region, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Country not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating invoice country:', err);
        res.status(500).json({ error: 'Failed to update invoice country' });
    }
});

// Delete a country
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM invoice_country WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Country not found' });
        }
        res.json({ message: 'Country deleted successfully' });
    } catch (err) {
        console.error('Error deleting invoice country:', err);
        res.status(500).json({ error: 'Failed to delete invoice country' });
    }
});

module.exports = router;
