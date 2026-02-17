const express = require('express');
const router = express.Router();

// Import all invoice routes
const emisorRoutes = require('./emisor');
const receptorRoutes = require('./receptor');
const impuestoRoutes = require('./impuesto');
const facturaRoutes = require('./factura');
const lineaFacturaRoutes = require('./linea_factura');
const adjuntoRoutes = require('./adjunto');

// Register routes
router.use('/emisores', emisorRoutes);
router.use('/receptores', receptorRoutes);
router.use('/impuestos', impuestoRoutes);
router.use('/facturas', facturaRoutes);
router.use('/facturas', lineaFacturaRoutes);
router.use('/facturas', adjuntoRoutes);

module.exports = router;
