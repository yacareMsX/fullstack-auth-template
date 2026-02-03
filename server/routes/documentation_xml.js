const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all entries
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM documentation_xml ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching documentation:', err);
        res.status(500).json({ error: 'Failed to fetch documentation' });
    }
});

// POST new entry
router.post('/', async (req, res) => {
    const { nombre_objeto, tipo_estructura, formato, descripcion } = req.body;

    // Validation
    if (!nombre_objeto || !tipo_estructura || !formato || !descripcion) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (nombre_objeto.length > 20) return res.status(400).json({ error: 'Nombre Objeto exceeds 20 chars' });
    if (tipo_estructura.length > 10) return res.status(400).json({ error: 'Tipo de estructura exceeds 10 chars' });
    if (formato.length > 5) return res.status(400).json({ error: 'Formato exceeds 5 chars' });
    if (descripcion.length > 120) return res.status(400).json({ error: 'Descripción exceeds 120 chars' });

    try {
        const result = await db.query(
            'INSERT INTO documentation_xml (nombre_objeto, tipo_estructura, formato, descripcion) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre_objeto, tipo_estructura, formato, descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating documentation entry:', err);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// DELETE entry
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM documentation_xml WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting documentation entry:', err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// GET single entry by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM documentation_xml WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching documentation entry:', err);
        res.status(500).json({ error: 'Failed to fetch entry' });
    }
});

// PUT update entry (specifically for fields_data)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { fields_data, nombre_objeto, tipo_estructura, formato, descripcion } = req.body;

    try {
        // Build dynamic query based on provided fields
        const updates = [];
        const values = [];
        let queryIndex = 1;

        if (fields_data !== undefined) {
            updates.push(`fields_data = $${queryIndex++}`);
            values.push(JSON.stringify(fields_data)); // Ensure it is treated as JSON string
        }
        if (nombre_objeto) {
            updates.push(`nombre_objeto = $${queryIndex++}`);
            values.push(nombre_objeto);
        }
        if (tipo_estructura) {
            updates.push(`tipo_estructura = $${queryIndex++}`);
            values.push(tipo_estructura);
        }
        if (formato) {
            updates.push(`formato = $${queryIndex++}`);
            values.push(formato);
        }
        if (descripcion) {
            updates.push(`descripcion = $${queryIndex++}`);
            values.push(descripcion);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE documentation_xml SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING *`;

        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating documentation entry:', err);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

module.exports = router;
