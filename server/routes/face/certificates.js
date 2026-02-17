const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');
const router = express.Router();
const multer = require('multer');
const forge = require('node-forge');
const crypto = require('crypto');
const fs = require('fs');

// Configure upload
const upload = multer({ storage: multer.memoryStorage() });

// Encryption Configuration
const ALGORITHM = 'aes-256-gcm';
// Ensure we have a consistent key (in production, use a secure env var)
const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'fallback-secret', 'salt', 32);

function encryptBuffer(buffer) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        iv: iv.toString('hex'),
        content: Buffer.concat([encrypted, authTag]).toString('hex') // Store tag with content or separately? Let's append
        // Actually, for GCM, we need authTag to decrypt. 
        // Let's store authTag as part of encrypted string: encrypted + authTag
    };
}

// Helper to properly handle GCM Auth Tag
function encrypt(buffer) {
    const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        iv: iv.toString('hex'),
        // Store as hex: encrypted + authTag
        encryptedData: Buffer.concat([encrypted, authTag]).toString('hex')
    };
}

// Get all certificates
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, offset = 0, search } = req.query;
        // Do NOT retrieve encrypted_p12 or iv in list view for performance/security
        let query = 'SELECT id, acronimo, filename, cn, created_date, expiry_date, active, created_at, updated_at FROM certificates WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (search) {
            query += ` AND (filename ILIKE $${paramCount} OR cn ILIKE $${paramCount} OR acronimo ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get certificate by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Don't return encrypted blob to frontend unless download requested? 
        // For now, exclude encrypted_p12 and iv from detail view too, only metadata needed.
        const result = await db.query('SELECT id, acronimo, filename, cn, created_date, expiry_date, chain, active, created_at, updated_at FROM certificates WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create certificate (Upload P12)
router.post('/', authenticateToken, upload.single('p12File'), async (req, res) => {
    try {
        const { acronimo, password } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No P12 file uploaded' });
        }
        if (!acronimo) {
            return res.status(400).json({ error: 'Acronimo is required' });
        }

        // 1. Parse P12 to validate and extract metadata
        const p12Buffer = file.buffer;
        let p12Asn1;
        let p12;

        try {
            // node-forge expects binary string (not Buffer) for fromAsn1 if using asn1
            // or we can use pkcs12.pkcs12FromAsn1
            const p12Der = p12Buffer.toString('binary');
            p12Asn1 = forge.asn1.fromDer(p12Der);
            p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || ''); // Password might be empty for reading structure if not encrypted? 
            // Usually P12s require password to unlock bags.
            // If password strict check fails, it throws.
        } catch (parseErr) {
            console.error('Error parsing P12:', parseErr);
            return res.status(400).json({ error: 'Invalid P12 file or wrong password' });
        }

        // 2. Extract Certificate Data
        let certBag = null;
        let chain = [];

        // Helper to loop bags
        const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
        if (bags[forge.pki.oids.certBag]) {
            const certBags = bags[forge.pki.oids.certBag];
            // Sort or find the leaf? Typically localKeyId matches key bag.
            // For now, assume first or try to find one with private key match (complex).
            // Let's assume the first one is the leaf or collecting all for chain.
            certBag = certBags[0];

            // Build chain string
            chain = certBags.map(bag => {
                const cert = bag.cert;
                return `Subject: ${cert.subject.attributes.map(a => a.value).join(', ')} | Issuer: ${cert.issuer.attributes.map(a => a.value).join(', ')}`;
            });
        }

        if (!certBag) {
            return res.status(400).json({ error: 'No certificate found in P12' });
        }

        const cert = certBag.cert;
        const cnAttr = cert.subject.attributes.find(attr => attr.name === 'commonName');
        const cn = cnAttr ? cnAttr.value : 'Unknown CN';
        const createdDate = cert.validity.notBefore;
        const expiryDate = cert.validity.notAfter;

        // 3. Encrypt file for storage
        const { iv, encryptedData } = encrypt(p12Buffer);

        // 4. Save to DB
        const result = await db.query(
            `INSERT INTO certificates (acronimo, filename, cn, created_date, expiry_date, chain, encrypted_p12, iv, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
             RETURNING id, acronimo, filename, cn, created_date, expiry_date, active`,
            [acronimo, file.originalname, cn, createdDate, expiryDate, JSON.stringify(chain), encryptedData, iv]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error creating certificate:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Update certificate (Likely only acronimo, active. P12 update would be a re-upload scenario or better delete/create)
// Let's allow updating acronimo and active state.
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { acronimo, active } = req.body;

        const result = await db.query(
            `UPDATE certificates 
             SET acronimo = COALESCE($1, acronimo),
                 active = COALESCE($2, active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, acronimo, filename, cn, created_date, expiry_date, active`,
            [acronimo, active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Toggle active status
router.put('/:id/active', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;

        if (typeof active !== 'boolean') {
            return res.status(400).json({ error: 'Active status must be a boolean' });
        }

        const result = await db.query(
            `UPDATE certificates 
             SET active = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, acronimo, active`,
            [active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating certificate status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete certificate
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM certificates WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
