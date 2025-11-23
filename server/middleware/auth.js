const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to authenticate JWT token
 * Expects token in Authorization header: "Bearer <token>"
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // Attach user data to request
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Optional middleware to authenticate but not require token
 * Useful for routes that work differently for authenticated users
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
        } catch (error) {
            // Token invalid, but we don't fail - just continue without user
            req.user = null;
        }
    }

    next();
}

module.exports = {
    authenticateToken,
    optionalAuth
};
