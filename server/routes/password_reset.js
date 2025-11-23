const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

// Request password reset
router.post('/request', async (req, res) => {
    const { email } = req.body;

    try {
        // Always return success to prevent email enumeration
        // Check if user exists
        const userResult = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            // User doesn't exist, but return success anyway
            return res.json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        const user = userResult.rows[0];

        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Set expiration to 1 hour from now
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Save token to database
        await db.query(
            'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [user.id, tokenHash, expiresAt]
        );

        // Send email
        try {
            await sendPasswordResetEmail(user.email, token);
        } catch (emailError) {
            console.error('Email sending failed, but continuing:', emailError);
            // Don't fail the request if email fails - token is still valid
        }

        res.json({
            message: 'If an account with that email exists, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
});

// Reset password with token
router.post('/reset', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        // Hash the provided token to compare with database
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid token
        const tokenResult = await db.query(
            `SELECT prt.id, prt.user_id, prt.expires_at, prt.used 
       FROM password_reset_tokens prt
       WHERE prt.token_hash = $1 
       AND prt.used = FALSE 
       AND prt.expires_at > NOW()`,
            [tokenHash]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const resetToken = tokenResult.rows[0];

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and mark token as used in a transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                'UPDATE users SET password_hash = $1 WHERE id = $2',
                [hashedPassword, resetToken.user_id]
            );

            await client.query(
                'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
                [resetToken.id]
            );

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        res.json({ message: 'Password reset successful. You can now login with your new password.' });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
});

module.exports = router;
