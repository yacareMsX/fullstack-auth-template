const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userRes = await db.query(
            `SELECT u.id, u.email, r.name as role, 
              p.first_name, p.last_name, p.phone, p.avatar_url
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
            [req.user.userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRes.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            avatarUrl: user.avatar_url,
            role: user.role
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint (optional - mainly client-side)
// This can be used for server-side token blacklisting if needed
router.post('/logout', authenticateToken, (req, res) => {
    // In a more advanced implementation, you could:
    // - Add token to a blacklist/redis
    // - Clear refresh tokens from database
    // For now, client-side token removal is sufficient
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
