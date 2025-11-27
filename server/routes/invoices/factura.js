
const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');
const { logAction } = require('../../utils/audit');
const router = express.Router();

// Get all invoices with filters
/**
 * @swagger
 * /api/invoices/facturas:
 *   get:
 *     summary: Retrieve a list of invoices
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [ISSUE, RECEIPT]
 *         description: Type of invoice (ISSUE or RECEIPT)
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filter by status (e.g., PENDIENTE, PAGADA)
 *     responses:
 *       200:
 *         description: A list of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_factura:
 *                     type: integer
 *                   numero:
 *                     type: string
 *                   total:
 *                     type: number
 *                   estado:
 *                     type: string
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { estado, tipo, id_emisor, id_receptor, fecha_desde, fecha_hasta, limit = 50, offset = 0 } = req.query;

        let query = `
      SELECT f.*,
    e.nombre as emisor_nombre,
    r.nombre as receptor_nombre,
    o.descripcion as origen_descripcion
      FROM factura f
      JOIN emisor e ON f.id_emisor = e.id_emisor
      JOIN receptor r ON f.id_receptor = r.id_receptor
      LEFT JOIN origenes o ON f.id_origen = o.id_origen
      WHERE 1 = 1
    `;
        const params = [];
        let paramCount = 1;

        if (tipo) {
            // Map legacy tipo to codigo_tipo
            let codigoTipo = tipo;
            if (tipo === 'ISSUE') codigoTipo = '01';
            if (tipo === 'RECEIPT') codigoTipo = '02';

            query += ` AND f.codigo_tipo = $${paramCount} `;
            params.push(codigoTipo);
            paramCount++;
        }

        if (estado) {
            query += ` AND f.estado = $${paramCount} `;
            params.push(estado);
            paramCount++;
        }

        if (id_emisor) {
            query += ` AND f.id_emisor = $${paramCount} `;
            params.push(id_emisor);
            paramCount++;
        }

        if (id_receptor) {
            query += ` AND f.id_receptor = $${paramCount} `;
            params.push(id_receptor);
            paramCount++;
        }

        if (fecha_desde) {
            query += ` AND f.fecha_emision >= $${paramCount} `;
            params.push(fecha_desde);
            paramCount++;
        }

        if (fecha_hasta) {
            query += ` AND f.fecha_emision <= $${paramCount} `;
            params.push(fecha_hasta);
            paramCount++;
        }

        query += ` ORDER BY f.fecha_emision DESC, f.numero DESC LIMIT $${paramCount} OFFSET $${paramCount + 1} `;
        params.push(limit, offset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        require('fs').writeFileSync('error.log', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
        res.setHeader('Content-Disposition', `attachment; filename = "${filename}"`);

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
            id_emisor, id_receptor, metodo_pago, codigo_tipo, id_origen,
            lineas = []
        } = req.body;

        const missingFields = [];
        if (!numero) missingFields.push('numero');
        if (!fecha_emision) missingFields.push('fecha_emision');
        if (!id_emisor) missingFields.push('id_emisor');
        if (!id_receptor) missingFields.push('id_receptor');
        if (!codigo_tipo) missingFields.push('codigo_tipo');

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')} `
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
            `INSERT INTO factura(
        numero, serie, fecha_emision, fecha_vencimiento,
        id_emisor, id_receptor, metodo_pago, codigo_tipo, id_origen,
        subtotal, impuestos_totales, total, estado
    ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'BORRADOR')
RETURNING * `,
            [numero, serie, fecha_emision, fecha_vencimiento, id_emisor, id_receptor,
                metodo_pago, codigo_tipo, id_origen || 1, subtotal, impuestos_totales, total]
        );

        const invoice = invoiceResult.rows[0];

        // Create invoice lines
        const createdLines = [];
        for (const linea of lineas) {
            const lineResult = await client.query(
                `INSERT INTO linea_factura(
    id_factura, descripcion, cantidad, precio_unitario,
    porcentaje_impuesto, importe_impuesto, total_linea, id_impuesto
) VALUES($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING * `,
                [
                    invoice.id_factura, linea.descripcion, linea.cantidad, linea.precio_unitario,
                    linea.porcentaje_impuesto, linea.importe_impuesto, linea.total_linea, linea.id_impuesto
                ]
            );
            createdLines.push(lineResult.rows[0]);
        }

        // Log creation
        await client.query(
            `INSERT INTO log_factura(id_factura, accion, usuario)
VALUES($1, 'CREADA', $2)`,
            [invoice.id_factura, req.user.email]
        );

        await client.query('COMMIT');

        // Log to system audit
        try {
            await logAction(req.user.userId, 'CREATE_INVOICE', 'INVOICE', invoice.id_factura, { numero: invoice.numero, total: invoice.total }, req.ip);
        } catch (logErr) {
            console.error('Failed to log invoice creation:', logErr);
        }

        invoice.lineas = createdLines;
        res.status(201).json(invoice);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating invoice:', error);
        if (error.constraint === 'factura_unica') {
            return res.status(409).json({ error: 'Invoice number and series combination already exists' });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        client.release();
    }
});

/**
         * @swagger
         * /api/invoices/facturas:
         *   post:
         *     summary: Create a new invoice
         *     tags: [Invoices]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [numero, fecha_emision, id_emisor, id_receptor]
         *             properties:
         *               numero:
         *                 type: string
         *               fecha_emision:
         *                 type: string
         *                 format: date
         *               total:
         *                 type: number
         *     responses:
         *       201:
         *         description: Invoice created successfully
         */
router.post('/facturas', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const {
            numero, fecha_emision, fecha_vencimiento,
            id_emisor, id_receptor, id_origen,
            moneda, subtotal, impuestos, total,
            estado, notas, items
        } = req.body;

        // Insert Invoice
        const invoiceRes = await client.query(
            `INSERT INTO factura (
        numero, fecha_emision, fecha_vencimiento,
        id_emisor, id_receptor, id_origen,
        moneda, subtotal, impuestos, total,
        estado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id_factura`,
            [
                numero, fecha_emision, fecha_vencimiento,
                id_emisor, id_receptor, id_origen,
                moneda, subtotal, impuestos, total,
                estado || 'PENDIENTE', notas
            ]
        );
        const invoiceId = invoiceRes.rows[0].id_factura;

        // Insert Items
        if (items && items.length > 0) {
            for (const item of items) {
                await client.query(
                    `INSERT INTO linea_factura (
            id_factura, descripcion, cantidad,
            precio_unitario, subtotal, tasa_impuesto, total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        invoiceId, item.descripcion, item.cantidad,
                        item.precio_unitario, item.subtotal, item.tasa_impuesto, item.total
                    ]
                );
            }
        }

        await client.query('COMMIT');

        // Log creation
        logAction(req.user.id, 'CREATE_INVOICE', 'INVOICE', invoiceId, { numero, total }, req.ip);

        res.status(201).json({ message: 'Invoice created successfully', id: invoiceId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating invoice:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/invoices/facturas/{id}:
 *   put:
 *     summary: Update an invoice
 *     tags: [Invoices]
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
 *               estado:
 *                 type: string
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 */
router.put('/:id', authenticateToken, async (req, res) => {
    // Simplified update (full update logic is complex)
    try {
        const { id } = req.params;
        const { estado, notas } = req.body;

        await db.query(
            'UPDATE factura SET estado = COALESCE($1, estado), notas = COALESCE($2, notas) WHERE id_factura = $3',
            [estado, notas, id]
        );

        // Log update
        logAction(req.user.userId, 'UPDATE_INVOICE', 'INVOICE', id, { estado, notas }, req.ip);

        res.json({ message: 'Invoice updated successfully' });
    } catch (err) {
        console.error('Error updating invoice:', err);
        res.status(500).json({ error: 'Internal server error' });
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

        // Log status change
        logAction(req.user.userId, 'UPDATE_INVOICE_STATUS', 'INVOICE', id, { oldStatus: result.rows[0].estado, newStatus: estado }, req.ip);

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

/**
 * @swagger
 * /api/invoices/facturas/{id}:
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;

        // Delete items first (FK constraint)
        await client.query('DELETE FROM linea_factura WHERE id_factura = $1', [id]);

        // Delete invoice
        const result = await client.query('DELETE FROM factura WHERE id_factura = $1', [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invoice not found' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Invoice deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting invoice:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});
module.exports = router;
