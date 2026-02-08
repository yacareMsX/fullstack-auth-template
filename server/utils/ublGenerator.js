/**
 * Utility to generate UBL 2.1 XML for an invoice
 */
function generateUBLXML(invoice) {
    // Helper to escape XML characters
    const escapeXml = (unsafe) => {
        if (!unsafe) return "";
        return unsafe.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    // Helper to format date YYYY-MM-DD
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return ""; // Handle Invalid Date
            return date.toISOString().split('T')[0];
        } catch (e) {
            console.error("Error formatting date:", dateStr, e);
            return "";
        }
    };

    // Helper to format number with 2 decimals
    const formatNumber = (num) => {
        if (num === null || num === undefined || isNaN(num)) return "0.00";
        return parseFloat(num).toFixed(2);
    };

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" \n';
    xml += 'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" \n';
    xml += 'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n';

    xml += '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n';
    xml += '  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>\n';
    xml += '  <cbc:ID>' + escapeXml(invoice.numero) + '</cbc:ID>\n';
    xml += '  <cbc:IssueDate>' + formatDate(invoice.fecha_emision) + '</cbc:IssueDate>\n';
    xml += '  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>\n';
    xml += '  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>\n';

    // Supplier
    xml += '  <cac:AccountingSupplierParty>\n';
    xml += '    <cac:Party>\n';
    xml += '      <cac:PartyName>\n';
    xml += '        <cbc:Name>' + escapeXml(invoice.emisor_nombre || "Unknown") + '</cbc:Name>\n';
    xml += '      </cac:PartyName>\n';
    xml += '      <cac:PartyTaxScheme>\n';
    xml += '        <cbc:CompanyID>' + escapeXml(invoice.emisor_nif || "UNKNOWN") + '</cbc:CompanyID>\n';
    xml += '        <cac:TaxScheme>\n';
    xml += '          <cbc:ID>VAT</cbc:ID>\n';
    xml += '        </cac:TaxScheme>\n';
    xml += '      </cac:PartyTaxScheme>\n';
    xml += '    </cac:Party>\n';
    xml += '  </cac:AccountingSupplierParty>\n';

    // Customer
    xml += '  <cac:AccountingCustomerParty>\n';
    xml += '    <cac:Party>\n';
    xml += '      <cac:PartyName>\n';
    xml += '        <cbc:Name>' + escapeXml(invoice.receptor_nombre || "Unknown") + '</cbc:Name>\n';
    xml += '      </cac:PartyName>\n';
    xml += '      <cac:PartyTaxScheme>\n';
    xml += '        <cbc:CompanyID>' + escapeXml(invoice.receptor_nif || "UNKNOWN") + '</cbc:CompanyID>\n';
    xml += '        <cac:TaxScheme>\n';
    xml += '          <cbc:ID>VAT</cbc:ID>\n';
    xml += '        </cac:TaxScheme>\n';
    xml += '      </cac:PartyTaxScheme>\n';
    xml += '    </cac:Party>\n';
    xml += '  </cac:AccountingCustomerParty>\n';

    // Tax Total
    xml += '  <cac:TaxTotal>\n';
    xml += '    <cbc:TaxAmount currencyID="EUR">' + formatNumber(invoice.impuestos_totales) + '</cbc:TaxAmount>\n';
    xml += '    <cac:TaxSubtotal>\n';
    xml += '      <cbc:TaxableAmount currencyID="EUR">' + formatNumber(invoice.subtotal) + '</cbc:TaxableAmount>\n';
    xml += '      <cbc:TaxAmount currencyID="EUR">' + formatNumber(invoice.impuestos_totales) + '</cbc:TaxAmount>\n';
    xml += '      <cac:TaxScheme>\n';
    xml += '        <cbc:ID>VAT</cbc:ID>\n';
    xml += '      </cac:TaxScheme>\n';
    xml += '    </cac:TaxSubtotal>\n';
    xml += '  </cac:TaxTotal>\n';

    // Legal Monetary Total
    xml += '  <cac:LegalMonetaryTotal>\n';
    xml += '    <cbc:LineExtensionAmount currencyID="EUR">' + formatNumber(invoice.subtotal) + '</cbc:LineExtensionAmount>\n';
    xml += '    <cbc:TaxExclusiveAmount currencyID="EUR">' + formatNumber(invoice.subtotal) + '</cbc:TaxExclusiveAmount>\n';
    xml += '    <cbc:TaxInclusiveAmount currencyID="EUR">' + formatNumber(invoice.total) + '</cbc:TaxInclusiveAmount>\n';
    xml += '    <cbc:PayableAmount currencyID="EUR">' + formatNumber(invoice.total) + '</cbc:PayableAmount>\n';
    xml += '  </cac:LegalMonetaryTotal>\n';

    // Invoice Lines
    if (invoice.lineas && Array.isArray(invoice.lineas)) {
        invoice.lineas.forEach((line, index) => {
            xml += '  <cac:InvoiceLine>\n';
            xml += '    <cbc:ID>' + (index + 1) + '</cbc:ID>\n';
            xml += '    <cbc:InvoicedQuantity unitCode="EA">' + formatNumber(line.cantidad) + '</cbc:InvoicedQuantity>\n';
            xml += '    <cbc:LineExtensionAmount currencyID="EUR">' + formatNumber(line.total_linea) + '</cbc:LineExtensionAmount>\n';
            xml += '    <cac:Item>\n';
            xml += '      <cbc:Name>' + escapeXml(line.descripcion || '') + '</cbc:Name>\n';
            xml += '      <cac:ClassifiedTaxCategory>\n';
            xml += '        <cbc:ID>S</cbc:ID>\n';
            xml += '        <cbc:Percent>' + formatNumber(line.porcentaje_impuesto) + '</cbc:Percent>\n';
            xml += '        <cac:TaxScheme>\n';
            xml += '          <cbc:ID>VAT</cbc:ID>\n';
            xml += '        </cac:TaxScheme>\n';
            xml += '      </cac:ClassifiedTaxCategory>\n';
            xml += '    </cac:Item>\n';
            xml += '    <cac:Price>\n';
            xml += '      <cbc:PriceAmount currencyID="EUR">' + formatNumber(line.precio_unitario) + '</cbc:PriceAmount>\n';
            xml += '    </cac:Price>\n';
            xml += '  </cac:InvoiceLine>\n';
        });
    }

    xml += '</Invoice>';
    return xml;
}

module.exports = { generateUBLXML };
