const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');
const upload = require('../../utils/file-upload');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Get invoice attachments
router.get('/:id_factura/adjuntos', authenticateToken, async (req, res) => {
    try {
        const { id_factura } = req.params;

        const result = await db.query(
            'SELECT * FROM adjunto WHERE id_factura = $1 ORDER BY created_at DESC',
            [id_factura]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching attachments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload attachment
router.post('/:id_factura/adjuntos', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { id_factura } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { filename, originalname, mimetype, path: filePath } = req.file;

        // Store relative path
        const url = `/uploads/invoices/${filename}`;

        const result = await db.query(
            `INSERT INTO adjunto (id_factura, filename, tipo, url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [id_factura, originalname, mimetype, url]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error uploading attachment:', error);
        // Clean up uploaded file if database insert fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download attachment
router.get('/adjuntos/:id/download', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM adjunto WHERE id_adjunto = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        const attachment = result.rows[0];
        const filePath = path.join(__dirname, '../../', attachment.url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(filePath, attachment.filename);
    } catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete attachment
router.delete('/adjuntos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM adjunto WHERE id_adjunto = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        const attachment = result.rows[0];
        const filePath = path.join(__dirname, '../../', attachment.url);

        // Delete physical file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
