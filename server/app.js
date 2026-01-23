const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/google_auth');
const passwordResetRoutes = require('./routes/password_reset');
const userRoutes = require('./routes/user');
const invoiceRoutes = require('./routes/invoices');
const catalogRoutes = require('./routes/catalog');
const workflowRoutes = require('./routes/workflows');
const scanRoutes = require('./routes/scan');
const invoiceCountriesRoutes = require('./routes/invoice_countries');
const origenesRoutes = require('./routes/admin/origenes');
const certificatesRoutes = require('./routes/certificates');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

const app = express();

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use('/api', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/user', userRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/invoice-countries', invoiceCountriesRoutes);
app.use('/api/admin/origenes', origenesRoutes);
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/roles', require('./routes/admin/roles'));
app.use('/api/admin/auth-objects', require('./routes/admin/auth_objects'));
app.use('/api/admin/rol-profiles', require('./routes/admin/rol_profiles'));
app.use('/api/statutory/models', require('./routes/statutory/models'));
app.use('/api/certificates', certificatesRoutes);
app.use('/api/audit', require('./routes/audit'));

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

module.exports = app;
