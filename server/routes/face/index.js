const express = require('express');
const router = express.Router();

// Import all face routes
const scanRoutes = require('./scan');
const certificatesRoutes = require('./certificates');
const invoiceRoutes = require('./invoices'); // Imports index.js from invoices folder
const catalogRoutes = require('../catalog'); // Shared catalog

// Register routes
router.use('/scan', scanRoutes);
router.use('/certificates', certificatesRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/catalog', catalogRoutes);

module.exports = router;
