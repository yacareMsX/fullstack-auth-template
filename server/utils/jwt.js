const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT token for user
 * @param {number} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} JWT token
 */
function generateToken(userId, email, role) {
    const payload = {
        userId,
        email,
        role
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Get token expiration time in seconds
 * @returns {number} Expiration time in seconds
 */
function getTokenExpirationTime() {
    const expiresIn = JWT_EXPIRES_IN;

    // Parse time string (e.g., "24h", "7d", "60s")
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // Default 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
        's': 1,
        'm': 60,
        'h': 3600,
        'd': 86400
    };

    return value * (multipliers[unit] || 3600);
}

module.exports = {
    generateToken,
    verifyToken,
    getTokenExpirationTime
};
