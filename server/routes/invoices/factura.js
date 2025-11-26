const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');
const router = express.Router();

// Get all invoices with filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { estado, tipo, id_emisor, id_receptor, fecha_desde, fecha_hasta, limit = 50, offset = 0 } = req.query;

        let query = `
      SELECT f.*, 
             e.nombre as emisor_nombre,
             r.nombre as receptor_nombre
      FROM factura f
      JOIN emisor e ON f.id_emisor = e.id_emisor
      JOIN receptor r ON f.id_receptor = r.id_receptor
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (tipo) {
            query += ` AND f.tipo = $${paramCount}`;
            params.push(tipo);
            paramCount++;
        }

        if (estado) {
            query += ` AND f.estado = $${paramCount}`;
            params.push(estado);
            paramCount++;
        }

        if (id_emisor) {
            query += ` AND f.id_emisor = $${paramCount}`;
            params.push(id_emisor);
            paramCount++;
        }

        if (id_receptor) {
            query += ` AND f.id_receptor = $${paramCount}`;
            params.push(id_receptor);
            paramCount++;
        }

        if (fecha_desde) {
            query += ` AND f.fecha_emision >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        }

        if (fecha_hasta) {
            query += ` AND f.fecha_emision <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }

        query += ` ORDER BY f.fecha_emision DESC, f.numero DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get invoice by ID with details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get invoice with issuer and receiver details
        const invoiceResult = await db.query(
            `SELECT f.*, 
              e.nombre as emisor_nombre, e.nif as emisor_nif, e.direccion as emisor_direccion,
              e.email as emisor_email, e.telefono as emisor_telefono,
              r.nombre as receptor_nombre, r.nif as receptor_nif, r.direccion as receptor_direccion,
              r.email as receptor_email, r.telefono as receptor_telefono
       FROM factura f
       JOIN emisor e ON f.id_emisor = e.id_emisor
       JOIN receptor r ON f.id_receptor = r.id_receptor
       WHERE f.id_factura = $1`,
            [id]
        );

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const invoice = invoiceResult.rows[0];

        // Get invoice lines
        const linesResult = await db.query(
            `SELECT lf.*, i.codigo as impuesto_codigo, i.descripcion as impuesto_descripcion
       FROM linea_factura lf
       LEFT JOIN impuesto i ON lf.id_impuesto = i.id_impuesto
       WHERE lf.id_factura = $1
       ORDER BY lf.created_at ASC`,
            [id]
        );

        invoice.lineas = linesResult.rows;

        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate PDF for invoice
router.get('/:id/pdf', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { generateInvoicePDF } = require('../../utils/pdfGenerator');

        // Get invoice with all details
        const invoiceResult = await db.query(
            `SELECT f.*, 
              e.nombre as emisor_nombre, e.nif as emisor_nif, e.direccion as emisor_direccion,
              e.email as emisor_email, e.telefono as emisor_telefono,
              r.nombre as receptor_nombre, r.nif as receptor_nif, r.direccion as receptor_direccion,
              r.email as receptor_email, r.telefono as receptor_telefono
       FROM factura f
       JOIN emisor e ON f.id_emisor = e.id_emisor
       JOIN receptor r ON f.id_receptor = r.id_receptor
       WHERE f.id_factura = $1`,
            [id]
        );

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const invoice = invoiceResult.rows[0];

        // Get invoice lines
        const linesResult = await db.query(
            `SELECT lf.*, i.codigo as impuesto_codigo, i.descripcion as impuesto_descripcion
       FROM linea_factura lf
       LEFT JOIN impuesto i ON lf.id_impuesto = i.id_impuesto
       WHERE lf.id_factura = $1
       ORDER BY lf.created_at ASC`,
            [id]
        );

        invoice.lineas = linesResult.rows;

        // Generate PDF
        const doc = generateInvoicePDF(invoice);

        // Set response headers
        const filename = `invoice_${invoice.serie || ''}${invoice.numero}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF to response
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Create invoice
router.post('/', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();

    try {
        const {
            numero, serie, fecha_emision, fecha_vencimiento,
            id_emisor, id_receptor, metodo_pago,
            lineas = []
        } = req.body;

        if (!numero || !fecha_emision || !id_emisor || !id_receptor) {
            return res.status(400).json({
                error: 'Number, issue date, issuer, and receiver are required'
            });
        }

        await client.query('BEGIN');

        // Calculate totals from lines
        let subtotal = 0;
        let impuestos_totales = 0;

        lineas.forEach(linea => {
            const lineSubtotal = parseFloat(linea.cantidad) * parseFloat(linea.precio_unitario);
            const lineImpuesto = parseFloat(linea.importe_impuesto || 0);
            subtotal += lineSubtotal;
            impuestos_totales += lineImpuesto;
        });

        const total = subtotal + impuestos_totales;

        // Create invoice
        const invoiceResult = await client.query(
            `INSERT INTO factura (
        numero, serie, fecha_emision, fecha_vencimiento,
        id_emisor, id_receptor, metodo_pago,
        subtotal, impuestos_totales, total, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'BORRADOR')
      RETURNING *`,
            [numero, serie, fecha_emision, fecha_vencimiento, id_emisor, id_receptor,
                metodo_pago, subtotal, impuestos_totales, total]
        );

        const invoice = invoiceResult.rows[0];

        // Create invoice lines
        const createdLines = [];
        for (const linea of lineas) {
            const lineResult = await client.query(
                `INSERT INTO linea_factura (
          id_factura, descripcion, cantidad, precio_unitario,
          porcentaje_impuesto, importe_impuesto, total_linea, id_impuesto
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
                [
                    invoice.id_factura, linea.descripcion, linea.cantidad, linea.precio_unitario,
                    linea.porcentaje_impuesto, linea.importe_impuesto, linea.total_linea, linea.id_impuesto
                ]
            );
            createdLines.push(lineResult.rows[0]);
        }

        // Log creation
        await client.query(
            `INSERT INTO log_factura (id_factura, accion, usuario)
       VALUES ($1, 'CREADA', $2)`,
            [invoice.id_factura, req.user.email]
        );

        await client.query('COMMIT');

        invoice.lineas = createdLines;
        res.status(201).json(invoice);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating invoice:', error);
        if (error.constraint === 'factura_unica') {
            return res.status(409).json({ error: 'Invoice number and series combination already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Update invoice
router.put('/:id', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { id } = req.params;
        const {
            numero, serie, fecha_emision, fecha_vencimiento,
            id_emisor, id_receptor, metodo_pago,
            subtotal, impuestos_totales, total
        } = req.body;

        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE factura 
       SET numero = $1, serie = $2, fecha_emision = $3, fecha_vencimiento = $4,
           id_emisor = $5, id_receptor = $6, metodo_pago = $7,
           subtotal = $8, impuestos_totales = $9, total = $10
       WHERE id_factura = $11
       RETURNING *`,
            [numero, serie, fecha_emision, fecha_vencimiento, id_emisor, id_receptor,
                metodo_pago, subtotal, impuestos_totales, total, id]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Log modification
        await client.query(
            `INSERT INTO log_factura (id_factura, accion, usuario)
       VALUES ($1, 'MODIFICADA', $2)`,
            [id, req.user.email]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating invoice:', error);
        if (error.constraint === 'factura_unica') {
            return res.status(409).json({ error: 'Invoice number and series combination already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Change invoice status
router.patch('/:id/estado', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { id } = req.params;
        const { estado } = req.body;

        const validEstados = ['BORRADOR', 'EMITIDA', 'ENVIADA', 'FIRMADA', 'REGISTRADA', 'RECHAZADA', 'PAGADA', 'CANCELADA'];
        if (!validEstados.includes(estado)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await client.query('BEGIN');

        const result = await client.query(
            'UPDATE factura SET estado = $1 WHERE id_factura = $2 RETURNING *',
            [estado, id]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invoice not found' });
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error changing invoice status:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Get invoice logs
router.get('/:id/logs', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM log_factura WHERE id_factura = $1 ORDER BY fecha DESC',
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching invoice logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete invoice
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM factura WHERE id_factura = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
