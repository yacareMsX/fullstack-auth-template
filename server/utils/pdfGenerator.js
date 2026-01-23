const PDFDocument = require('pdfkit');

/**
 * Adds strict XMP metadata for Factur-X/ZUGFeRD compliance
 * @param {PDFDocument} doc 
 */
function addFacturXMetadata(doc) {
    const metadata = `
        <?xpacket begin="&#xFEFF;" id="W5M0MpCehiHzreSzNTczkc9d"?>
        <x:xmpmeta xmlns:x="adobe:ns:meta/">
            <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
                    <pdfaExtension:schemas>
                        <rdf:Bag>
                            <rdf:li rdf:parseType="Resource">
                                <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
                                <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
                                <pdfaSchema:prefix>fx</pdfaSchema:prefix>
                                <pdfaSchema:property>
                                    <rdf:Seq>
                                        <rdf:li rdf:parseType="Resource">
                                            <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                                            <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                                            <pdfaProperty:category>external</pdfaProperty:category>
                                            <pdfaProperty:description>The name of the embedded XML invoice file</pdfaProperty:description>
                                        </rdf:li>
                                        <rdf:li rdf:parseType="Resource">
                                            <pdfaProperty:name>DocumentType</pdfaProperty:name>
                                            <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                                            <pdfaProperty:category>external</pdfaProperty:category>
                                            <pdfaProperty:description>The document type</pdfaProperty:description>
                                        </rdf:li>
                                        <rdf:li rdf:parseType="Resource">
                                            <pdfaProperty:name>Version</pdfaProperty:name>
                                            <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                                            <pdfaProperty:category>external</pdfaProperty:category>
                                            <pdfaProperty:description>The Factur-X version</pdfaProperty:description>
                                        </rdf:li>
                                        <rdf:li rdf:parseType="Resource">
                                            <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                                            <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                                            <pdfaProperty:category>external</pdfaProperty:category>
                                            <pdfaProperty:description>The conformance level</pdfaProperty:description>
                                        </rdf:li>
                                    </rdf:Seq>
                                </pdfaSchema:property>
                            </rdf:li>
                        </rdf:Bag>
                    </pdfaExtension:schemas>
                </rdf:Description>
                <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
                    <fx:DocumentType>INVOICE</fx:DocumentType>
                    <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
                    <fx:Version>1.0</fx:Version>
                    <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
                </rdf:Description>
                <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
                    <pdfaid:part>3</pdfaid:part>
                    <pdfaid:conformance>B</pdfaid:conformance>
                </rdf:Description>
            </rdf:RDF>
        </x:xmpmeta>
        <?xpacket end="w"?>
    `.trim();

    // Inject Metadata
    try {
        const metadataStream = doc.ref({
            Type: 'Metadata',
            Subtype: 'XML'
        });

        metadataStream.end(Buffer.from(metadata));

        // Link to Catalog
        doc._root.data.Metadata = metadataStream;

    } catch (e) {
        console.error("Error injecting metadata:", e);
    }
}

/**
 * Generate PDF for an invoice
 * @param {Object} invoice - Invoice data with all details
 * @returns {PDFDocument} - PDF document stream
 */
function generateInvoicePDF(invoice) {
    if (!invoice) throw new Error("No invoice data provided");
    const doc = new PDFDocument({
        margin: 50,
        pdfVersion: '1.7', // Required for PDF/A-3
        lang: 'en',
        tagged: true, // Required for PDF/A
        displayTitle: true
    });

    console.log(`Generating PDF for invoice: ${invoice.numero}`);

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

/**
 * Generate Factur-X PDF (PDF with embedded XML)
 * @param {Object} invoice - Invoice data
 * @param {string} xmlContent - UBL 2.1 XML content
 * @returns {PDFDocument} - PDF document stream
 */
function generateFacturX(invoice, xmlContent) {
    if (!xmlContent) {
        console.warn("Factur-X generation without XML content");
        return generateInvoicePDF(invoice);
    }

    // Use generateInvoicePDF which now returns a PDF 1.7 doc
    const doc = generateInvoicePDF(invoice);

    // Embed the XML file
    doc.file(Buffer.from(xmlContent), {
        name: 'factur-x.xml',
        type: 'application/xml',
        description: 'Factur-X/ZUGFeRD e-invoice data',
        relationship: 'Alternative', // PDF/A-3 Requirement
        creationDate: new Date(),
        modifiedDate: new Date()
    });

    // Add XMP Metadata
    addFacturXMetadata(doc);

    return doc;
}

module.exports = { generateInvoicePDF, generateFacturX };
