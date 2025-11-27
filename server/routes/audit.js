const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Max number of records
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of audit logs
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { action, userId, startDate, endDate, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT a.*, u.email as author_name, u.email as author_email
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (action) {
            query += ` AND a.action = $${paramCount}`;
            params.push(action);
            paramCount++;
        }

        if (userId) {
            query += ` AND a.user_id = $${paramCount}`;
            params.push(userId);
            paramCount++;
        }

        if (startDate) {
            query += ` AND a.created_at >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            query += ` AND a.created_at <= $${paramCount}`;
            params.push(endDate + ' 23:59:59'); // Include the whole end day
            paramCount++;
        }

        query += ` ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
