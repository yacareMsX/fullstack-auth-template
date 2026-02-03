const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const { parseFacturaE } = require('../utils/facturaeParser');
const { logAction } = require('../utils/audit');

// ... inside the route ...



/**
 * @swagger
 * /api/integrations/sap/invoice:
 *   post:
 *     summary: Receive invoice from SAP
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [process_id, xml_content]
 *             properties:
 *               process_id:
 *                 type: string
 *                 description: Unique process ID from SAP
 *               xml_content:
 *                 type: string
 *                 description: Base64 encoded FacturaE XML
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Invalid parameters or XML
 *       409:
 *         description: Duplicate process ID
 */
router.post('/invoice', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { process_id, xml_content, timestamp } = req.body;

        if (!process_id || !xml_content) {
            return res.status(400).json({ error: 'Missing required parameters: process_id, xml_content' });
        }

        // 1. Decode XML
        let xmlString;
        try {
            xmlString = Buffer.from(xml_content, 'base64').toString('utf-8');
        } catch (e) {
            return res.status(400).json({ error: 'Invalid Base64 content' });
        }

        // Save Original XML
        const filename = `sap_${process_id}_${Date.now()}.xml`;
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, xmlString);
        const dbXmlPath = `uploads/${filename}`;

        // 2. Parse XML
        let parsedData;
        try {
            parsedData = parseFacturaE(xmlString);
        } catch (e) {
            console.error('XML Parsing Error:', e);
            return res.status(400).json({ error: 'Failed to parse FacturaE XML: ' + e.message });
        }

        const {
            numero, serie, fecha_emision, emisor, receptor,
            total, subtotal, impuestos, lineas
        } = parsedData;

        await client.query('BEGIN');

        // 3. Ensure SAP Origin exists and get ID
        let originId = 1; // Default Manual
        const originRes = await client.query("SELECT id_origen FROM origenes WHERE descripcion = 'SAP'");
        if (originRes.rows.length > 0) {
            originId = originRes.rows[0].id_origen;
        } else {
            // Fallback if migration failed (should not happen)
            console.warn("SAP origin not found, using default");
        }

        // 4. Handle Emisor (Issuer)
        let emisorId;
        const emisorRes = await client.query("SELECT id_emisor FROM emisor WHERE nif = $1", [emisor.nif]);
        if (emisorRes.rows.length > 0) {
            emisorId = emisorRes.rows[0].id_emisor;
        } else {
            const newEmisor = await client.query(
                "INSERT INTO emisor (nombre, nif, direccion) VALUES ($1, $2, $3) RETURNING id_emisor",
                [emisor.name, emisor.nif, emisor.address]
            );
            emisorId = newEmisor.rows[0].id_emisor;
        }

        // 5. Handle Receptor (Receiver)
        let receptorId;
        const receptorRes = await client.query("SELECT id_receptor FROM receptor WHERE nif = $1", [receptor.nif]);
        if (receptorRes.rows.length > 0) {
            receptorId = receptorRes.rows[0].id_receptor;
        } else {
            const newReceptor = await client.query(
                "INSERT INTO receptor (nombre, nif, direccion) VALUES ($1, $2, $3) RETURNING id_receptor",
                [receptor.name, receptor.nif, receptor.address]
            );
            receptorId = newReceptor.rows[0].id_receptor;
        }

        // 6. Create Invoice
        // Check duplication by external_process_id
        const dupCheck = await client.query("SELECT id_factura FROM factura WHERE external_process_id = $1", [process_id]);
        if (dupCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'Invoice already processed',
                invoice_id: dupCheck.rows[0].id_factura
            });
        }

        const insertQuery = `
            INSERT INTO factura (
                numero, serie, fecha_emision, 
                id_emisor, id_receptor, id_origen,
                subtotal, impuestos_totales, total,
                external_process_id, estado, tipo, codigo_tipo,
                invoice_country_id, xml_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $13, 'ISSUE', '01', $11, $12)
            RETURNING id_factura
        `;

        // Note: Defaulting to 'BORRADOR' and 'ISSUE' (01). Adjust if needed based on XML.
        // FacturaE is typically emitted invoices.

        try {
            const invoiceRes = await client.query(insertQuery, [
                numero, serie, fecha_emision,
                emisorId, receptorId, originId,
                subtotal, impuestos, total,
                process_id, 1, // Default to Spain (1)
                dbXmlPath,
                initialStatus
            ]);
            const invoiceId = invoiceRes.rows[0].id_factura;

            // 7. Insert Lines
            for (const line of lineas) {
                // Find or default tax?
                // For simplicity, we just insert the line data. 
                // We might need to look up tax ID by percentage if strict FK used.
                // In linea_factura.js Schema: id_impuesto UUID REFERENCES impuesto(id_impuesto)
                // We need to resolve id_impuesto.

                let impuestoId = null;
                if (line.porcentaje_impuesto !== undefined) {
                    // Try to find matching tax
                    const taxRes = await client.query(
                        "SELECT id_impuesto FROM impuesto WHERE porcentaje = $1 LIMIT 1",
                        [line.porcentaje_impuesto]
                    );
                    if (taxRes.rows.length > 0) {
                        impuestoId = taxRes.rows[0].id_impuesto;
                    }
                }

                await client.query(
                    `INSERT INTO linea_factura (
                        id_factura, descripcion, cantidad, precio_unitario, 
                        total_linea, porcentaje_impuesto, importe_impuesto, id_impuesto
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        invoiceId, line.descripcion, line.cantidad, line.precio_unitario,
                        line.total_linea, line.porcentaje_impuesto, line.importe_impuesto, impuestoId
                    ]
                );
            }

            await client.query('COMMIT');

            // Log action
            logAction(req.user.userId, 'IMPORT_SAP_INVOICE', 'INVOICE', invoiceId, { process_id }, req.ip);

            res.status(201).json({
                success: true,
                invoice_id: invoiceId,
                message: 'Invoice imported successfully from SAP'
            });

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError; // Handle in outer catch
        }

    } catch (error) {
        if (client) await client.query('ROLLBACK'); // Safety
        console.error('Error importing SAP invoice:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        if (client) client.release();
    }
});

module.exports = router;
