const PDFDocument = require('pdfkit');

/**
 * Generate PDF for an invoice
 * @param {Object} invoice - Invoice data with all details
 * @returns {PDFDocument} - PDF document stream
 */
function generateInvoicePDF(invoice) {
    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice Info
    doc.fontSize(10);
    doc.text(`Invoice Number: ${invoice.serie || ''}${invoice.numero}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.fecha_emision).toLocaleDateString()}`, { align: 'right' });
    if (invoice.fecha_vencimiento) {
        doc.text(`Due Date: ${new Date(invoice.fecha_vencimiento).toLocaleDateString()}`, { align: 'right' });
    }
    doc.text(`Status: ${invoice.estado}`, { align: 'right' });
    doc.moveDown(2);

    // Issuer Info
    doc.fontSize(12).text('From:', { underline: true });
    doc.fontSize(10);
    doc.text(invoice.emisor_nombre || 'N/A');
    doc.text(invoice.emisor_nif || '');
    doc.text(invoice.emisor_direccion || '');
    doc.text(invoice.emisor_email || '');
    doc.text(invoice.emisor_telefono || '');
    doc.moveDown();

    // Receiver Info
    doc.fontSize(12).text('To:', { underline: true });
    doc.fontSize(10);
    doc.text(invoice.receptor_nombre || 'N/A');
    doc.text(invoice.receptor_nif || '');
    doc.text(invoice.receptor_direccion || '');
    doc.text(invoice.receptor_email || '');
    doc.text(invoice.receptor_telefono || '');
    doc.moveDown(2);

    // Line Items Table
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 250;
    const priceX = 320;
    const taxX = 390;
    const totalX = 460;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', itemX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Price', priceX, tableTop);
    doc.text('Tax', taxX, tableTop);
    doc.text('Total', totalX, tableTop);

    doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table Rows
    doc.font('Helvetica');
    let currentY = tableTop + 25;

    (invoice.lineas || []).forEach((line) => {
        doc.text(line.descripcion || '', itemX, currentY, { width: 190 });
        doc.text(line.cantidad?.toString() || '0', qtyX, currentY);
        doc.text(`€${parseFloat(line.precio_unitario || 0).toFixed(2)}`, priceX, currentY);
        doc.text(`${line.porcentaje_impuesto || 0}%`, taxX, currentY);
        doc.text(`€${parseFloat(line.total_linea || 0).toFixed(2)}`, totalX, currentY);
        currentY += 25;
    });

    doc.moveDown(2);

    // Totals
    const totalsX = 400;
    doc.fontSize(10);
    doc.text(`Subtotal:`, totalsX, currentY);
    doc.text(`€${parseFloat(invoice.subtotal || 0).toFixed(2)}`, totalX, currentY, { align: 'right' });
    currentY += 20;

    doc.text(`Taxes:`, totalsX, currentY);
    doc.text(`€${parseFloat(invoice.impuestos_totales || 0).toFixed(2)}`, totalX, currentY, { align: 'right' });
    currentY += 20;

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`TOTAL:`, totalsX, currentY);
    doc.text(`€${parseFloat(invoice.total || 0).toFixed(2)}`, totalX, currentY, { align: 'right' });

    // Payment Method
    if (invoice.metodo_pago) {
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Payment Method: ${invoice.metodo_pago}`);
    }

    // Footer
    doc.fontSize(8).text(
        `Generated on ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
    );

    return doc;
}

module.exports = { generateInvoicePDF };
