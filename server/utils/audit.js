const db = require('../db');

/**
 * Logs a user action to the audit_logs table.
 * 
 * @param {number} userId - The ID of the user performing the action (can be null for system actions or failed logins if user unknown)
 * @param {string} action - The action code (e.g., 'LOGIN', 'CREATE_INVOICE')
 * @param {string} entityType - The type of entity affected (e.g., 'AUTH', 'INVOICE')
 * @param {string|number} entityId - The ID of the entity affected (optional)
 * @param {object|string} details - Additional details about the action (optional)
 * @param {string} ipAddress - The IP address of the user (optional)
 */
const logAction = async (userId, action, entityType, entityId = null, details = null, ipAddress = null) => {
    try {
        const query = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        // Ensure details is a JSON string or object suitable for JSONB
        const detailsJson = details ? JSON.stringify(details) : null;

        await db.query(query, [userId, action, entityType, entityId, detailsJson, ipAddress]);
        console.log(`[AUDIT] Action logged: ${action} by User ${userId}`);
    } catch (err) {
        console.error('[AUDIT] Failed to log action:', err);
        // We don't throw here to avoid blocking the main operation if logging fails
    }
};

module.exports = {
    logAction
};
