const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/google_auth');
const passwordResetRoutes = require('./routes/password_reset');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', async (req, res) => {
    try {
        // Optional: Check DB connection
        await db.query('SELECT NOW()');
        res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
    }
});

app.get('/api/countries', async (req, res) => {
    try {
        const result = await db.query('SELECT id, code, name FROM countries ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching countries:', err);
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
