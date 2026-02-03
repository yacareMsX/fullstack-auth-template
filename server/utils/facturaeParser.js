const { DOMParser } = require('xmldom');
const xpath = require('xpath');

/**
 * Parses FacturaE XML content and extracts relevant invoice data
 * @param {string} xmlContent - The XML string
 * @returns {object} Extracted data: { numero, serie, fecha_emision, emisor, receptor, total, subtotal, impuestos, lineas }
 */
function parseFacturaE(xmlContent) {
    const doc = new DOMParser().parseFromString(xmlContent);

    // Helper for XPath with local-name to avoid namespace version issues (v3.2, v3.2.1, etc)
    const ln = (name) => `*[local-name()='${name}']`;

    const select = (path, node = doc) => {
        try {
            return xpath.select(path, node);
        } catch (e) {
            console.error("XPath Error:", e);
            return [];
        }
    };

    // Root should be Facturae
    const root = select(`/*[local-name()='Facturae']`, doc)[0];
    if (!root) throw new Error("Invalid FacturaE XML: Root element 'Facturae' not found");

    // Parties
    const parties = select(`${ln('Parties')}`, root)[0];
    if (!parties) throw new Error("Invalid FacturaE XML: 'Parties' element not found");

    const seller = select(`${ln('SellerParty')}`, parties)[0];
    const buyer = select(`${ln('BuyerParty')}`, parties)[0];

    const extractParty = (partyNode) => {
        if (!partyNode) return null;
        const taxIdNode = select(`${ln('TaxIdentification')}/${ln('TaxIdentificationNumber')}`, partyNode)[0];
        const legalNode = select(`${ln('LegalEntity')}/${ln('CorporateName')}`, partyNode)[0];
        // Fallback for individuals
        const individualName = select(`${ln('Individual')}/${ln('Name')}`, partyNode)[0];
        const individualSurname = select(`${ln('Individual')}/${ln('FirstSurname')}`, partyNode)[0];

        const nif = taxIdNode?.textContent?.trim();
        let name = legalNode?.textContent?.trim();
        if (!name && individualName) {
            name = `${individualName.textContent} ${individualSurname ? individualSurname.textContent : ''}`.trim();
        }

        // Address (simplified)
        const address = select(`${ln('LegalEntity')}/${ln('AddressInSpain')}/${ln('Address')}`, partyNode)[0]?.textContent?.trim();

        return { nif, name, address };
    };

    const emisor = extractParty(seller);
    const receptor = extractParty(buyer);

    // Invoice Details (Taking the first invoice usually, FacturaE can have batches)
    const invoices = select(`${ln('Invoices')}/${ln('Invoice')}`, root);
    if (!invoices.length) throw new Error("No Invoice element found");
    const invoice = invoices[0]; // Process first invoice

    const header = select(`${ln('InvoiceHeader')}`, invoice)[0];
    const issueData = select(`${ln('InvoiceIssueData')}`, invoice)[0];

    const numero = select(`${ln('InvoiceNumber')}`, header)[0]?.textContent?.trim();
    const serie = select(`${ln('InvoiceSeriesCode')}`, header)[0]?.textContent?.trim();
    const fecha = (select(`${ln('IssueDate')}`, issueData)[0] || select(`${ln('IssueDate')}`, header)[0])?.textContent?.trim();

    // Totals
    const totals = select(`${ln('InvoiceTotals')}`, invoice)[0];
    const total = select(`${ln('InvoiceTotal')}`, totals)[0]?.textContent?.trim();
    const subtotal = select(`${ln('TotalGrossAmount')}`, totals)[0]?.textContent?.trim() ||
        select(`${ln('TotalGrossAmountBeforeTaxes')}`, totals)[0]?.textContent?.trim();
    const taxTotal = select(`${ln('TotalTaxOutputs')}`, totals)[0]?.textContent?.trim();

    // Lines
    const items = select(`${ln('Items')}/${ln('InvoiceLine')}`, invoice);
    const lineas = items.map(item => {
        const desc = select(`${ln('ItemDescription')}`, item)[0]?.textContent?.trim();
        const qty = select(`${ln('Quantity')}`, item)[0]?.textContent?.trim();
        const price = select(`${ln('UnitPriceWithoutTax')}`, item)[0]?.textContent?.trim();
        const totalLine = select(`${ln('TotalCost')}`, item)[0]?.textContent?.trim();

        // Taxes for line
        const taxRate = select(`${ln('TaxesOutputs')}/${ln('Tax')}/${ln('TaxRate')}`, item)[0]?.textContent?.trim();
        const taxAmount = select(`${ln('TaxesOutputs')}/${ln('Tax')}/${ln('TaxAmount')}`, item)[0]?.textContent?.trim();

        return {
            descripcion: desc,
            cantidad: parseFloat(qty || 0),
            precio_unitario: parseFloat(price || 0),
            total_linea: parseFloat(totalLine || 0),
            porcentaje_impuesto: parseFloat(taxRate || 0),
            importe_impuesto: parseFloat(taxAmount || 0)
        };
    });

    return {
        numero,
        serie,
        fecha_emision: fecha,
        emisor,
        receptor,
        total: parseFloat(total || 0),
        subtotal: parseFloat(subtotal || 0),
        impuestos: parseFloat(taxTotal || 0),
        lineas
    };
}

module.exports = { parseFacturaE };
