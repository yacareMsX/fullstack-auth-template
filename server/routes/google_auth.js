const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { generateToken, getTokenExpirationTime } = require('../utils/jwt');

const router = express.Router();

router.post('/google', async (req, res) => {
  const { token } = req.body;

  try {
    // 1. Fetch User Info from Google using the Access Token
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const payload = await googleResponse.json();
    const { email, given_name, family_name, picture, sub: googleId } = payload;

    // 2. Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    let user;
    if (userResult.rows.length > 0) {
      // User exists - Log them in
      user = userResult.rows[0];
      // Optional: Update google_id if not set?
    } else {
      // User does not exist - Create new user
      // We need a password for the DB constraint, so generate a random one
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Transaction to create user and profile
      const clientDb = await db.pool.connect();
      try {
        await clientDb.query('BEGIN');

        const newUserResult = await clientDb.query(
          'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
          [email, hashedPassword, 'user']
        );
        user = newUserResult.rows[0];

        await clientDb.query(
          'INSERT INTO profiles (user_id, first_name, last_name, avatar_url) VALUES ($1, $2, $3, $4)',
          [user.id, given_name, family_name || '', picture]
        );

        await clientDb.query('COMMIT');
      } catch (err) {
        await clientDb.query('ROLLBACK');
        throw err;
      } finally {
        clientDb.release();
      }
    }

    // 3. Return session/success (In a real app, issue a JWT here)
    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role || 'user');
    const expiresIn = getTokenExpirationTime();

    res.json({
      message: 'Login successful',
      token,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        name: given_name
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ error: 'Invalid Google Token' });
  }
});

module.exports = router;
