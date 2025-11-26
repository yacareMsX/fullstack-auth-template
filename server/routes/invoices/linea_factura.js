const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');
const router = express.Router();

// Get invoice lines
router.get('/:id_factura/lineas', authenticateToken, async (req, res) => {
    try {
        const { id_factura } = req.params;

        const result = await db.query(
            `SELECT lf.*, i.codigo as impuesto_codigo, i.descripcion as impuesto_descripcion
       FROM linea_factura lf
       LEFT JOIN impuesto i ON lf.id_impuesto = i.id_impuesto
       WHERE lf.id_factura = $1
       ORDER BY lf.created_at ASC`,
            [id_factura]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching invoice lines:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add line to invoice
router.post('/:id_factura/lineas', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { id_factura } = req.params;
        const { descripcion, cantidad, precio_unitario, porcentaje_impuesto, importe_impuesto, total_linea, id_impuesto } = req.body;

        if (!descripcion || !cantidad || precio_unitario === undefined) {
            return res.status(400).json({ error: 'Description, quantity, and unit price are required' });
        }

        await client.query('BEGIN');

        // Create line
        const lineResult = await client.query(
            `INSERT INTO linea_factura (
        id_factura, descripcion, cantidad, precio_unitario,
        porcentaje_impuesto, importe_impuesto, total_linea, id_impuesto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
            [id_factura, descripcion, cantidad, precio_unitario, porcentaje_impuesto, importe_impuesto, total_linea, id_impuesto]
        );

        // Recalculate invoice totals
        const totalsResult = await client.query(
            `SELECT 
        COALESCE(SUM(cantidad * precio_unitario), 0) as subtotal,
        COALESCE(SUM(importe_impuesto), 0) as impuestos_totales,
        COALESCE(SUM(total_linea), 0) as total
       FROM linea_factura
       WHERE id_factura = $1`,
            [id_factura]
        );

        const totals = totalsResult.rows[0];

        // Update invoice totals
        await client.query(
            `UPDATE factura 
       SET subtotal = $1, impuestos_totales = $2, total = $3
       WHERE id_factura = $4`,
            [totals.subtotal, totals.impuestos_totales, totals.total, id_factura]
        );

        await client.query('COMMIT');
        res.status(201).json(lineResult.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding invoice line:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Update invoice line
router.put('/lineas/:id', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { id } = req.params;
        const { descripcion, cantidad, precio_unitario, porcentaje_impuesto, importe_impuesto, total_linea, id_impuesto } = req.body;

        await client.query('BEGIN');

        // Update line
        const lineResult = await client.query(
            `UPDATE linea_factura 
       SET descripcion = $1, cantidad = $2, precio_unitario = $3,
           porcentaje_impuesto = $4, importe_impuesto = $5, total_linea = $6, id_impuesto = $7
       WHERE id_linea = $8
       RETURNING *`,
            [descripcion, cantidad, precio_unitario, porcentaje_impuesto, importe_impuesto, total_linea, id_impuesto, id]
        );

        if (lineResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invoice line not found' });
        }

        const line = lineResult.rows[0];

        // Recalculate invoice totals
        const totalsResult = await client.query(
            `SELECT 
        COALESCE(SUM(cantidad * precio_unitario), 0) as subtotal,
        COALESCE(SUM(importe_impuesto), 0) as impuestos_totales,
        COALESCE(SUM(total_linea), 0) as total
       FROM linea_factura
       WHERE id_factura = $1`,
            [line.id_factura]
        );

        const totals = totalsResult.rows[0];

        // Update invoice totals
        await client.query(
            `UPDATE factura 
       SET subtotal = $1, impuestos_totales = $2, total = $3
       WHERE id_factura = $4`,
            [totals.subtotal, totals.impuestos_totales, totals.total, line.id_factura]
        );

        await client.query('COMMIT');
        res.json(line);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating invoice line:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Delete invoice line
router.delete('/lineas/:id', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Get line to know which invoice to update
        const lineResult = await client.query(
            'SELECT id_factura FROM linea_factura WHERE id_linea = $1',
            [id]
        );

        if (lineResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invoice line not found' });
        }

        const id_factura = lineResult.rows[0].id_factura;

        // Delete line
        await client.query('DELETE FROM linea_factura WHERE id_linea = $1', [id]);

        // Recalculate invoice totals
        const totalsResult = await client.query(
            `SELECT 
        COALESCE(SUM(cantidad * precio_unitario), 0) as subtotal,
        COALESCE(SUM(importe_impuesto), 0) as impuestos_totales,
        COALESCE(SUM(total_linea), 0) as total
       FROM linea_factura
       WHERE id_factura = $1`,
            [id_factura]
        );

        const totals = totalsResult.rows[0];

        // Update invoice totals
        await client.query(
            `UPDATE factura 
       SET subtotal = $1, impuestos_totales = $2, total = $3
       WHERE id_factura = $4`,
            [totals.subtotal, totals.impuestos_totales, totals.total, id_factura]
        );

        await client.query('COMMIT');
        res.json({ message: 'Invoice line deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting invoice line:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
