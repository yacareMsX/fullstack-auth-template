const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

/**
 * @swagger
 * /api/admin/rol-profiles:
 *   get:
 *     summary: List all role profiles
 *     tags: [Admin, Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of profiles
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM rol_profiles WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }

        query += ' ORDER BY id ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error listing profiles:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/rol-profiles/{id}:
 *   get:
 *     summary: Get profile details including assigned auth objects
 *     tags: [Admin, Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profile details
 */
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const profileResult = await db.query('SELECT * FROM rol_profiles WHERE id = $1', [id]);
        if (profileResult.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const profile = profileResult.rows[0];

        // Fetch assigned auth objects
        const authObjectsResult = await db.query(
            `SELECT auth_object_id FROM rol_profile_auth_objects WHERE profile_id = $1`,
            [id]
        );
        profile.auth_object_ids = authObjectsResult.rows.map(row => row.auth_object_id);

        res.json(profile);
    } catch (err) {
        console.error('Error fetching profile details:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/admin/rol-profiles:
 *   post:
 *     summary: Create a new profile
 *     tags: [Admin, Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               auth_object_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Profile created
 */
router.post('/', authenticateToken, async (req, res) => {
    const { name, description, auth_object_ids } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check duplicates
        const check = await client.query('SELECT id FROM rol_profiles WHERE name = $1', [name]);
        if (check.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Profile with this name already exists' });
        }

        // Insert Profile
        const result = await client.query(
            'INSERT INTO rol_profiles (name, description) VALUES ($1, $2) RETURNING id',
            [name, description]
        );
        const profileId = result.rows[0].id;

        // Insert Auth Objects associations
        if (Array.isArray(auth_object_ids) && auth_object_ids.length > 0) {
            // Validate all IDs exist? For now, assume FK constraint handles it, but safer to loop
            // Construct multi-row insert or loop
            for (const authId of auth_object_ids) {
                await client.query(
                    'INSERT INTO rol_profile_auth_objects (profile_id, auth_object_id) VALUES ($1, $2)',
                    [profileId, authId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Profile created', id: profileId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating profile:', err);
        res.status(500).json({ error: 'Internal server error: ' + err.message });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/admin/rol-profiles/{id}:
 *   put:
 *     summary: Update a profile
 *     tags: [Admin, Profiles]
 *     security:
 *       - bearerAuth: []
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               auth_object_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, auth_object_ids } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check duplicates
        const check = await client.query('SELECT id FROM rol_profiles WHERE name = $1 AND id != $2', [name, id]);
        if (check.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Profile with this name already exists' });
        }

        // Update Profile
        const result = await client.query(
            'UPDATE rol_profiles SET name = $1, description = $2 WHERE id = $3 RETURNING id',
            [name, description, id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Update Auth Objects: Delete all existing, insert new
        if (auth_object_ids !== undefined) { // Only update if provided
            await client.query('DELETE FROM rol_profile_auth_objects WHERE profile_id = $1', [id]);

            if (Array.isArray(auth_object_ids) && auth_object_ids.length > 0) {
                for (const authId of auth_object_ids) {
                    await client.query(
                        'INSERT INTO rol_profile_auth_objects (profile_id, auth_object_id) VALUES ($1, $2)',
                        [id, authId]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Profile updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Internal server error: ' + err.message });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/admin/rol-profiles/{id}:
 *   delete:
 *     summary: Delete a profile
 *     tags: [Admin, Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profile deleted
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Cascade delete is configured in DB for relations, so simple delete works
        const result = await db.query('DELETE FROM rol_profiles WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ message: 'Profile deleted' });
    } catch (err) {
        if (err.code === '23503') { // Foreign key violation (e.g. assigned to roles)
            return res.status(409).json({ error: 'Cannot delete profile: It is assigned to roles.' });
        }
        console.error('Error deleting profile:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
