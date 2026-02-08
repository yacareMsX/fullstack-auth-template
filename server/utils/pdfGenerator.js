const PDFDocument = require('pdfkit');

// Translations
const i18n = {
    es: {
        invoice: "FACTURA",
        invoiceNo: "Número de factura",
        date: "Fecha de emisión",
        seller: "Vendedor",
        buyer: "Comprador",
        vatId: "NIF:",
        address: "Dirección",
        contact: "Datos de contacto",
        details: "Detalles",
        description: "Descripción adicional",
        tableNo: "Nº",
        tableName: "Nombre del bien o servicio",
        tableQty: "Cant.",
        tableUnit: "Ud.",
        tablePrice: "Precio Un.",
        tableTax: "Impuesto",
        tableNet: "Importe Neto",
        totalNet: "Importe total neto:",
        taxSummary: "Resumen de impuestos",
        taxRate: "Tasa",
        netAmount: "Base Imponible",
        taxAmount: "Cuota Impuesto",
        grossAmount: "Importe Total",
        payment: "Pago",
        paymentMethod: "Forma de pago:",
        dueDate: "Fecha de vencimiento:",
        accountNo: "Número de cuenta",
        footer: "Este documento ha sido generado automáticamente."
    },
    en: {
        invoice: "INVOICE",
        invoiceNo: "Invoice Number",
        date: "Date of issue",
        seller: "Seller",
        buyer: "Buyer",
        vatId: "VAT ID:",
        address: "Address",
        contact: "Contact details",
        details: "Details",
        description: "Additional description",
        tableNo: "No.",
        tableName: "Item Name",
        tableQty: "Qty",
        tableUnit: "Unit",
        tablePrice: "Unit Price",
        tableTax: "Tax Rate",
        tableNet: "Net Amount",
        totalNet: "Total Net Amount:",
        taxSummary: "Tax Summary",
        taxRate: "Rate",
        netAmount: "Net Amount",
        taxAmount: "Tax Amount",
        grossAmount: "Gross Amount",
        payment: "Payment",
        paymentMethod: "Payment Method:",
        dueDate: "Due Date:",
        accountNo: "Account Number",
        footer: "This document was generated automatically."
    }
};

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

    try {
        const metadataStream = doc.ref({
            Type: 'Metadata',
            Subtype: 'XML'
        });
        metadataStream.end(Buffer.from(metadata));
        doc._root.data.Metadata = metadataStream;
    } catch (e) {
        console.error("Error injecting metadata:", e);
    }
}

/**
 * Generate PDF for an invoice
 * @param {Object} invoice - Invoice data
 * @param {string} lang - Language code ('es' or 'en')
 * @returns {PDFDocument} - PDF document stream
 */
function generateInvoicePDF(invoice, lang = 'es') {
    if (!invoice) throw new Error("No invoice data provided");
    const t = i18n[lang] || i18n.es;

    const doc = new PDFDocument({
        margin: 50,
        pdfVersion: '1.7',
        lang: lang,
        tagged: true,
        displayTitle: true,
        size: 'A4'
    });

    const boldFont = 'Helvetica-Bold';
    const regularFont = 'Helvetica';

    // HEADER
    doc.fontSize(10).font(regularFont).text(t.invoiceNo, 400, 30, { align: 'right' });
    doc.fontSize(14).font(boldFont).text(`${invoice.serie || ''}${invoice.numero}`, 400, 45, { align: 'right' });
    doc.fontSize(10).font(regularFont).text(t.invoice + ' ' + (invoice.tipo || ''), 400, 65, { align: 'right' });

    doc.moveTo(50, 80).lineTo(550, 80).lineWidth(0.5).stroke();

    // SELLER / BUYER COLUMNS
    const colLeft = 50;
    const colRight = 350;
    let y = 95;

    // Seller
    doc.fontSize(12).font(boldFont).text(t.seller, colLeft, y);
    doc.fontSize(8).font(boldFont).text(t.vatId + ' ' + (invoice.emisor_nif || ''), colLeft, y + 20);
    doc.font(regularFont).text(invoice.emisor_nombre || '', colLeft, y + 35);

    doc.fontSize(8).font(boldFont).text(t.address, colLeft, y + 55);
    doc.font(regularFont).text(invoice.emisor_direccion || '', colLeft, y + 65);
    doc.text(`${invoice.emisor_cp || ''} ${invoice.emisor_poblacion || ''} ${invoice.emisor_pais || ''}`, colLeft, y + 75);

    doc.fontSize(8).font(boldFont).text(t.contact, colLeft, y + 95);
    doc.font(regularFont).text(`Email: ${invoice.emisor_email || ''}`, colLeft, y + 105);
    doc.text(`Tel: ${invoice.emisor_telefono || ''}`, colLeft, y + 115);

    // Buyer
    doc.fontSize(12).font(boldFont).text(t.buyer, colRight, y);
    doc.fontSize(8).font(boldFont).text(t.vatId + ' ' + (invoice.receptor_nif || ''), colRight, y + 20);
    doc.font(regularFont).text(invoice.receptor_nombre || '', colRight, y + 35);

    doc.fontSize(8).font(boldFont).text(t.address, colRight, y + 55);
    doc.font(regularFont).text(invoice.receptor_direccion || '', colRight, y + 65);
    doc.text(`${invoice.receptor_cp || ''} ${invoice.receptor_poblacion || ''} ${invoice.receptor_pais || ''}`, colRight, y + 75);

    // DETAILS SECTION
    y = 200;
    doc.moveTo(50, 190).lineTo(550, 190).stroke();
    doc.fontSize(11).font(boldFont).text(t.details, 50, y);
    doc.fontSize(9).font(boldFont).text(t.date + ': ', 50, y + 20);
    doc.font(regularFont).text(new Date(invoice.fecha_emision).toLocaleDateString(), 130, y + 20);

    // Additional Description Placehoder (Table style)
    y += 40;
    doc.fontSize(11).font(boldFont).text(t.description, 50, y);

    // Simple table for description
    y += 20;
    doc.rect(50, y, 500, 20).fill('#f0f0f0').stroke();
    doc.fillColor('black').fontSize(8).font(boldFont).text(t.tableNo, 55, y + 5);
    doc.text("Info", 100, y + 5);

    // Sample rows based on prompt example
    y += 20;
    doc.rect(50, y, 500, 20).stroke();
    doc.font(regularFont).text("1", 55, y + 5);
    doc.text(invoice.notas || "N/A", 100, y + 5);

    // LINE ITEMS TABLE
    y += 40;
    doc.fontSize(9).font(boldFont).text("Items in " + (invoice.moneda || 'EUR'), 50, y - 15);

    // Table Header
    const cols = {
        no: 50,
        name: 80,
        qty: 300,
        unit: 340,
        price: 380,
        tax: 440,
        net: 490
    };

    doc.rect(50, y, 500, 25).fill('#e0e0e0').stroke();
    doc.fillColor('black').font(boldFont).fontSize(8);
    doc.text(t.tableNo, cols.no + 2, y + 8);
    doc.text(t.tableName, cols.name, y + 8);
    doc.text(t.tableQty, cols.qty, y + 8, { width: 30, align: 'right' });
    doc.text(t.tableUnit, cols.unit, y + 8, { width: 30, align: 'center' });
    doc.text(t.tablePrice, cols.price, y + 8, { width: 50, align: 'right' });
    doc.text(t.tableTax, cols.tax, y + 8, { width: 40, align: 'right' });
    doc.text(t.tableNet, cols.net, y + 8, { width: 50, align: 'right' });

    y += 25;
    doc.font(regularFont);
    let totalTaxBase = 0;
    let totalTaxAmount = 0;

    (invoice.lineas || []).forEach((line, index) => {
        const h = 20;
        // Striped rows? Maybe just borders for now as per template
        doc.rect(50, y, 500, h).stroke();

        doc.text((index + 1).toString(), cols.no + 2, y + 5);
        doc.text(line.descripcion || '', cols.name, y + 5, { width: 210, height: h - 5, ellipsis: true });
        doc.text(parseFloat(line.cantidad).toString(), cols.qty, y + 5, { width: 30, align: 'right' });
        doc.text('ud', cols.unit, y + 5, { width: 30, align: 'center' });
        doc.text(parseFloat(line.precio_unitario).toFixed(2), cols.price, y + 5, { width: 50, align: 'right' });
        doc.text((line.porcentaje_impuesto || 0) + '%', cols.tax, y + 5, { width: 40, align: 'right' });
        doc.text(parseFloat(line.total_linea).toFixed(2), cols.net, y + 5, { width: 50, align: 'right' });

        y += h;

        // Accumulate tax
        // Simple logic assuming 1 tax rate per line. Real implementations need tax breakdown.
        // We will calculate summary from invoice totals for now.
    });

    // Total Net below table
    y += 10;
    doc.font(boldFont).fontSize(10);
    doc.text(t.totalNet + ' ' + parseFloat(invoice.total).toFixed(2) + ' ' + (invoice.moneda || 'EUR'), 300, y, { align: 'right', width: 240 });

    // TAX SUMMARY
    y += 30;
    doc.fontSize(11).font(boldFont).text(t.taxSummary, 50, y);
    y += 20;

    // Tax Table Header
    doc.rect(50, y, 500, 20).fill('#f0f0f0').stroke();
    doc.fillColor('black').fontSize(8);
    doc.text(t.taxRate, 55, y + 5);
    doc.text(t.netAmount, 150, y + 5);
    doc.text(t.taxAmount, 300, y + 5);
    doc.text(t.grossAmount, 450, y + 5);

    y += 20;
    // Row (using total invoice values for simplicity as we don't have broken down tax analysis in this object easily without recalc)
    doc.rect(50, y, 500, 20).stroke();
    doc.font(regularFont);
    // Assuming mostly one tax rate or just showing totals in one row as 'Standard'
    doc.text("Standard", 55, y + 5);
    doc.text(parseFloat(invoice.subtotal).toFixed(2), 150, y + 5);
    doc.text(parseFloat(invoice.impuestos_totales).toFixed(2), 300, y + 5);
    doc.text(parseFloat(invoice.total).toFixed(2), 450, y + 5);

    // PAYMENT
    y += 40;
    doc.fontSize(11).font(boldFont).text(t.payment, 50, y);
    y += 20;
    doc.fontSize(9).font(regularFont);
    doc.text(t.paymentMethod + ' ' + (invoice.metodo_pago || 'Transfer'), 50, y);
    if (invoice.fecha_vencimiento) {
        doc.text(t.dueDate + ' ' + new Date(invoice.fecha_vencimiento).toLocaleDateString(), 50, y + 15);
    }

    // ACCOUNT NUMBER
    y += 40;
    doc.fontSize(11).font(boldFont).text(t.accountNo, 50, y);
    y += 20;
    doc.rect(50, y, 300, 25).stroke();
    doc.font(regularFont).fontSize(10).text("IBAN: " + "ESXX XXXX XXXX XXXX XXXX", 60, y + 8); // Placeholder or from emisor details if available

    // FOOTER
    doc.fontSize(7).text(t.footer, 50, doc.page.height - 40, { align: 'center' });

    return doc;
}

/**
 * Generate Factur-X PDF (PDF with embedded XML)
 * @param {Object} invoice - Invoice data
 * @param {string} xmlContent - UBL 2.1 XML content
 * @param {string} lang - Language code
 * @returns {PDFDocument} - PDF document stream
 */
function generateFacturX(invoice, xmlContent, lang = 'es') {
    if (!xmlContent) {
        console.warn("Factur-X generation without XML content");
        return generateInvoicePDF(invoice, lang);
    }

    const doc = generateInvoicePDF(invoice, lang);

    // Embed the XML file
    doc.file(Buffer.from(xmlContent), {
        name: 'factur-x.xml',
        type: 'application/xml',
        description: 'Factur-X/ZUGFeRD e-invoice data',
        relationship: 'Alternative',
        creationDate: new Date(),
        modifiedDate: new Date()
    });

    addFacturXMetadata(doc);

    return doc;
}

module.exports = { generateInvoicePDF, generateFacturX };
